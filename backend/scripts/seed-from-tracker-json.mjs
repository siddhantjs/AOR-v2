#!/usr/bin/env node
/**
 * Seed AOR-v2 users from tracker-json/*.json (SCHEMA_V3 User shape).
 *
 * Upserts by caseNo with seededData: true into the `users` collection.
 * Creates/updates `cohorts` and sets user.cohortKey → Cohort._id.
 * Preview by default; pass --apply to write.
 *
 * Usage:
 *   node scripts/seed-from-tracker-json.mjs
 *   node scripts/seed-from-tracker-json.mjs --apply
 *   node scripts/seed-from-tracker-json.mjs --apply --no-sync
 *   npm run tracker:seed
 *   npm run tracker:seed:apply
 *
 * Env: MONGODB_URI, MONGODB_DB_NAME (fallback MONGODB_DB → aor-v2)
 *
 * Output: tracker-seed-applied.json
 */

import fs from "node:fs";
import path from "node:path";
import { MongoClient, ObjectId } from "mongodb";
import { repoRoot as root, loadEnvFiles } from "./lib/paths.mjs";
import {
  aorMonthFromIso,
  buildCohortKeyString,
  buildProfileMilestones,
  decodeRow,
  isoToDate,
  PROFILE_MILESTONE_IDS,
} from "./lib/tracker-decode.mjs";

const inDir = path.join(root, "tracker-json");
const outPath = path.join(root, "tracker-seed-applied.json");
const BATCH_SIZE = 500;

const apply = process.argv.includes("--apply");
const runSync = apply && !process.argv.includes("--no-sync");

function loadEnv() {
  loadEnvFiles();
}

function resolveDbName() {
  return process.env.MONGODB_DB_NAME?.trim() || process.env.MONGODB_DB?.trim() || "aor-v2";
}

function loadTrackerRows() {
  if (!fs.existsSync(inDir)) {
    throw new Error(`Missing ${inDir}. Run npm run tracker:fetch first.`);
  }
  const files = fs
    .readdirSync(inDir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  /** @type {Map<string, NonNullable<ReturnType<typeof decodeRow>>>} */
  const byCase = new Map();
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(inDir, file), "utf8"));
    for (const row of data.values ?? []) {
      const decoded = decodeRow(row);
      if (decoded) byCase.set(decoded.caseNo, decoded);
    }
  }
  return { files: files.length, byCase };
}

/** @param {string} username @param {string} caseNo */
function syntheticEmail(username, caseNo) {
  const userSlug = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
  const caseSlug = caseNo
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  const local = (userSlug || "user") + "." + caseSlug;
  return `${local}@seeded.aortrack.app`;
}

/** @param {string} email */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * @param {import("mongodb").Db} db
 * @param {string} cohortKeyStr
 * @param {string} aorMonth
 * @param {"inland"|"outland"} applyingFrom
 * @param {Map<string, import("mongodb").ObjectId>} cache
 */
async function ensureCohort(db, cohortKeyStr, aorMonth, applyingFrom, cache) {
  const hit = cache.get(cohortKeyStr);
  if (hit) return hit;

  const col = db.collection("cohorts");
  const existing = await col.findOne({ cohortKey: cohortKeyStr }, { projection: { _id: 1 } });
  if (existing) {
    cache.set(cohortKeyStr, existing._id);
    return existing._id;
  }

  const _id = new ObjectId();
  try {
    await col.insertOne({
      _id,
      cohortKey: cohortKeyStr,
      aorMonth,
      applyingFrom,
      nApplicants: 0,
      nCompleted: 0,
      nWaiting: 0,
      dominantStage: null,
      stageDistribution: {},
      lastUpdated: new Date(),
    });
    cache.set(cohortKeyStr, _id);
    return _id;
  } catch (err) {
    // Race: another insert won unique index
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      const again = await col.findOne({ cohortKey: cohortKeyStr }, { projection: { _id: 1 } });
      if (again) {
        cache.set(cohortKeyStr, again._id);
        return again._id;
      }
    }
    throw err;
  }
}

