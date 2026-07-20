/**
 * Non-destructive MongoDB copy migration (preserves ObjectId, Date, etc.).
 *
 * Env (in .env or .env.local):
 *   MONGODB_URI_SOURCE, MONGODB_DB_SOURCE  — old cluster / DB (read-only for dump)
 *   MONGODB_URI_DEST, MONGODB_DB_DEST      — new cluster / DB (must be empty for restore/copy)
 *
 * Commands:
 *   node scripts/migrate-mongodb.mjs dump     → ./aor-migration-dump (EJSON, read-only on source)
 *   node scripts/migrate-mongodb.mjs restore  → writes dest only (from EJSON dump)
 *   node scripts/migrate-mongodb.mjs copy     → direct BSON copy (default; no JSON round-trip)
 *   node scripts/migrate-mongodb.mjs verify   → counts + BSON type checks on dest
 */
import { MongoClient, ObjectId } from "mongodb";
import { EJSON } from "bson";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DUMP_DIR = resolve(__dirname, "..", "aor-migration-dump");
const BATCH_SIZE = 500;

const COLLECTIONS = [
  "profiles",
  "cohort_stats",
  "cohort_calibration",
  "milestone_pace",
  "community_posts",
];

function loadEnvFile() {
  const root = resolve(__dirname, "..");
  for (const name of [".env.local", ".env"]) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function dbNameFromUri(uri) {
  try {
    const u = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "http://"));
    const path = u.pathname.replace(/^\//, "").split("/")[0];
    return path || undefined;
  } catch {
    return undefined;
  }
}

function resolveConfig() {
  const uriSource =
    process.env.MONGODB_URI_SOURCE?.trim() ||
    process.env.MONGODB_URI_OLD?.trim() ||
    process.env.MONGODB_URI?.trim();
  const uriDest =
    process.env.MONGODB_URI_DEST?.trim() ||
    process.env.MONGODB_URI_NEW?.trim();
  if (!uriSource) {
    throw new Error(
      "Set MONGODB_URI_SOURCE (or MONGODB_URI) for the source cluster.",
    );
  }
  const dbSource =
    process.env.MONGODB_DB_SOURCE?.trim() ||
    dbNameFromUri(uriSource) ||
    "aor-tracker-dev";
  const dbDest =
    process.env.MONGODB_DB_DEST?.trim() ||
    (uriDest ? dbNameFromUri(uriDest) : undefined) ||
    "aor-tracker-dev";
  return { uriSource, uriDest, dbSource, dbDest };
}

function maskUri(uri) {
  try {
    const u = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "http://"));
    return `${u.hostname}${u.pathname}`;
  } catch {
    return "(uri)";
  }
}

function isObjectId(value) {
  return value instanceof ObjectId;
}

function isDate(value) {
  return value instanceof Date;
}

async function countAll(db) {
  const out = {};
  for (const name of COLLECTIONS) {
    out[name] = await db.collection(name).countDocuments();
  }
  return out;
}

async function assertDestEmpty(db, dbDest) {
  const destCounts = await countAll(db);
  const destTotal = Object.values(destCounts).reduce((a, b) => a + b, 0);
  if (destTotal > 0) {
    throw new Error(
      `Destination ${dbDest} is not empty (${destTotal} docs). Aborting to avoid duplicates.`,
    );
  }
}

async function insertBatched(col, docs) {
  if (!docs.length) return 0;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    await col.insertMany(batch, { ordered: false });
    inserted += batch.length;
  }
  return inserted;
}

async function dump(config) {
  const { uriSource, dbSource } = config;
  console.log(`Dump (read-only, EJSON): ${dbSource} @ ${maskUri(uriSource)}`);
  const client = new MongoClient(uriSource);
  await client.connect();
  const db = client.db(dbSource);
  const outDir = resolve(DUMP_DIR, dbSource);
  mkdirSync(outDir, { recursive: true });

  for (const name of COLLECTIONS) {
    const docs = await db.collection(name).find({}).toArray();
    const file = resolve(outDir, `${name}.json`);
    writeFileSync(file, EJSON.stringify(docs, { relaxed: false }));
    console.log(`  ${name}: ${docs.length} → ${file}`);
  }
  writeFileSync(
    resolve(DUMP_DIR, "manifest.json"),
    JSON.stringify({ dbSource, dumpedAt: new Date().toISOString() }, null, 2),
  );
  await client.close();
  console.log(`\nDump saved under ${outDir}. Source database was not modified.`);
}

async function restore(config) {
  const { uriDest, dbDest, dbSource } = config;
  if (!uriDest) {
    throw new Error("Set MONGODB_URI_DEST (or MONGODB_URI_NEW) for restore.");
  }
  console.log(`Restore (EJSON): ${dbDest} @ ${maskUri(uriDest)}`);
  const inDir = resolve(DUMP_DIR, dbSource);
  if (!existsSync(inDir)) {
    throw new Error(`Missing dump folder: ${inDir}. Run dump first.`);
  }

  const client = new MongoClient(uriDest);
  await client.connect();
  const db = client.db(dbDest);
  await assertDestEmpty(db, dbDest);

  for (const name of COLLECTIONS) {
    const file = resolve(inDir, `${name}.json`);
    if (!existsSync(file)) {
      console.log(`  ${name}: no dump file (skip)`);
      continue;
    }
    const docs = EJSON.parse(readFileSync(file, "utf8"));
    if (!docs.length) {
      console.log(`  ${name}: 0 documents`);
      continue;
    }
    const n = await insertBatched(db.collection(name), docs);
    console.log(`  ${name}: ${n} inserted`);
  }
  await client.close();
  console.log("\nRestore complete. Source database was not modified.");
}

