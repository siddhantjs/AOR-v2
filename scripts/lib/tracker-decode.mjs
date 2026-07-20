/**
 * Decode ImmiTracker obfuscated row fields → AOR-v2 User / ProfileMilestone shape.
 */

const MONTHS = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** SCHEMA_V3 milestone ids that can be filled from tracker columns. */
export const TRACKER_MILESTONE_IDS = [
  "bil",
  "medical",
  "bgc_start",
  "final",
  "p1",
  "p2",
  "ecopr",
];

/** All profile milestone ids (sparse rows omit nulls on seed). */
export const PROFILE_MILESTONE_IDS = [
  "bil",
  "bio_done",
  "medical",
  "bgc_start",
  "crim",
  "info",
  "sec",
  "elig",
  "final",
  "p1",
  "p2",
  "ecopr",
  "prcard",
];

/** Obfuscated API keys */
export const TRACKER_KEYS = {
  submitted: "xizik-secyf-mykyk-hogef-tasas-satyr-kyhan-rumab-hixyx",
  aor: "xuset-kavav-casez-nypek-sybet-synyg-nocan-tyzef-tyxux",
  ita: "xucof-bebuc-caliv-tilur-tenyd-cezas-mutag-buvyt-sixix",
  medical: "xepot-nucyl-vycon-nivid-micim-rigal-semag-fyzyz-tixyx",
  bgc: "xocoz-vubum-bifub-mitak-varab-habog-genyl-ginat-kaxyx",
  bil: "ximos-bykys-likus-nifob-nomum-nytuh-modoz-hezug-myxyx",
  rprf: "xiden-fadin-lasof-dulaz-mavuk-fyzal-myhuv-humyc-tyxix",
  decision: "xizon-mupof-fyzys-sogys-lipil-cyvez-lifyr-nyzic-lexix",
  p1: "xedac-zyfyn-zylof-cedok-rahem-sirit-tafoh-pygap-poxex",
  p2: "xufad-nuraz-bapaz-pinyt-gydoz-nenaf-kipah-rapac-texux",
  landing: "xiseb-tybym-kiber-nakik-mybec-fufuk-nycid-gylyp-dexex",
  ecopr: "xubak-bezec-bokyh-mevid-vazab-gybaf-mysid-vibak-zexex",
  coprExpiry: "xovez-gikef-regic-cynuk-bekeb-razer-hecif-sykuz-byxox",
  refused: "xetel-cazyz-nomib-senum-fyhuf-cefuc-hitiv-lyhir-voxex",
  adr: "xekiz-kozov-bamat-mekum-nabov-musog-ronyk-punyc-dyxex",
  nationality: "xodos-nymub-sovog-zolyr-kafit-finit-hyluk-cymek-bixax",
  residence: "xecat-gatas-lekyf-vymuz-hyfan-kuban-nipyc-bicos-hixux",
  program: "xidar-kiboc-feruv-vazum-dazul-noror-kemip-pagit-fixix",
  currentStatus: "xopos-kybed-picys-supot-gukab-tetyl-luzyd-lekez-gixex",
  drawCategory: "xogaf-ducar-fyrog-bovuf-zyzos-bibac-lefig-fukit-vexux",
  crs: "xunop-hazat-nopas-fecis-gimuc-tikek-sahaf-hihyf-cyxex",
  familySize: "xobik-zodog-fabit-gakyk-mopip-cirof-kacav-bykaz-ryxox",
  visaOffice: "xides-hibyh-pitaf-cumyz-podaz-hikub-zirug-pubek-lyxyx",
};

/** @deprecated use TRACKER_MILESTONE_IDS — kept for older script imports */
export const MILESTONE_KEYS = TRACKER_MILESTONE_IDS;

export const TRACKER_CURRENT_STATUS_KEY = TRACKER_KEYS.currentStatus;

const OFFICE_ALIASES = {
  montréal: "Montreal",
  montreal: "Montreal",
  ottawa: "Ottawa",
  edmonton: "Edmonton",
  vancouver: "Vancouver",
  scarborough: "Scarborough",
  etobicoke: "Etobicoke",
  mississauga: "Mississauga",
  "niagara falls": "Niagara Falls",
  sydney: "Sydney NS",
  "sydney ns": "Sydney NS",
  "new delhi": "New Delhi",
  chandigarh: "Chandigarh",
  manila: "Manila",
  london: "London UK",
  "london uk": "London UK",
  "abu dhabi": "Abu Dhabi",
  ankara: "Ankara",
  "mexico city": "Mexico City",
  "sao paulo": "Sao Paulo",
  "são paulo": "Sao Paulo",
};