/**
 * Recount cohort stats from seeded + live users pointing at each cohort.
 * @param {import("mongodb").Db} db
 * @param {string[]} cohortKeyStrings
 */
async function recountCohorts(db, cohortKeyStrings) {
  const users = db.collection("users");
  const cohorts = db.collection("cohorts");
  let updated = 0;

  for (const keyStr of cohortKeyStrings) {
    const cohort = await cohorts.findOne({ cohortKey: keyStr });
    if (!cohort) continue;

    const members = await users
      .find({ cohortKey: cohort._id }, { projection: { milestones: 1 } })
      .toArray();

    /** @type {Record<string, number>} */
    const stageDistribution = {};
    for (const id of PROFILE_MILESTONE_IDS) stageDistribution[id] = 0;

    let nCompleted = 0;
    for (const u of members) {
      /** @type {Partial<Record<string, string>>} */
      const logged = {};
      for (const row of u.milestones ?? []) {
        if (row?.milestoneId && row.milestoneDate) {
          logged[row.milestoneId] = row.milestoneDate;
        }
      }
      if (logged.ecopr) nCompleted++;

      let furthest = null;
      for (const id of PROFILE_MILESTONE_IDS) {
        if (logged[id]) furthest = id;
      }
      if (furthest) stageDistribution[furthest]++;
    }

    const nApplicants = members.length;
    const nWaiting = Math.max(0, nApplicants - nCompleted);

    let dominantStage = null;
    let best = 0;
    for (const id of PROFILE_MILESTONE_IDS) {
      const n = stageDistribution[id] ?? 0;
      if (n > best) {
        best = n;
        dominantStage = id;
      }
    }

    await cohorts.updateOne(
      { _id: cohort._id },
      {
        $set: {
          nApplicants,
          nCompleted,
          nWaiting,
          dominantStage,
          stageDistribution,
          lastUpdated: new Date(),
        },
      },
    );
    updated++;
  }

  return { cohortsUpdated: updated };
}

