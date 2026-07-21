#!/usr/bin/env node
/**
 * Apply tracker milestone updates to existing seeded users only.
 * Scope: tracker ∩ seeded (seededData:true, caseNo in tracker-json).
 *
 * Does NOT create users — updateOne only, no upsert.
 *
 * Usage:
 *   node scripts/sync-milestones.mjs
 *   node scripts/sync-milestones.mjs --apply
 *   npm run tracker:sync
 *
 * Output: milestone-sync-applied.json
 */

import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";
import { repoRoot as root, loadEnvFiles } from "./lib/paths.mjs";
import {
  TRACKER_MILESTONE_IDS,
  aorMonthFromIso,
  buildCohortKeyString,
  decodeRow,
  isoToDate,
  parseTrackerDate,
  planMilestoneUpdate,
  wouldApply,
} from "./lib/tracker-decode.mjs";

const inDir = path.join(root, "tracker-json");
const outPath = path.join(root, "milestone-sync-applied.json");

const apply = process.argv.includes("--apply");

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
 */
function dbMilestoneDate(milestones, id) {
  const row = (milestones ?? []).find((m) => m.milestoneId === id);
  return normalizeDbDate(row?.milestoneDate);
}

/**
 * @param {Record<string, unknown>} doc
 * @param {NonNullable<ReturnType<typeof decodeRow>>} source
 */
function planUserUpdate(doc, source) {
  /** @type {Record<string, unknown>} */
  const $set = { updatedAt: new Date() };
  /** @type {Array<{ milestone: string, action: string, from: string|null, to: string }>} */
  const changes = [];

  const dbAor = normalizeDbDate(doc.aorDate);
  const aorPlan = planMilestoneUpdate(dbAor, source.aorDate, "aorDate");
  if (wouldApply(aorPlan) && aorPlan.proposed) {
    $set.aorDate = isoToDate(aorPlan.proposed);
    changes.push({
      milestone: "aorDate",
      action: aorPlan.action,
      from: dbAor,
      to: aorPlan.proposed,
    });
  }

  /** @type {Map<string, { milestoneId: string, milestoneDate: string|null, estimatedFrom: null, estimatedTo: null, estimatedYearFrom: null, estimatedYearTo: null }>} */
  const byId = new Map();
  for (const row of doc.milestones ?? []) {
    if (row?.milestoneId) {
      byId.set(row.milestoneId, {
        milestoneId: row.milestoneId,
        milestoneDate: normalizeDbDate(row.milestoneDate),
        estimatedFrom: row.estimatedFrom ?? null,
        estimatedTo: row.estimatedTo ?? null,
        estimatedYearFrom: row.estimatedYearFrom ?? null,
        estimatedYearTo: row.estimatedYearTo ?? null,
      });
    }
  }

  let milestonesChanged = false;
  for (const id of TRACKER_MILESTONE_IDS) {
    const dbDate = dbMilestoneDate(doc.milestones, id);
    const sourceDate = source.milestoneDates[id] ?? null;
    const plan = planMilestoneUpdate(dbDate, sourceDate, id);
    if (!wouldApply(plan) || !plan.proposed) continue;

    byId.set(id, {
      milestoneId: id,
      milestoneDate: plan.proposed,
      estimatedFrom: null,
      estimatedTo: null,
      estimatedYearFrom: null,
      estimatedYearTo: null,
    });
    milestonesChanged = true;
    changes.push({
      milestone: id,
      action: plan.action,
      from: dbDate,
      to: plan.proposed,
    });
  }

  if (milestonesChanged) {
    $set.milestones = [...byId.values()].filter((m) => m.milestoneDate);
  }

  if (source.currentStatus && source.currentStatus !== doc.currentStatus) {
    $set.currentStatus = source.currentStatus;
    changes.push({
      milestone: "currentStatus",
      action: "fill",
      from: doc.currentStatus ? String(doc.currentStatus) : null,
      to: source.currentStatus,
    });
  }

  // Refresh profile fields that are safe to overwrite on seeded users
  if (source.userDetails?.nationality && !doc.userDetails?.nationality) {
    $set["userDetails.nationality"] = source.userDetails.nationality;
  }
  if (source.userDetails?.countryOfResidence && !doc.userDetails?.countryOfResidence) {
    $set["userDetails.countryOfResidence"] = source.userDetails.countryOfResidence;
  }

  if (changes.length === 0) return null;

  const effectiveAor = normalizeDbDate($set.aorDate) ?? dbAor ?? source.aorDate;
  if (effectiveAor && ($set.aorDate || source.applyingFrom !== doc.applyingFrom)) {
    $set._recohort = {
      aorMonth: aorMonthFromIso(effectiveAor),
      applyingFrom: source.applyingFrom,
      cohortKeyStr: buildCohortKeyString(aorMonthFromIso(effectiveAor), source.applyingFrom),
    };
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
  const dbName = resolveDbName();

  const { files, byCase } = loadTrackerRows();
  const trackerCaseNos = [...byCase.keys()];

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db(dbName).collection("users");

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
            applyingFrom: 1,
            milestones: 1,
            currentStatus: 1,
            userDetails: 1,
            cohortKey: 1,
          },
        },
      )
      .toArray();

    const stats = {
      scope: "tracker ∩ seeded users (update existing only, no inserts)",
      trackerFiles: files,
      trackerRows: byCase.size,
      comparedUsers: docs.length,
      usersUpdated: 0,
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

      const plan = planUserUpdate(doc, source);
      if (!plan) {
        stats.skippedNoChanges++;
        continue;
      }

      for (const c of plan.changes) {
        stats.fieldsApplied++;
        if (c.action === "fill") stats.fill++;
        else if (c.action === "earlier") stats.earlier++;
      }

      // Drop internal recohort hint from $set for now (cohort moves need ensureCohort)
      const { _recohort, ...$set } = plan.$set;
      if (_recohort && apply) {
        // Leave cohortKey as-is on sync; full re-seed / recount handles cohort moves.
        // applyingFrom can still update when residence signals change.
        $set.applyingFrom = _recohort.applyingFrom;
      }

      stats.usersUpdated++;
      applied.push({ caseNo, changes: plan.changes });

      ops.push({
        updateOne: {
          filter: { seededData: true, caseNo },
          update: { $set },
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
      collection: "users",
      mergeRules: {
        aorDate: "never overwrite once set in DB",
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
    console.log(`  scope: existing seeded users only (no new users)`);
    console.log(`  compared users:     ${stats.comparedUsers}`);
    console.log(`  would update:       ${stats.usersUpdated} users, ${stats.fieldsApplied} fields`);
    console.log(`    fill: ${stats.fill}, earlier: ${stats.earlier}`);
    console.log(`  unchanged:          ${stats.skippedNoChanges}`);
    if (bulkResult) {
      console.log(`  MongoDB modified:   ${bulkResult.modifiedCount}`);
    } else if (!apply && stats.usersUpdated > 0) {
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
