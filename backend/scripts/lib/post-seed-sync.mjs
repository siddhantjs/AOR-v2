#!/usr/bin/env node
/**
 * Recount AOR-v2 cohort stats from users (seeded + live).
 *
 * Usage:
 *   node scripts/lib/post-seed-sync.mjs
 *   node scripts/lib/post-seed-sync.mjs 2024-02|inland,2024-03|outland
 *
 * Env: MONGODB_URI, MONGODB_DB_NAME
 */

import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import { PROFILE_MILESTONE_IDS } from "./tracker-decode.mjs";

import { loadEnvFiles } from "./paths.mjs";

function loadEnv() {
  loadEnvFiles();
}

function resolveDbName() {
  return process.env.MONGODB_DB_NAME?.trim() || process.env.MONGODB_DB?.trim() || "aor-v2";
}

/**
 * @param {import("mongodb").Db} db
 * @param {string[]|null} onlyKeys
 */
async function recountCohorts(db, onlyKeys) {
  const users = db.collection("users");
  const cohorts = db.collection("cohorts");

  const filter = onlyKeys && onlyKeys.length > 0 ? { cohortKey: { $in: onlyKeys } } : {};

  const cohortDocs = await cohorts.find(filter).toArray();
  let updated = 0;

  for (const cohort of cohortDocs) {
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

  return { cohortsUpdated: updated, cohortsScanned: cohortDocs.length };
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  const dbName = resolveDbName();
  const cohortKeysArg = process.argv[2]?.trim();
  const onlyKeys = cohortKeysArg
    ? cohortKeysArg
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : null;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const result = await recountCohorts(client.db(dbName), onlyKeys);
    console.log(JSON.stringify({ db: dbName, ...result }));
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
