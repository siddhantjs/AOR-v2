/**
 * Decode tracker API obfuscated row fields → milestone ISO dates.
 */

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

/** ImmiTracker date strings: "Jan 19, 2024", "Jul 3, 2026", or "2026-07-03". */
const TRACKER_DATE_FORMATS = ["MMM D, YYYY", "YYYY-MM-DD"];

/** Obfuscated API keys → internal milestone key */
export const TRACKER_FIELD_KEYS = {
  aor: "xuset-kavav-casez-nypek-sybet-synyg-nocan-tyzef-tyxux", // AOR Date
  biometrics: "ximos-bykys-likus-nifob-nomum-nytuh-modoz-hezug-myxyx", // Biometrics Invitation Letter (BIL)
  background: "xocoz-vubum-bifub-mitak-varab-habog-genyl-ginat-kaxyx", // Last BGS change Date
  medical: "xepot-nucyl-vycon-nivid-micim-rigal-semag-fyzyz-tixyx", // Medical Passed
  p1: "xedac-zyfyn-zylof-cedok-rahem-sirit-tafoh-pygap-poxex", // Portal 1 Email (Inland)
  p2: "xufad-nuraz-bapaz-pinyt-gydoz-nenaf-kipah-rapac-texux", // Portal 2 Email / PPR Date
  ecopr: "xubak-bezec-bokyh-mevid-vazab-gybaf-mysid-vibak-zexex", // eCoPR Date (Inland Landing)
};

export const MILESTONE_KEYS = Object.keys(TRACKER_FIELD_KEYS);

/** Tracker "current status" column (e.g. Biometrics, e-APR AOR). */
export const TRACKER_CURRENT_STATUS_KEY =
  "xopos-kybed-picys-supot-gukab-tetyl-luzyd-lekez-gixex";

/** @param {unknown} cell */
export function parseTrackerDate(cell) {
  if (cell == null || cell === "") return null;
  const str = String(cell).trim().replace(/\s+/g, " ");
  if (!str) return null;
  const parsed = dayjs(str, TRACKER_DATE_FORMATS, true);
  if (!parsed.isValid()) return null;
  return parsed.format("YYYY-MM-DD");
}

/** @param {string} raw */
export function normalizeCaseNo(raw) {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (/^case-\d+$/i.test(s)) return s;
  const digits = s.replace(/^case-?/i, "").replace(/\D/g, "");
  if (!digits) return null;
  return `case-${digits}`;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{ caseNo: string, username: string, milestones: Record<string, string|null>, currentStatus?: string } | null}
 */
export function decodeRow(row) {
  const username = row.username;
  if (!Array.isArray(username) || !username[1]) return null;
  const caseNo = normalizeCaseNo(String(username[1]));
  if (!caseNo) return null;

  /** @type {Record<string, string|null>} */
  const milestones = {};
  for (const [key, field] of Object.entries(TRACKER_FIELD_KEYS)) {
    milestones[key] = parseTrackerDate(row[field]);
  }
  const currentStatus = String(row[TRACKER_CURRENT_STATUS_KEY] ?? "").trim();
  return {
    caseNo,
    username: String(username[0] ?? "").trim(),
    milestones,
    ...(currentStatus ? { currentStatus } : {}),
  };
}

/**
 * §7.1 merge: AOR never overwritten once set; other milestones take earliest date.
 * @param {string|null} dbDate
 * @param {string|null} sourceDate
 * @param {string} key
 */
export function planMilestoneUpdate(dbDate, sourceDate, key) {
  if (key === "aor" && dbDate) {
    if (!sourceDate || sourceDate === dbDate) {
      return { action: "unchanged", proposed: dbDate };
    }
    return {
      action: "skip_aor_locked",
      proposed: dbDate,
      source: sourceDate,
    };
  }
  if (!sourceDate) {
    return { action: "unchanged", proposed: dbDate ?? null };
  }
  if (!dbDate) {
    return { action: "fill", proposed: sourceDate };
  }
  if (sourceDate === dbDate) {
    return { action: "unchanged", proposed: dbDate };
  }
  if (sourceDate < dbDate) {
    return {
      action: "earlier",
      proposed: sourceDate,
      db: dbDate,
      source: sourceDate,
    };
  }
  return {
    action: "skip_regress",
    proposed: dbDate,
    db: dbDate,
    source: sourceDate,
  };
}

/** @param {{ action: string }} plan */
export function wouldApply(plan) {
  return plan.action === "fill" || plan.action === "earlier";
}