/** @param {import("mongodb").Collection} col @param {import("mongodb").AnyBulkWriteOperation[]} ops */
async function bulkWriteBatched(col, ops) {
  let upserted = 0;
  let modified = 0;
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = ops.slice(i, i + BATCH_SIZE);
    const result = await col.bulkWrite(batch, { ordered: false });
    upserted += result.upsertedCount;
    modified += result.modifiedCount;
  }
  return { upserted, modified };
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  const dbName = resolveDbName();

  const { files, byCase } = loadTrackerRows();
  const now = new Date();
  /** @type {import("mongodb").AnyBulkWriteOperation[]} */
  const ops = [];
  /** @type {string[]} parallel to ops — cohortKey string for each op */
  const opCohortKeys = [];
  /** @type {{ row: number, reason: string }[]} */
  const errors = [];
  /** @type {Map<string, { aorMonth: string, applyingFrom: "inland"|"outland" }>} */
  const cohortMeta = new Map();
  const itaSources = { ita: 0, submitted: 0, "aor-minus-1": 0 };

  let rowsRead = 0;
  let skipped = 0;

  for (const decoded of byCase.values()) {
    rowsRead++;
    const { caseNo, username } = decoded;

    if (!username) {
      skipped++;
      errors.push({ row: rowsRead, reason: `missing username (${caseNo})` });
      continue;
    }

    const email = syntheticEmail(username, caseNo);
    if (!isValidEmail(email)) {
      skipped++;
      errors.push({ row: rowsRead, reason: `invalid synthetic email (${caseNo})` });
      continue;
    }

    const aorMonth = aorMonthFromIso(decoded.aorDate);
    const cohortKeyStr = buildCohortKeyString(aorMonth, decoded.applyingFrom);
    cohortMeta.set(cohortKeyStr, {
      aorMonth,
      applyingFrom: decoded.applyingFrom,
    });
    itaSources[decoded.itaSource] = (itaSources[decoded.itaSource] ?? 0) + 1;

    const milestones = buildProfileMilestones(decoded.milestoneDates);
    const emailNorm = email.toLowerCase();

    ops.push({
      updateOne: {
        filter: { caseNo },
        update: {
          $set: {
            caseNo,
            username,
            email,
            emailNorm,
            seededData: true,
            shareToken: null,
            applyingFrom: decoded.applyingFrom,
            pathway: decoded.pathway,
            expressEntryProgram: decoded.expressEntryProgram,
            drawCategory: decoded.drawCategory,
            itaDate: isoToDate(decoded.itaDate),
            aorDate: isoToDate(decoded.aorDate),
            primaryVisaOffice: decoded.primaryVisaOffice,
            secondaryVisaOffice: null,
            milestones,
            currentStatus: decoded.currentStatus,
            userDetails: decoded.userDetails,
            estimateMeta: null,
            purity: null,
            submittedAt: null,
            updatedAt: now,
            // cohortKey ObjectId filled just before write
            cohortKey: null,
          },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    });
    opCohortKeys.push(cohortKeyStr);
  }

  const cohortKeysTouched = [...cohortMeta.keys()].sort();
  let upserted = 0;
  let modified = 0;
  /** @type {Record<string, unknown>|null} */
  let syncResult = null;

  if (apply && ops.length > 0) {
    const client = new MongoClient(uri);
    try {
      await client.connect();
      const db = client.db(dbName);
      const usersCol = db.collection("users");

      /** @type {Map<string, import("mongodb").ObjectId>} */
      const cohortIdCache = new Map();
      for (const [keyStr, meta] of cohortMeta) {
        await ensureCohort(db, keyStr, meta.aorMonth, meta.applyingFrom, cohortIdCache);
      }

      for (let i = 0; i < ops.length; i++) {
        const keyStr = opCohortKeys[i];
        const cohortId = cohortIdCache.get(keyStr);
        if (!cohortId) throw new Error(`Missing cohort id for ${keyStr}`);
        ops[i].updateOne.update.$set.cohortKey = cohortId;
      }

      ({ upserted, modified } = await bulkWriteBatched(usersCol, ops));

      if (runSync) {
        syncResult = await recountCohorts(db, cohortKeysTouched);
      }
    } finally {
      await client.close();
    }
  }

  const report = {
    applied: apply,
    syncedAt: new Date().toISOString(),
    db: dbName,
    collection: "users",
    trackerFiles: files,
    trackerRows: byCase.size,
    rowsRead,
    wouldUpsert: ops.length,
    upserted,
    modified,
    skipped,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
    itaSources,
    cohortKeysTouched: cohortKeysTouched.length,
    cohortKeySamples: cohortKeysTouched.slice(0, 10),
    cohortSync: syncResult,
  };

  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

  const mode = apply ? "APPLIED" : "PREVIEW (pass --apply to write)";
  console.log(`Tracker JSON seed — ${mode}`);
  console.log(`  db:               ${dbName}.users`);
  console.log(`  tracker files:    ${files}`);
  console.log(`  unique cases:     ${byCase.size}`);
  console.log(`  would upsert:     ${ops.length}`);
  console.log(`  skipped:          ${skipped}`);
  console.log(
    `  ita sources:      ita=${itaSources.ita}, submitted=${itaSources.submitted}, aor-1=${itaSources["aor-minus-1"]}`,
  );
  console.log(`  cohorts touched:  ${cohortKeysTouched.length}`);
  if (apply) {
    console.log(`  inserted:         ${upserted}`);
    console.log(`  modified:         ${modified}`);
    if (runSync && syncResult) {
      console.log(`  cohort recount:   ${syncResult.cohortsUpdated} cohorts`);
    } else if (!runSync) {
      console.log(`  cohort sync:      skipped (--no-sync)`);
    }
  } else if (ops.length > 0) {
    console.log(`  Run with --apply to write these users.`);
  }
  console.log(`  report → ${outPath}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