const DRAW_ALIASES = [
  { match: /general|all[- ]?program/i, value: "general" },
  { match: /french/i, value: "french" },
  { match: /healthcare|health care|social service/i, value: "healthcare-social" },
  { match: /\bstem\b|science.+tech|engineering/i, value: "stem" },
  { match: /trade/i, value: "trades" },
  { match: /transport|truck|pilot/i, value: "transport" },
  { match: /education/i, value: "education" },
  {
    match: /physician|senior manager|researcher|military/i,
    value: "physicians-senior-managers-researchers-military",
  },
];

/** @param {unknown} cell */
export function parseTrackerDate(cell) {
  if (cell == null || cell === "") return null;
  const str = String(cell).trim().replace(/\s+/g, " ");
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const m = str.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (month == null) return null;
  const day = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d.toISOString().slice(0, 10);
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

/** @param {string} iso YYYY-MM-DD */
export function isoToDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** @param {string} aorIso */
export function aorMonthFromIso(aorIso) {
  return aorIso.slice(0, 7);
}

/** @param {string} aorMonth @param {"inland"|"outland"} applyingFrom */
export function buildCohortKeyString(aorMonth, applyingFrom) {
  return `${aorMonth}|${applyingFrom}`;
}

/** @param {unknown} raw */
function textOrNull(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s || null;
}

/** @param {unknown} raw */
function parseCrs(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 1200) return null;
  return Math.round(n);
}

/** @param {unknown} raw */
function parseDependants(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s || /^n\/?a$/i.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  // Tracker family size includes PA; dependants ≈ size - 1
  const deps = Math.max(0, Math.round(n) - 1);
  return deps;
}

/** @param {unknown} raw */
function mapVisaOffice(raw) {
  const s = textOrNull(raw);
  if (!s) return null;
  const hit = OFFICE_ALIASES[s.toLowerCase()];
  return hit ?? "Other";
}

/** @param {unknown} raw */
function mapDrawCategory(raw) {
  const s = textOrNull(raw);
  if (!s) return "general";
  for (const { match, value } of DRAW_ALIASES) {
    if (match.test(s)) return value;
  }
  return "general";
}

/**
 * @param {unknown} programRaw
 * @returns {{ pathway: "express-entry"|"provincial-nominee-program", expressEntryProgram: "cec"|"fswp"|"fstp"|null }}
 */
function mapProgram(programRaw) {
  const s = (textOrNull(programRaw) ?? "CEC").toUpperCase();
  if (s.includes("PNP")) {
    return { pathway: "provincial-nominee-program", expressEntryProgram: null };
  }
  if (s.includes("FSW") || s.includes("FEDERAL SKILLED WORKER")) {
    return { pathway: "express-entry", expressEntryProgram: "fswp" };
  }
  if (s.includes("FST") || s.includes("TRADES")) {
    return { pathway: "express-entry", expressEntryProgram: "fstp" };
  }
  return { pathway: "express-entry", expressEntryProgram: "cec" };
}

/**
 * Infer inland/outland from residence + portal/landing signals.
 * @param {{ residence: string|null, p1: string|null, landing: string|null, ecopr: string|null }} p
 * @returns {"inland"|"outland"}
 */
function inferApplyingFrom(p) {
  const res = (p.residence ?? "").toLowerCase();
  if (res === "canada") return "inland";
  if (res && res !== "canada") return "outland";
  if (p.landing && !p.ecopr) return "outland";
  if (p.p1 || p.ecopr) return "inland";
  return "inland";
}

/**
 * ITA is required on User. Prefer tracker ITA → Submitted → day before AOR.
 * @param {string|null} ita
 * @param {string|null} submitted
 * @param {string} aor
 */
function resolveItaDate(ita, submitted, aor) {
  if (ita && ita < aor) return { itaDate: ita, itaSource: "ita" };
  if (submitted && submitted < aor) {
    return { itaDate: submitted, itaSource: "submitted" };
  }
  const [y, m, day] = aor.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day - 1, 12, 0, 0));
  return { itaDate: d.toISOString().slice(0, 10), itaSource: "aor-minus-1" };
}

/**
 * @param {Record<string, unknown>} row
 * @returns {DecodedTrackerRow | null}
 */
