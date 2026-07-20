#!/usr/bin/env node
/**
 * Extract case numbers from tracker-json/*.json → case-numbers.json
 *
 * Usage:
 *   node scripts/extract-case-numbers.mjs
 *   npm run tracker:cases
 *
 * Reads username[1] from each row (e.g. "case-127287").
 * Files are processed in numeric order (100.json, 200.json, …).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const inDir = path.join(root, "tracker-json");
const outPath = path.join(root, "case-numbers.json");

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing ${dir}. Run npm run tracker:fetch first.`);
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

function extractFromFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const cases = [];
  for (const row of data.values ?? []) {
    const username = row.username;
    if (Array.isArray(username) && username[1]) {
      cases.push(String(username[1]).trim().toLowerCase());
    }
  }
  return cases;
}

function main() {
  const files = listJsonFiles(inDir);
  if (files.length === 0) {
    throw new Error(`No JSON files in ${inDir}`);
  }

  const cases = [];
  const byFile = {};

  for (const file of files) {
    const fromFile = extractFromFile(path.join(inDir, file));
    byFile[file] = fromFile.length;
    cases.push(...fromFile);
  }

  const output = {
    extractedAt: new Date().toISOString(),
    sourceDir: "tracker-json",
    files: files.length,
    count: cases.length,
    cases,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`Extracted ${output.count} case numbers from ${files.length} file(s)`);
  console.log(`  → ${outPath}`);
  for (const file of files) {
    console.log(`    ${file}: ${byFile[file]} cases`);
  }
}

main();
