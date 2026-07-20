/**
 * Post-seed cohort placeholders + stats sync (invoked via tsx from tracker seed CLI).
 *
 * Usage:
 *   npx tsx scripts/lib/post-seed-sync.ts
 *   npx tsx scripts/lib/post-seed-sync.ts CEC:6:2026:inland,CEC:5:2026:inland
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import { reconcileProfileCohortKeys, runCohortStatsSyncJob } from "@/lib/cohort-sync-job";
import { ensureCohortStatsPlaceholder } from "@/lib/ensure-cohort-stats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const root = path.resolve(__dirname, "..", "..");
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
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

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB?.trim() || "aor-tracker";
  const cohortKeysArg = process.argv[2]?.trim();
  const cohortKeys = cohortKeysArg
    ? cohortKeysArg.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    for (const cohortKey of cohortKeys) {
      try {
        await ensureCohortStatsPlaceholder(db, cohortKey);
      } catch (e) {
        console.warn("[post-seed-sync] cohort placeholder failed", cohortKey, e);
      }
    }

    const profilesCohortKeyUpdates = await reconcileProfileCohortKeys(db);
    const sync = await runCohortStatsSyncJob(db);

    console.log(
      JSON.stringify({
        profilesCohortKeyUpdates,
        cohortsUpserted: sync.cohortsUpserted,
        cohortPlaceholders: cohortKeys.length,
      }),
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