export function decodeRow(row) {
  const usernameArr = row.username;
  if (!Array.isArray(usernameArr) || !usernameArr[1]) return null;
  const caseNo = normalizeCaseNo(String(usernameArr[1]));
  if (!caseNo) return null;

  const aorDate = parseTrackerDate(row[TRACKER_KEYS.aor]);
  if (!aorDate) return null;

  const itaRaw = parseTrackerDate(row[TRACKER_KEYS.ita]);
  const submitted = parseTrackerDate(row[TRACKER_KEYS.submitted]);
  const { itaDate, itaSource } = resolveItaDate(itaRaw, submitted, aorDate);

  const bil = parseTrackerDate(row[TRACKER_KEYS.bil]);
  const medical = parseTrackerDate(row[TRACKER_KEYS.medical]);
  const bgc_start = parseTrackerDate(row[TRACKER_KEYS.bgc]);
  const final = parseTrackerDate(row[TRACKER_KEYS.decision]);
  const p1 = parseTrackerDate(row[TRACKER_KEYS.p1]);
  const p2 = parseTrackerDate(row[TRACKER_KEYS.p2]);
  const ecoprInland = parseTrackerDate(row[TRACKER_KEYS.ecopr]);
  const landing = parseTrackerDate(row[TRACKER_KEYS.landing]);

  const nationality = textOrNull(row[TRACKER_KEYS.nationality]);
  const countryOfResidence = textOrNull(row[TRACKER_KEYS.residence]);
  const applyingFrom = inferApplyingFrom({
    residence: countryOfResidence,
    p1,
    landing,
    ecopr: ecoprInland,
  });

  const ecopr =
    applyingFrom === "outland"
      ? landing ?? ecoprInland
      : ecoprInland ?? landing;

  /** @type {Record<string, string|null>} */
  const milestoneDates = {
    bil,
    medical,
    bgc_start,
    final,
    p1,
    p2,
    ecopr,
  };

  const { pathway, expressEntryProgram } = mapProgram(row[TRACKER_KEYS.program]);
  const drawCategory = mapDrawCategory(row[TRACKER_KEYS.drawCategory]);
  const primaryVisaOffice = mapVisaOffice(row[TRACKER_KEYS.visaOffice]);
  const currentStatus = textOrNull(row[TRACKER_KEYS.currentStatus]);

  return {
    caseNo,
    username: String(usernameArr[0] ?? "").trim(),
    aorDate,
    itaDate,
    itaSource,
    applyingFrom,
    pathway,
    expressEntryProgram,
    drawCategory,
    primaryVisaOffice,
    currentStatus,
    milestoneDates,
    userDetails: {
      nationality,
      countryOfResidence,
      crsScore: parseCrs(row[TRACKER_KEYS.crs]),
      dependants: parseDependants(row[TRACKER_KEYS.familySize]),
      maritalStatus: null,
      spouseStatus: null,
      foreignWork: null,
      foreignWorkYears: null,
      canadianWork: null,
      canadianWorkYears: null,
      medicalType: null,
    },
    // Extra tracker dates kept for sync/debug (not User fields)
    meta: {
      submitted,
      rprf: parseTrackerDate(row[TRACKER_KEYS.rprf]),
      adr: parseTrackerDate(row[TRACKER_KEYS.adr]),
      refused: parseTrackerDate(row[TRACKER_KEYS.refused]),
      coprExpiry: parseTrackerDate(row[TRACKER_KEYS.coprExpiry]),
    },
  };
}

/**
 * Build ProfileMilestone[] — only rows with a logged date.
 * @param {Record<string, string|null>} milestoneDates
 */
export function buildProfileMilestones(milestoneDates) {
  /** @type {Array<{ milestoneId: string, milestoneDate: string|null, estimatedFrom: null, estimatedTo: null, estimatedYearFrom: null, estimatedYearTo: null }>} */
  const out = [];
  for (const id of TRACKER_MILESTONE_IDS) {
    const date = milestoneDates[id] ?? null;
    if (!date) continue;
    out.push({
      milestoneId: id,
      milestoneDate: date,
      estimatedFrom: null,
      estimatedTo: null,
      estimatedYearFrom: null,
      estimatedYearTo: null,
    });
  }
  return out;
}

/**
 * §7.1 merge: AOR never overwritten once set; other dates take earliest.
 * @param {string|null} dbDate
 * @param {string|null} sourceDate
 * @param {string} key
 */
export function planMilestoneUpdate(dbDate, sourceDate, key) {
  if ((key === "aor" || key === "aorDate") && dbDate) {
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

/**
 * @typedef {object} DecodedTrackerRow
 * @property {string} caseNo
 * @property {string} username
 * @property {string} aorDate
 * @property {string} itaDate
 * @property {string} itaSource
 * @property {"inland"|"outland"} applyingFrom
 * @property {"express-entry"|"provincial-nominee-program"} pathway
 * @property {"cec"|"fswp"|"fstp"|null} expressEntryProgram
 * @property {string} drawCategory
 * @property {string|null} primaryVisaOffice
 * @property {string|null} currentStatus
 * @property {Record<string, string|null>} milestoneDates
 * @property {Record<string, unknown>} userDetails
 * @property {Record<string, string|null>} meta
 */
