#!/usr/bin/env node
/**
 * Seed profiles from tracker-json/*.json (profile-schema fields only).
 *
 * Upserts by caseNo with seededData: true. Preview by default; pass --apply to write.
 *
 * Usage:
 *   node scripts/seed-from-tracker-json.mjs
 *   node scripts/seed-from-tracker-json.mjs --apply
 *   node scripts/seed-from-tracker-json.mjs --apply --no-sync
 *   npm run tracker:seed
 *   npm run tracker:seed:apply
 *
 * Output: tracker-seed-applied.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { MongoClient } from "mongodb";
import { decodeRow, MILESTONE_KEYS } from "./lib/tracker-decode.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const inDir = path.join(root, "tracker-json");
const outPath = path.join(root, "tracker-seed-applied.json");
const BATCH_SIZE = 500;

const DEFAULT_STREAM = "CEC";
const DEFAULT_TYPE = "Inland";
const DEFAULT_PROVINCE = "Ontario";

const apply = process.argv.includes("--apply");
const runSync = apply && !process.argv.includes("--no-sync");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;
      const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let value = m[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[m[1]] == null) process.env[m[1]] = value;
    }
  }
}

function loadTrackerRows() {
  if (!fs.existsSync(inDir)) {
    throw new Error(`Missing ${inDir}. Run npm run tracker:fetch first.`);
  }
  const files = fs
    .readdirSync(inDir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  /** @type {Map<string, ReturnType<typeof decodeRow>>} */
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

/** @param {string} aorDate @param {string} stream @param {string} type */
function buildStatsCohortKey(aorDate, stream, type) {
  const d = new Date(`${aorDate}T12:00:00`);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const slug =
    stream === "CEC" || String(stream).startsWith("CEC")
      ? "CEC"
      : stream === "PNP"
        ? "PNP"
        : "FSW";
  const kind = String(type).toLowerCase() === "outland" ? "outland" : "inland";
  return `${slug}:${month}:${year}:${kind}`;
}

/** @param {string} username @param {string} caseNo */
function syntheticEmail(username, caseNo) {
  const usernameNorm = username.trim().toLowerCase().replace(/\s+/g, "");
  const caseNoNorm = caseNo.trim().toLowerCase();
  return `${usernameNorm}${caseNoNorm}@gmail.com`;
}

/** @param {string} email */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** @param {Record<string, string|null>} decodedMilestones @param {string} nowIso */
function buildMilestones(decodedMilestones, nowIso) {
  /** @type {Record<string, { date: string|null, updatedAt: string|null }>} */
  const milestones = {};
  for (const key of MILESTONE_KEYS) {
    const date = decodedMilestones[key] ?? null;
    milestones[key] = {
      date,
      updatedAt: date ? nowIso : null,
    };
  }
  return milestones;
}

/** @param {import("mongodb").AnyBulkWriteOperation[]} ops */
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

/** @param {string[]} cohortKeys */
function runPostSeedSync(cohortKeys) {
  const script = path.join(__dirname, "lib", "post-seed-sync.ts");
  const tsxBin = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
  const args = [tsxBin, script];
  if (cohortKeys.length > 0) {
    args.push(cohortKeys.join(","));
  }
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || "unknown error";
    throw new Error(`Post-seed cohort sync failed: ${detail}`);
  }
  try {
    return JSON.parse(result.stdout?.trim() || "{}");
  } catch {
    return {};
  }
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB?.trim() || "aor-tracker";

  const { files, byCase } = loadTrackerRows();
  const nowIso = new Date().toISOString();
  const now = new Date();
  const cohortKeysSet = new Set();
  /** @type {import("mongodb").AnyBulkWriteOperation[]} */
  const ops = [];
  /** @type {{ row: number, reason: string }[]} */
  const errors = [];
  let rowsRead = 0;
  let skipped = 0;

  for (const decoded of byCase.values()) {
    rowsRead++;
    const { caseNo, username, milestones: decodedMilestones } = decoded;
    const aorDate = decodedMilestones.aor;

    if (!username) {
      skipped++;
      errors.push({ row: rowsRead, reason: `missing username (${caseNo})` });
      continue;
    }
    if (!aorDate) {
      skipped++;
      errors.push({ row: rowsRead, reason: `missing AOR date (${caseNo})` });
      continue;
    }

    const emailNorm = syntheticEmail(username, caseNo);
    if (!isValidEmail(emailNorm)) {
      skipped++;
      errors.push({ row: rowsRead, reason: `invalid synthetic email (${caseNo})` });
      continue;
    }

    const milestones = buildMilestones(decodedMilestones, nowIso);
    const cohortKey = buildStatsCohortKey(aorDate, DEFAULT_STREAM, DEFAULT_TYPE);
    cohortKeysSet.add(cohortKey);

    /** @type {Record<string, unknown>} */
    const $set = {
      caseNo,
      username,
      emailNorm,
      seededData: true,
      aorDate,
      stream: DEFAULT_STREAM,
      type: DEFAULT_TYPE,
      province: DEFAULT_PROVINCE,
      milestones,
      cohortKey,
      updatedAt: now,
    };
    if (decoded.currentStatus) {
      $set.currentStatus = decoded.currentStatus;
    }

    ops.push({
      updateOne: {
        filter: { caseNo },
        update: {
          $set,
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    });
  }

  const cohortKeysTouched = [...cohortKeysSet].sort();
  let upserted = 0;
  let modified = 0;
  /** @type {Record<string, unknown>|null} */
  let syncResult = null;

  if (apply && ops.length > 0) {
    const client = new MongoClient(uri);
    try {
      await client.connect();
      const col = client.db(dbName).collection("profiles");
      ({ upserted, modified } = await bulkWriteBatched(col, ops));
    } finally {
      await client.close();
    }

    if (runSync) {
      syncResult = runPostSeedSync(cohortKeysTouched);
    }
  }

  const report = {
    applied: apply,
    syncedAt: new Date().toISOString(),
    db: dbName,
    trackerFiles: files,
    trackerRows: byCase.size,
    rowsRead,
    wouldUpsert: ops.length,
    upserted,
    modified,
    skipped,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
    cohortKeysTouched: cohortKeysTouched.length,
    cohortSync: syncResult,
  };

  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

  const mode = apply ? "APPLIED" : "PREVIEW (pass --apply to write)";
  console.log(`Tracker JSON seed — ${mode}`);
  console.log(`  tracker files:    ${files}`);
  console.log(`  unique cases:     ${byCase.size}`);
  console.log(`  would upsert:     ${ops.length}`);
  console.log(`  skipped:          ${skipped}`);
  if (apply) {
    console.log(`  inserted:         ${upserted}`);
    console.log(`  modified:         ${modified}`);
    if (runSync && syncResult) {
      console.log(
        `  cohort sync:      ${syncResult.cohortsUpserted ?? "?"} cohorts upserted`,
      );
    } else if (!runSync) {
      console.log(`  cohort sync:      skipped (--no-sync)`);
    }
  } else if (ops.length > 0) {
    console.log(`  Run with --apply to write these profiles.`);
  }
  console.log(`  report → ${outPath}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
