#!/usr/bin/env node
/**
 * Apply tracker milestone updates to existing seeded profiles only.
 * Scope: tracker ∩ seeded (seededData:true, caseNo in tracker-json).
 *
 * Does NOT create or upsert profiles — updateOne only, no upsert flag.
 *
 * Usage:
 *   node scripts/sync-milestones.mjs           # preview (no writes)
 *   node scripts/sync-milestones.mjs --apply   # write to MongoDB
 *   npm run tracker:sync
 *   npm run tracker:sync -- --apply
 *
 * Output: milestone-sync-applied.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import {
  MILESTONE_KEYS,
  decodeRow,
  parseTrackerDate,
  planMilestoneUpdate,
  wouldApply,
} from "./lib/tracker-decode.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const inDir = path.join(root, "tracker-json");
const outPath = path.join(root, "milestone-sync-applied.json");

const apply = process.argv.includes("--apply");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
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

/** @param {unknown} raw */
function normalizeDbDate(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return parseTrackerDate(s);
}

/** @param {Record<string, { date?: string|null }>|undefined} milestones @param {string} key @param {{ aorDate?: string }} doc */
function dbMilestoneDate(milestones, key, doc) {
  if (key === "aor") {
    const top = normalizeDbDate(doc.aorDate);
    if (top) return top;
  }
  return normalizeDbDate(milestones?.[key]?.date);
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

/**
 * @param {Record<string, unknown>} doc
 * @param {NonNullable<ReturnType<typeof decodeRow>>} source
 */
function planProfileUpdate(doc, source) {
  const now = new Date().toISOString();
  /** @type {Record<string, unknown>} */
  const $set = { updatedAt: new Date() };
  /** @type {Array<{ milestone: string, action: string, from: string|null, to: string }>} */
  const changes = [];
  let aorFilled = false;

  for (const key of MILESTONE_KEYS) {
    const dbDate = dbMilestoneDate(doc.milestones, key, doc);
    const sourceDate = source.milestones[key] ?? null;
    const plan = planMilestoneUpdate(dbDate, sourceDate, key);
    if (!wouldApply(plan) || !plan.proposed) continue;

    $set[`milestones.${key}.date`] = plan.proposed;
    $set[`milestones.${key}.updatedAt`] = now;
    changes.push({
      milestone: key,
      action: plan.action,
      from: dbDate,
      to: plan.proposed,
    });

    if (key === "aor") {
      $set.aorDate = plan.proposed;
      aorFilled = true;
    }
  }

  if (changes.length === 0) return null;

  if (aorFilled) {
    const stream = String(doc.stream ?? "CEC");
    const type = String(doc.type ?? "Inland");
    $set.cohortKey = buildStatsCohortKey(String($set.aorDate), stream, type);
  }

  return { $set, changes };
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
  const trackerCaseNos = [...byCase.keys()];

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db(dbName).collection("profiles");

    const docs = await col
      .find(
        {
          seededData: true,
          caseNo: { $in: trackerCaseNos },
        },
        {
          projection: {
            caseNo: 1,
            aorDate: 1,
            milestones: 1,
            stream: 1,
            type: 1,
          },
        },
      )
      .toArray();

    const stats = {
      scope: "tracker ∩ seeded (update existing only, no inserts)",
      trackerFiles: files,
      trackerRows: byCase.size,
      comparedProfiles: docs.length,
      profilesUpdated: 0,
      fieldsApplied: 0,
      fill: 0,
      earlier: 0,
      skippedNoChanges: 0,
    };

    /** @type {import("mongodb").AnyBulkWriteOperation[]} */
    const ops = [];
    /** @type {Array<Record<string, unknown>>} */
    const applied = [];

    for (const doc of docs) {
      const caseNo = String(doc.caseNo).trim().toLowerCase();
      const source = byCase.get(caseNo);
      if (!source) continue;

      const plan = planProfileUpdate(doc, source);
      if (!plan) {
        stats.skippedNoChanges++;
        continue;
      }

      for (const c of plan.changes) {
        stats.fieldsApplied++;
        if (c.action === "fill") stats.fill++;
        else if (c.action === "earlier") stats.earlier++;
      }

      stats.profilesUpdated++;
      applied.push({ caseNo, changes: plan.changes });

      ops.push({
        updateOne: {
          filter: { seededData: true, caseNo },
          update: { $set: plan.$set },
        },
      });
    }

    applied.sort((a, b) => String(a.caseNo).localeCompare(String(b.caseNo)));

    let bulkResult = null;
    if (apply && ops.length > 0) {
      bulkResult = await col.bulkWrite(ops, { ordered: false });
    }

    const report = {
      applied: apply,
      syncedAt: new Date().toISOString(),
      db: dbName,
      mergeRules: {
        aor: "never overwrite once set in DB",
        milestones: "earliest non-null (fill empty, or update if source is earlier)",
      },
      stats,
      bulkResult: bulkResult
        ? {
            matchedCount: bulkResult.matchedCount,
            modifiedCount: bulkResult.modifiedCount,
          }
        : null,
      updates: applied,
    };

    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

    const mode = apply ? "APPLIED" : "PREVIEW (pass --apply to write)";
    console.log(`Milestone sync — ${mode}`);
    console.log(`  scope: existing seeded profiles only (no new profiles)`);
    console.log(`  compared profiles:  ${stats.comparedProfiles}`);
    console.log(`  would update:       ${stats.profilesUpdated} profiles, ${stats.fieldsApplied} fields`);
    console.log(`    fill: ${stats.fill}, earlier: ${stats.earlier}`);
    console.log(`  unchanged:          ${stats.skippedNoChanges}`);
    if (bulkResult) {
      console.log(`  MongoDB modified:   ${bulkResult.modifiedCount}`);
    } else if (!apply && stats.profilesUpdated > 0) {
      console.log(`  Run with --apply to write these updates.`);
    }
    console.log(`  report → ${outPath}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