async function copyDirect(config) {
  const { uriSource, uriDest, dbSource, dbDest } = config;
  if (!uriDest) {
    throw new Error("Set MONGODB_URI_DEST (or MONGODB_URI_NEW) for copy.");
  }
  console.log(`Copy (direct BSON): ${dbSource} → ${dbDest}`);
  console.log(`  source: ${maskUri(uriSource)}`);
  console.log(`  dest:   ${maskUri(uriDest)}`);

  const srcClient = new MongoClient(uriSource);
  const destClient = new MongoClient(uriDest);
  await srcClient.connect();
  await destClient.connect();
  const srcDb = srcClient.db(dbSource);
  const destDb = destClient.db(dbDest);
  await assertDestEmpty(destDb, dbDest);

  for (const name of COLLECTIONS) {
    const docs = await srcDb.collection(name).find({}).toArray();
    if (!docs.length) {
      console.log(`  ${name}: 0 documents (skip)`);
      continue;
    }
    const n = await insertBatched(destDb.collection(name), docs);
    console.log(`  ${name}: ${n}/${docs.length} copied`);
  }

  await srcClient.close();
  await destClient.close();
  console.log("\nCopy complete. Source database was not modified.");
}

async function verifyDestTypes(destDb, dbDest) {
  const errors = [];
  const posts = destDb.collection("community_posts");
    const top = await posts.findOne({});
    if (top) {
      if (!isObjectId(top._id)) {
        errors.push(`community_posts._id is ${typeof top._id}, expected ObjectId`);
      }
      if (top.createdAt != null && !isDate(top.createdAt)) {
        errors.push(
          `community_posts.createdAt is ${typeof top.createdAt}, expected Date`,
        );
      }
    }

    const reply = await posts.findOne({ replyToId: { $exists: true } });
    if (reply) {
      if (!isObjectId(reply._id)) {
        errors.push(`reply._id is ${typeof reply._id}, expected ObjectId`);
      }
      if (!isObjectId(reply.replyToId)) {
        errors.push(
          `reply.replyToId is ${typeof reply.replyToId}, expected ObjectId`,
        );
      }
    } else if ((await posts.countDocuments()) > 0) {
      console.log("  (no reply docs with replyToId — skipped reply type check)");
    }

    const profile = await destDb.collection("profiles").findOne({});
    if (profile?.createdAt != null && !isDate(profile.createdAt)) {
      errors.push(
        `profiles.createdAt is ${typeof profile.createdAt}, expected Date`,
      );
    }

    if (errors.length) {
      throw new Error(
        `BSON type check failed on ${dbDest}:\n  - ${errors.join("\n  - ")}`,
      );
    }
  console.log("BSON types on dest: ok (_id/replyToId ObjectId, dates Date)");
}

async function verify(config) {
  const { uriSource, uriDest, dbSource, dbDest } = config;
  if (!uriDest) throw new Error("Set MONGODB_URI_DEST for verify.");
  const srcClient = new MongoClient(uriSource);
  const destClient = new MongoClient(uriDest);
  await srcClient.connect();
  await destClient.connect();
  const destDb = destClient.db(dbDest);
  const srcCounts = await countAll(srcClient.db(dbSource));
  const destCounts = await countAll(destDb);
  console.log("Collection counts (source → dest):");
  let ok = true;
  for (const name of COLLECTIONS) {
    const match = srcCounts[name] === destCounts[name];
    if (!match) ok = false;
    console.log(
      `  ${name}: ${srcCounts[name]} → ${destCounts[name]} ${match ? "ok" : "MISMATCH"}`,
    );
  }

  await verifyDestTypes(destDb, dbDest);

  const sample = await destDb.collection("profiles").findOne({});
  if (sample) {
    console.log("\nSample profile on dest:", {
      emailNorm: sample.emailNorm,
      cohortKey: sample.cohortKey,
      _idType: sample._id?.constructor?.name ?? typeof sample._id,
    });
  }

  await srcClient.close();
  await destClient.close();
  if (!ok) process.exit(1);
  console.log("\nVerify passed.");
}

async function main() {
  loadEnvFile();
  const config = resolveConfig();
  const cmd = process.argv[2] || "copy";
  console.log(`Mode: ${cmd}\n`);

  switch (cmd) {
    case "dump":
      await dump(config);
      break;
    case "restore":
      await restore(config);
      break;
    case "copy":
      await copyDirect(config);
      break;
    case "verify":
      await verify(config);
      break;
    default:
      throw new Error(`Unknown command: ${cmd}. Use dump|restore|copy|verify.`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
