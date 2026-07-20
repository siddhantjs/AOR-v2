#!/usr/bin/env node
/**
 * Create a draft GitHub Release when a version tag is pushed.
 *
 * Usage:
 *   TAG=v0.1.8 node scripts/draft-release-from-tag.mjs --dry-run
 *   TAG=v0.1.8 node scripts/draft-release-from-tag.mjs
 *
 * Env:
 *   TAG (required) — e.g. v0.1.8
 *   GITHUB_REPOSITORY — owner/repo (default: Get-North-Path/AOR-tracker)
 *   GITHUB_TOKEN — required for API writes (provided in Actions)
 */

import { execFileSync, spawnSync } from "node:child_process";
import {
  TAG_RE,
  buildKeepAChangelogNotes,
  parseReleasePrTitle,
  sortTagsSemverDesc,
} from "./lib/release-notes.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const repoFull =
  process.env.GITHUB_REPOSITORY?.trim() ??
  process.env.GITHUB_REPO_FULL?.trim() ??
  "Get-North-Path/AOR-tracker";
const [owner, repo] = repoFull.split("/");
const tag = process.env.TAG?.trim() ?? args.find((a) => TAG_RE.test(a));

function ghJson(cmdArgs) {
  const out = execFileSync("gh", ["api", ...cmdArgs], {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      GH_TOKEN: process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
    },
  });
  return JSON.parse(out);
}

function ghApi(path) {
  return ghJson([path]);
}

function gitTagDate(tagName) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", tagName], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

function apiTagCommitDate(tagName) {
  try {
    const ref = ghApi(
      `repos/${owner}/${repo}/git/refs/tags/${encodeURIComponent(tagName)}`,
    );
    let sha = ref.object?.sha;
    if (!sha) return null;
    if (ref.object?.type === "tag") {
      const tagObj = ghApi(`repos/${owner}/${repo}/git/tags/${sha}`);
      sha = tagObj.object?.sha ?? sha;
    }
    const commit = ghApi(`repos/${owner}/${repo}/commits/${sha}`);
    return (
      commit.commit?.committer?.date ?? commit.commit?.author?.date ?? null
    );
  } catch {
    return null;
  }
}

function resolveTagDate(tagName) {
  return gitTagDate(tagName) ?? apiTagCommitDate(tagName);
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
  return pulls;
}

function listLocalTags() {
  try {
    const out = execFileSync("git", ["tag", "--list", "v*"], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const local = out
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    if (local.length > 0) return local;
  } catch {
    // fall through to API
  }

  try {
    const releases = ghApi(`repos/${owner}/${repo}/releases?per_page=100`);
    return (Array.isArray(releases) ? releases : [])
      .map((r) => r.tag_name)
      .filter((t) => TAG_RE.test(t));
  } catch {
    return [];
  }
}

function resolvePreviousTag(currentTag) {
  const tags = sortTagsSemverDesc(listLocalTags());
  const idx = tags.indexOf(currentTag);
  if (idx >= 0 && idx < tags.length - 1) {
    return tags[idx + 1];
  }

  try {
    const releases = ghApi(`repos/${owner}/${repo}/releases?per_page=100`);
    const published = (Array.isArray(releases) ? releases : [])
      .filter((r) => !r.draft && !r.prerelease && r.published_at)
      .map((r) => r.tag_name)
      .filter((t) => t !== currentTag);
    const sorted = sortTagsSemverDesc(published);
    return sorted[0] ?? null;
  } catch {
    return null;
  }
}

function prsInTagWindow(allMerged, prevTag, currentTag) {
  const currentDate = resolveTagDate(currentTag);
  const prevDate = prevTag ? resolveTagDate(prevTag) : null;

  if (!currentDate) {
    throw new Error(`Cannot resolve commit date for tag ${currentTag}`);
  }

  const windowStart = prevDate ? new Date(prevDate).getTime() : 0;
  const windowEnd = new Date(currentDate).getTime();

  return allMerged.filter((pr) => {
    if (parseReleasePrTitle(pr.title)) return false;
    const mergedAt = new Date(pr.merged_at).getTime();
    return mergedAt > windowStart && mergedAt <= windowEnd;
  });
}

function releaseExists(tagName) {
  try {
    execFileSync("gh", ["release", "view", tagName, "--repo", repoFull], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        GH_TOKEN: process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
      },
    });
    return true;
  } catch {
    return false;
  }
}

function createDraftRelease(tagName, notes) {
  const ghArgs = [
    "release",
    "create",
    tagName,
    "--repo",
    repoFull,
    "--title",
    tagName,
    "--notes-file",
    "-",
    "--target",
    tagName,
    "--draft",
  ];

  const res = spawnSync("gh", ghArgs, {
    input: notes,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
    env: {
      ...process.env,
      GH_TOKEN: process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
    },
  });

  if (res.status !== 0) {
    throw new Error(`gh release create ${tagName} failed (exit ${res.status})`);
  }
}

async function main() {
  if (!tag || !TAG_RE.test(tag)) {
    console.error(
      `Invalid or missing TAG. Expected format vX.Y.Z (got: ${tag ?? "unset"})`,
    );
    process.exit(1);
  }

  const version = tag.startsWith("v") ? tag : `v${tag}`;
  const prevTag = resolvePreviousTag(version);
  const merged = await fetchAllMergedPulls();
  const featurePrs = prsInTagWindow(merged, prevTag, version);

  const tagDateIso = resolveTagDate(version);
  const date = tagDateIso
    ? new Date(tagDateIso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  const compareUrl = prevTag
    ? `https://github.com/${repoFull}/compare/${prevTag}...${version}`
    : `https://github.com/${repoFull}/releases/tag/${version}`;

  const notes = buildKeepAChangelogNotes({
    version,
    date,
    featurePrs,
    footer: `**Compare:** [${prevTag ?? "start"}...${version}](${compareUrl})`,
    repoFull,
  });

  console.log(`Repository: ${repoFull}`);
  console.log(`Tag: ${version}`);
  console.log(`Previous tag: ${prevTag ?? "(none)"}`);
  console.log(`PRs in window: ${featurePrs.length}`);
  console.log(`Mode: ${dryRun ? "DRY-RUN" : "CREATE DRAFT"}\n`);
  console.log(notes);
  console.log("");

  if (dryRun) return;

  if (releaseExists(version)) {
    console.log(`Release ${version} already exists — skipping.`);
    return;
  }

  console.log(`Creating draft release ${version}...`);
  createDraftRelease(version, notes);
  console.log(`Draft release ${version} created. Publish it on GitHub when ready.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
