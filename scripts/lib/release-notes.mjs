/**
 * Shared Keep a Changelog note builders for GitHub releases.
 */

export const RELEASE_TITLE_RE = /^Release\s+(v?)([\d.]+)\s*$/i;

export const TAG_RE = /^v(\d+\.\d+\.\d+)$/;

/**
 * @param {string} title
 * @returns {string | null} Normalized tag e.g. v0.1.8
 */
export function parseReleasePrTitle(title) {
  const m = title.trim().match(RELEASE_TITLE_RE);
  if (!m) return null;
  const ver = m[2];
  return ver.startsWith("v") ? ver : `v${ver}`;
}

/**
 * @param {{ title: string; body?: string | null }} pr
 */
export function isFixPr(pr) {
  const title = pr.title.trim().toLowerCase();
  if (/^(feat|feature|add|chore|docs|refactor)\b/.test(title)) return false;
  if (/^fix\b/.test(title)) return true;
  const t = `${title} ${pr.body ?? ""}`.toLowerCase();
  return /\bbug\b/.test(t) || /\bfixed\b/.test(title);
}

/**
 * @param {{ number: number; title: string; body?: string | null }} pr
 * @param {string} repoFull e.g. Get-North-Path/AOR-tracker
 */
export function bulletFromPr(pr, repoFull) {
  const bodyFirst =
    pr.body
      ?.split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith("##")) ?? "";
  const summary = bodyFirst.replace(/^[-*]\s*/, "").slice(0, 120);
  const extra = summary && summary !== pr.title ? ` — ${summary}` : "";
  return `- ${pr.title}${extra} ([#${pr.number}](https://github.com/${repoFull}/pull/${pr.number}))`;
}

/**
 * @param {object} opts
 * @param {string} opts.version e.g. v0.1.8
 * @param {string} opts.date Human date e.g. Jun 11, 2026
 * @param {Array<{ title: string; body?: string | null; number: number }>} opts.featurePrs
 * @param {string} [opts.intro] Optional markdown paragraph before sections
 * @param {string} [opts.footer] Optional footer line(s)
 * @param {string} opts.repoFull
 */
export function buildKeepAChangelogNotes({
  version,
  date,
  featurePrs,
  intro,
  footer,
  repoFull,
}) {
  const fixes = featurePrs.filter(isFixPr);
  const added = featurePrs.filter((p) => !isFixPr(p));

  const lines = [`${version} — ${date}`, ""];

  if (intro?.trim()) {
    lines.push(intro.trim(), "");
  }

  if (added.length > 0) {
    lines.push("### Added", ...added.map((p) => bulletFromPr(p, repoFull)), "");
  }
  if (fixes.length > 0) {
    lines.push("### Fixed", ...fixes.map((p) => bulletFromPr(p, repoFull)), "");
  }
  if (featurePrs.length === 0) {
    lines.push("_No additional PRs in this release window._", "");
  }

  if (footer?.trim()) {
    lines.push(footer.trim());
  }

  return lines.join("\n").trim();
}

/**
 * Backfill helper: notes for a Release X.Y.Z PR window.
 */
export function buildReleasePrNotes(releasePr, featurePrs, repoFull) {
  const version = parseReleasePrTitle(releasePr.title);
  const merged = new Date(releasePr.merged_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return buildKeepAChangelogNotes({
    version: version ?? releasePr.title,
    date: merged,
    featurePrs,
    intro: releasePr.body?.trim() || undefined,
    footer: `**Release PR:** [#${releasePr.number}](https://github.com/${repoFull}/pull/${releasePr.number})`,
    repoFull,
  });
}

/**
 * @param {string} tag e.g. v0.1.8
 * @returns {number[]} [major, minor, patch]
 */
export function parseSemverTag(tag) {
  const m = tag.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Sort tags by semver descending (newest first).
 * @param {string[]} tags
 */
export function sortTagsSemverDesc(tags) {
  return [...tags].sort((a, b) => {
    const pa = parseSemverTag(a);
    const pb = parseSemverTag(b);
    if (!pa || !pb) return a.localeCompare(b);
    for (let i = 0; i < 3; i++) {
      if (pa[i] !== pb[i]) return pb[i] - pa[i];
    }
    return 0;
  });
}
