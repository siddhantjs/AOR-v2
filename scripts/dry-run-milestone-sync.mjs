#!/usr/bin/env node
/**
 * Dry-run: milestone date diff for tracker ∩ seeded users only.
 *
 * Usage:
 *   node scripts/dry-run-milestone-sync.mjs
 *   npm run tracker:dry-run
 *
 * Output: milestone-sync-dry-run.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import {
  TRACKER_MILESTONE_IDS,
  decodeRow,
  parseTrackerDate,
  planMilestoneUpdate,
  wouldApply,
} from "./lib/tracker-decode.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const inDir = path.join(root, "tracker-json");
const outPath = path.join(root, "milestone-sync-dry-run.json");

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

function resolveDbName() {
  return (
    process.env.MONGODB_DB_NAME?.trim() ||
    process.env.MONGODB_DB?.trim() ||
    "aor-v2"
  );
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

/** @param {unknown} raw */
function normalizeDbDate(raw) {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return parseTrackerDate(s);
}

/**
 * @param {Array<{ milestoneId?: string, milestoneDate?: string|null }>|undefined} milestones
 * @param {string} id
 * @param {{ aorDate?: unknown }} doc
 */
function dbMilestoneDate(milestones, id, doc) {
  if (id === "aorDate") return normalizeDbDate(doc.aorDate);
  const row = (milestones ?? []).find((m) => m.milestoneId === id);
  return normalizeDbDate(row?.milestoneDate);
}

/**
 * @returns {'both_empty'|'match'|'mismatch'|'db_only'|'source_only'}
 */
function compareDates(dbDate, sourceDate) {
  if (!dbDate && !sourceDate) return "both_empty";
  if (dbDate && !sourceDate) return "db_only";
  if (!dbDate && sourceDate) return "source_only";
  if (dbDate === sourceDate) return "match";
  return "mismatch";
}

const COMPARE_KEYS = ["aorDate", ...TRACKER_MILESTONE_IDS];

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  const dbName = resolveDbName();

  const { files, byCase } = loadTrackerRows();
  const trackerCaseNos = [...byCase.keys()];

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db(dbName).collection("users");

    const [docs, dbSeededTotal, seededNotInFetch] = await Promise.all([
      col
        .find(
          {
            seededData: true,
            caseNo: { $in: trackerCaseNos },
          },
          {
            projection: {
              caseNo: 1,
              username: 1,
              aorDate: 1,
              milestones: 1,
            },
          },
        )
        .toArray(),
      col.countDocuments({
        seededData: true,
        caseNo: { $exists: true, $ne: "" },
      }),
      col.countDocuments({
        seededData: true,
        caseNo: { $exists: true, $ne: "", $nin: trackerCaseNos },
      }),
    ]);

    const stats = {
      scope: "tracker ∩ seeded users",
      comparedUsers: docs.length,
      trackerRows: byCase.size,
      trackerFiles: files,
      dbSeededTotal,
      seededNotInFetch,
      usersWithAnyDiff: 0,
      usersWithMismatch: 0,
      usersWithSourceOnly: 0,
      totalMismatches: 0,
      totalSourceOnly: 0,
      compare: {
        both_empty: 0,
        match: 0,
        mismatch: 0,
        db_only: 0,
        source_only: 0,
      },
      byMilestone: Object.fromEntries(
        COMPARE_KEYS.map((k) => [
          k,
          {
            both_empty: 0,
            match: 0,
            mismatch: 0,
            db_only: 0,
            source_only: 0,
          },
        ]),
      ),
      mergeWouldApply: {
        fill: 0,
        earlier: 0,
        skip_regress: 0,
        skip_aor_locked: 0,
        unchanged: 0,
      },
    };

    /** @type {Array<Record<string, unknown>>} */
    const diffs = [];

    for (const doc of docs) {
      const caseNo = String(doc.caseNo).trim().toLowerCase();
      const source = byCase.get(caseNo);
      if (!source) continue;

      /** @type {Array<Record<string, unknown>>} */
      const fieldDiffs = [];
      let hasMismatch = false;
      let hasSourceOnly = false;

      for (const key of COMPARE_KEYS) {
        const dbDate = dbMilestoneDate(doc.milestones, key, doc);
        const sourceDate =
          key === "aorDate"
            ? source.aorDate
            : (source.milestoneDates[key] ?? null);
        const kind = compareDates(dbDate, sourceDate);

        stats.compare[kind]++;
        stats.byMilestone[key][kind]++;

        const plan = planMilestoneUpdate(dbDate, sourceDate, key);
        stats.mergeWouldApply[plan.action]++;

        if (kind === "mismatch") {
          hasMismatch = true;
          stats.totalMismatches++;
          fieldDiffs.push({
            milestone: key,
            kind,
            db: dbDate,
            source: sourceDate,
            sourceIsLater: sourceDate > dbDate,
            mergeWouldApply: wouldApply(plan),
            mergeAction: plan.action,
          });
        } else if (kind === "source_only") {
          hasSourceOnly = true;
          stats.totalSourceOnly++;
          fieldDiffs.push({
            milestone: key,
            kind,
            db: null,
            source: sourceDate,
            mergeWouldApply: wouldApply(plan),
            mergeAction: plan.action,
          });
        } else if (wouldApply(plan)) {
          fieldDiffs.push({
            milestone: key,
            kind,
            db: dbDate,
            source: sourceDate,
            mergeWouldApply: true,
            mergeAction: plan.action,
          });
        }
      }

      if (fieldDiffs.length > 0) {
        stats.usersWithAnyDiff++;
        if (hasMismatch) stats.usersWithMismatch++;
        if (hasSourceOnly) stats.usersWithSourceOnly++;
        diffs.push({
          caseNo,
          dbUsername: doc.username ?? null,
          sourceUsername: source.username,
          fields: fieldDiffs,
        });
      }
    }

    diffs.sort((a, b) => String(a.caseNo).localeCompare(String(b.caseNo)));

    const report = {
      dryRun: true,
      checkedAt: new Date().toISOString(),
      db: dbName,
      collection: "users",
      scope: "tracker ∩ seeded (seededData:true, caseNo in tracker-json)",
      mergeRules: {
        aorDate: "never overwrite once set in DB",
        milestones: "earliest non-null (fill empty, or update if source is earlier)",
      },
      stats,
      diffs,
    };

    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

    const wouldApplyCount =
      stats.mergeWouldApply.fill + stats.mergeWouldApply.earlier;

    console.log("Milestone diff dry-run — tracker ∩ seeded users only (no writes)");
    console.log(`  compared users:          ${stats.comparedUsers}`);
    console.log(
      `  (context: ${stats.dbSeededTotal} seeded total, ${stats.seededNotInFetch} seeded not in fetch)`,
    );
    console.log(`  users with any diff:     ${stats.usersWithAnyDiff}`);
    console.log(`  users w/ mismatch:       ${stats.usersWithMismatch}`);
    console.log(`  total date mismatches:   ${stats.totalMismatches}`);
    console.log(`  total source-only:       ${stats.totalSourceOnly}`);
    console.log(
      `  merge would apply:       ${wouldApplyCount} (fill ${stats.mergeWouldApply.fill}, earlier ${stats.mergeWouldApply.earlier})`,
    );
    console.log(`  report → ${outPath}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
