#!/usr/bin/env node
/**
 * Compare case numbers from case-numbers.json against seeded MongoDB profiles only.
 *
 * Usage:
 *   node scripts/check-cases-in-db.mjs
 *   npm run cases:check
 *
 * DB scope: profiles where seededData === true (tracker-json seed or legacy Excel).
 *
 * Env (from .env.local or .env):
 *   MONGODB_URI — required
 *   MONGODB_DB  — optional, default aor-tracker
 *
 * Output:
 *   Console summary + case-numbers-db-check.json at repo root
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

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

function readCaseNumbers() {
  const inputPath = path.join(root, "case-numbers.json");
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing ${inputPath}. Run the case-number extraction first.`);
  }
  const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (!Array.isArray(data.cases) || data.cases.length === 0) {
    throw new Error(`No cases array in ${inputPath}`);
  }
  return data.cases.map((c) => String(c).trim().toLowerCase());
}

async function main() {
  loadEnv();

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB?.trim() || "aor-tracker";
  const cases = readCaseNumbers();

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db(dbName).collection("profiles");

    const found = await col
      .find(
        { seededData: true, caseNo: { $in: cases } },
        { projection: { caseNo: 1 } },
      )
      .toArray();

    const foundSet = new Set(
      found.map((doc) => String(doc.caseNo).trim().toLowerCase()),
    );

    const present = cases.filter((c) => foundSet.has(c));
    const missing = cases.filter((c) => !foundSet.has(c));

    const report = {
      checkedAt: new Date().toISOString(),
      db: dbName,
      scope: "seededData: true profiles only",
      source: "case-numbers.json (tracker-json)",
      total: cases.length,
      presentCount: present.length,
      missingCount: missing.length,
      present,
      missing,
    };

    const outPath = path.join(root, "case-numbers-db-check.json");
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

    console.log(
      `Checked ${report.total} tracker cases against seeded DB profiles`,
    );
    console.log(`  Present in DB (seeded): ${report.presentCount}`);
    console.log(`  Missing from seeded:    ${report.missingCount}`);
    console.log(`Report: ${outPath}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
