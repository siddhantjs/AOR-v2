#!/usr/bin/env node
/**
 * Backfill GitHub Releases from merged "Release X.Y.Z" PRs.
 *
 * Non-release PRs merged between two Release PRs are included in the
 * *next* Release version's notes (the release PR that closes that window).
 *
 * Usage:
 *   node scripts/backfill-github-releases.mjs              # dry-run (default)
 *   node scripts/backfill-github-releases.mjs --execute    # create releases
 *   node scripts/backfill-github-releases.mjs --latest-only --execute
 *
 * Requires: `gh auth login` OR GITHUB_TOKEN in environment.
 */

import { execFileSync, spawnSync } from "node:child_process";
import {
  buildReleasePrNotes,
  parseReleasePrTitle,
} from "./lib/release-notes.mjs";

const REPO = process.env.GITHUB_REPO_FULL ?? "Get-North-Path/AOR-tracker";
const [owner, repo] = REPO.split("/");

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const latestOnly = args.includes("--latest-only");

function ghJson(cmdArgs) {
  const out = execFileSync("gh", ["api", ...cmdArgs], {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return JSON.parse(out);
}

function ghApi(path) {
  return ghJson([path]);
}

async function fetchAllMergedPulls() {
  const pulls = [];
  let page = 1;
  for (;;) {
    const batch = ghApi(
      `repos/${owner}/${repo}/pulls?state=closed&per_page=100&page=${page}&sort=updated&direction=desc`,
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const pr of batch) {
      if (pr.merged_at) pulls.push(pr);
    }
    if (batch.length < 100) break;
    page += 1;
  }
  pulls.sort(
    (a, b) => new Date(a.merged_at).getTime() - new Date(b.merged_at).getTime(),
  );
  return pulls;
}

function groupReleases(allMerged) {
  const releasePrs = allMerged
    .map((pr) => ({ pr, tag: parseReleasePrTitle(pr.title) }))
    .filter((x) => x.tag !== null);

  const nonRelease = allMerged.filter((pr) => !parseReleasePrTitle(pr.title));

  const plans = [];

  for (let i = 0; i < releasePrs.length; i++) {
    const { pr: releasePr, tag } = releasePrs[i];
    const prevMergedAt =
      i === 0 ? null : new Date(releasePrs[i - 1].pr.merged_at).getTime();
    const endMergedAt = new Date(releasePr.merged_at).getTime();

    const featurePrs = nonRelease.filter((pr) => {
      const t = new Date(pr.merged_at).getTime();
      if (prevMergedAt === null) return t <= endMergedAt;
      return t > prevMergedAt && t <= endMergedAt;
    });

    plans.push({
      tag,
      releasePr,
      featurePrs,
      notes: buildReleasePrNotes(releasePr, featurePrs, REPO),
      target: releasePr.merge_commit_sha,
    });
  }

  return plans;
}

function existingReleases() {
  try {
    const tags = ghApi(`repos/${owner}/${repo}/releases?per_page=100`);
    return new Set(
      (Array.isArray(tags) ? tags : []).map((r) => r.tag_name),
    );
  } catch {
    return new Set();
  }
}

function createRelease(plan, isLatest) {
  const ghArgs = [
    "release",
    "create",
    plan.tag,
    "--repo",
    REPO,
    "--title",
    plan.tag,
    "--notes-file",
    "-",
    "--target",
    plan.target,
  ];
  if (isLatest) ghArgs.push("--latest");

  const res = spawnSync("gh", ghArgs, {
    input: plan.notes,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
  });

  if (res.status !== 0) {
    throw new Error(`gh release create ${plan.tag} failed (exit ${res.status})`);
  }
}

async function main() {
  console.log(`Repository: ${REPO}`);
  console.log(`Mode: ${execute ? "EXECUTE" : "DRY-RUN"}${latestOnly ? " (latest only)" : ""}\n`);

  const merged = await fetchAllMergedPulls();
  let plans = groupReleases(merged);

  if (latestOnly) {
    plans = [plans[plans.length - 1]].filter(Boolean);
  }

  const existing = existingReleases();

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    const isLatest = i === plans.length - 1;

    console.log("─".repeat(60));
    console.log(`${plan.tag}  ←  PR #${plan.releasePr.number}  @ ${plan.target.slice(0, 7)}`);
    console.log(`  Feature PRs in window: ${plan.featurePrs.length}`);
    if (plan.featurePrs.length > 0) {
      for (const fp of plan.featurePrs) {
        console.log(`    · #${fp.number} ${fp.title}`);
      }
    }

    if (existing.has(plan.tag)) {
      console.log(`  SKIP: release ${plan.tag} already exists\n`);
      continue;
    }

    console.log("\n  Notes preview:");
    console.log(
      plan.notes
        .split("\n")
        .slice(0, 12)
        .map((l) => `  ${l}`)
        .join("\n"),
    );
    if (plan.notes.split("\n").length > 12) console.log("  …");

    if (execute) {
      console.log(`\n  Creating release ${plan.tag}...`);
      createRelease(plan, isLatest);
      console.log(`  ✓ Created ${plan.tag}\n`);
    } else {
      console.log(`\n  Would run: gh release create ${plan.tag} --target ${plan.target}\n`);
    }
  }

  if (!execute) {
    console.log("Dry-run complete. Re-run with --execute to publish releases.");
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
