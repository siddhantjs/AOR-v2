import {
  APPLYING_FROM,
  DRAW_CATEGORIES,
  EXPRESS_ENTRY_PROGRAMS,
  MARITAL_STATUSES,
  MEDICAL_TYPES,
  OFFICE_LIST,
  PATHWAYS,
  SPOUSE_STATUSES,
  type ApplyingFrom,
  type DrawCategory,
  type ExpressEntryProgram,
  type MaritalStatus,
  type MedicalType,
  type Pathway,
  type SpouseStatus,
  type VisaOffice,
} from "@/lib/schema/constants";
import type { User } from "@/lib/schema/types";
import { toIsoDate } from "@/lib/dates";

export type ApplicantDetailsForm = {
  pathway: Pathway;
  expressEntryProgram: ExpressEntryProgram | "";
  drawCategory: DrawCategory;
  itaDate: string;
  aorDate: string;
  applyingFrom: ApplyingFrom;
  nationality: string;
  crsScore: string;
  maritalStatus: MaritalStatus | "";
  spouseStatus: SpouseStatus | "";
  foreignWork: "" | "yes" | "no";
  canadianWork: "" | "yes" | "no";
  dependants: string;
  primaryVisaOffice: VisaOffice | "";
  secondaryVisaOffice: VisaOffice | "";
  countryOfResidence: string;
  medicalType: MedicalType | "";
};

export const NATIONALITY_OPTIONS = [
  "India",
  "Philippines",
  "Nigeria",
  "China",
  "Brazil",
  "Pakistan",
  "Iran",
  "United States",
  "United Kingdom",
  "Sri Lanka",
  "Vietnam",
  "Mexico",
  "Other",
] as const;

export const RESIDENCE_COUNTRY_OPTIONS = [
  "Canada",
  "India",
  "Philippines",
  "Nigeria",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Other",
] as const;

const MARITAL_LABEL: Record<MaritalStatus, string> = {
  single: "Single",
  married: "Married",
  "common-law": "Common law",
};

const SPOUSE_LABEL: Record<SpouseStatus, string> = {
  accompanying: "Accompanying",
  "non-accompanying": "Not accompanying",
  "no-spouse": "No spouse",
};

const MEDICAL_LABEL: Record<MedicalType, string> = {
  "old-medical": "Old medical",
  "new-medical": "New medical",
};

const PATHWAY_LABEL: Record<Pathway, string> = {
  "express-entry": "Express Entry",
  "provincial-nominee-program": "PNP",
};

const EE_LABEL: Record<ExpressEntryProgram, string> = {
  cec: "CEC",
  fswp: "FSWP",
  fstp: "FSTP",
};

export function toApplicantDetailsForm(user: User): ApplicantDetailsForm {
  const ud = user.userDetails;
  return {
    pathway: user.pathway,
    expressEntryProgram: user.expressEntryProgram ?? "",
    drawCategory: user.drawCategory,
    itaDate: toIsoDate(new Date(user.itaDate)),
    aorDate: toIsoDate(new Date(user.aorDate)),
    applyingFrom: user.applyingFrom,
    nationality: ud?.nationality ?? "",
    crsScore: ud?.crsScore != null ? String(ud.crsScore) : "",
    maritalStatus: ud?.maritalStatus ?? "",
    spouseStatus: ud?.spouseStatus ?? "",
    foreignWork: ud?.foreignWork == null ? "" : ud.foreignWork ? "yes" : "no",
    canadianWork: ud?.canadianWork == null ? "" : ud.canadianWork ? "yes" : "no",
    dependants: ud?.dependants != null ? String(ud.dependants) : "",
    primaryVisaOffice: (user.primaryVisaOffice ?? "") as VisaOffice | "",
    secondaryVisaOffice: (user.secondaryVisaOffice ?? "") as VisaOffice | "",
    countryOfResidence: ud?.countryOfResidence ?? "",
    medicalType: ud?.medicalType ?? "",
  };
}

export function displayApplicantDetails(
  form: ApplicantDetailsForm,
): { key: string; label: string; value: string }[] {
  const draw =
    DRAW_CATEGORIES.find((c) => c.value === form.drawCategory)?.label ?? form.drawCategory;

  return [
    {
      key: "pathway",
      label: "Application type",
      value: PATHWAY_LABEL[form.pathway],
    },
    {
      key: "ee",
      label: "EE program",
      value:
        form.pathway === "express-entry" && form.expressEntryProgram
          ? EE_LABEL[form.expressEntryProgram]
          : "—",
    },
    { key: "draw", label: "Draw category", value: draw },
    {
      key: "ita",
      label: "ITA date",
      value: form.itaDate || "—",
    },
    {
      key: "loc",
      label: "Location",
      value: form.applyingFrom === "inland" ? "Inland" : "Outland",
    },
    { key: "nat", label: "Nationality", value: form.nationality || "—" },
    { key: "crs", label: "CRS score", value: form.crsScore || "—" },
    {
      key: "mar",
      label: "Marital status",
      value: form.maritalStatus ? MARITAL_LABEL[form.maritalStatus] : "—",
    },
    {
      key: "spouse",
      label: "Spouse status",
      value: form.spouseStatus ? SPOUSE_LABEL[form.spouseStatus] : "—",
    },
    {
      key: "fw",
      label: "Foreign work",
      value: form.foreignWork === "" ? "—" : form.foreignWork === "yes" ? "Yes" : "No",
    },
    {
      key: "cw",
      label: "Canadian work",
      value: form.canadianWork === "" ? "—" : form.canadianWork === "yes" ? "Yes" : "No",
    },
    { key: "dep", label: "Dependants", value: form.dependants || "—" },
    {
      key: "pvo",
      label: "PVO",
      value: form.primaryVisaOffice || "—",
    },
    {
      key: "svo",
      label: "SVO",
      value: form.secondaryVisaOffice || "—",
    },
    {
      key: "cres",
      label: "Country of residence",
      value: form.countryOfResidence || "—",
    },
    {
      key: "med",
      label: "Medical type",
      value: form.medicalType ? MEDICAL_LABEL[form.medicalType] : "—",
    },
  ];
}

export const APPLICANT_DETAIL_OPTIONS = {
  pathways: PATHWAYS.map((p) => ({ value: p, label: PATHWAY_LABEL[p] })),
  eePrograms: EXPRESS_ENTRY_PROGRAMS.map((p) => ({
    value: p,
    label: EE_LABEL[p],
  })),
  drawCategories: DRAW_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label,
  })),
  applyingFrom: APPLYING_FROM.map((v) => ({
    value: v,
    label: v === "inland" ? "Inland" : "Outland",
  })),
  nationalities: NATIONALITY_OPTIONS.map((v) => ({ value: v, label: v })),
  marital: MARITAL_STATUSES.map((v) => ({
    value: v,
    label: MARITAL_LABEL[v],
  })),
  spouse: SPOUSE_STATUSES.map((v) => ({ value: v, label: SPOUSE_LABEL[v] })),
  yesNo: [
    { value: "yes" as const, label: "Yes" },
    { value: "no" as const, label: "No" },
  ],
  offices: OFFICE_LIST.map((o) => ({ value: o, label: o })),
  residenceCountries: RESIDENCE_COUNTRY_OPTIONS.map((v) => ({
    value: v,
    label: v,
  })),
  medical: MEDICAL_TYPES.map((v) => ({
    value: v,
    label: MEDICAL_LABEL[v],
  })),
};
