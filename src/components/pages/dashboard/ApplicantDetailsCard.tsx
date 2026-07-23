"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  APPLICANT_DETAIL_OPTIONS,
  displayApplicantDetails,
  type ApplicantDetailsForm,
} from "@/lib/applicantDetails";
import { formatLongDate } from "@/lib/dates";
import { DashboardDatePicker, Select } from "@/components/ui";
import { api } from "@/lib/api";

const editControl = "w-[168px] shrink-0 [&_button]:py-1.5 [&_button]:text-[12.5px]";

const inputControl =
  "w-[168px] rounded-[var(--radius-md)] border border-[var(--border2)] bg-[var(--bg-elevated)] px-3 py-1.5 text-right text-[12.5px] text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_rgba(26,35,50,0.08)]";

const OFFICE_KEYS = new Set(["pvo", "svo"]);

/** Display row key → form field used to decide if the value is already saved. */
const ROW_FORM_KEY: Record<string, keyof ApplicantDetailsForm> = {
  pathway: "pathway",
  ee: "expressEntryProgram",
  draw: "drawCategory",
  ita: "itaDate",
  loc: "applyingFrom",
  nat: "nationality",
  crs: "crsScore",
  mar: "maritalStatus",
  spouse: "spouseStatus",
  fw: "foreignWork",
  cw: "canadianWork",
  dep: "dependants",
  cres: "countryOfResidence",
  med: "medicalType",
};

/** Optional profile fields that can still be filled when empty. */
const FILLABLE_KEYS = [
  "nationality",
  "crsScore",
  "maritalStatus",
  "spouseStatus",
  "foreignWork",
  "canadianWork",
  "dependants",
  "countryOfResidence",
  "medicalType",
] as const satisfies ReadonlyArray<keyof ApplicantDetailsForm>;

function isFilled(value: string): boolean {
  return value.trim() !== "";
}

function isRowLocked(form: ApplicantDetailsForm, rowKey: string): boolean {
  const formKey = ROW_FORM_KEY[rowKey];
  if (!formKey) return true;
  if (rowKey === "ee" && form.pathway !== "express-entry") return true;
  return isFilled(String(form[formKey] ?? ""));
}

type ApplicantDetailsCardProps = {
  userId: string;
  initialForm: ApplicantDetailsForm;
};

export function ApplicantDetailsCard({ userId, initialForm }: ApplicantDetailsCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [draft, setDraft] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [officeModalOpen, setOfficeModalOpen] = useState(false);

  const rows = displayApplicantDetails(form).map((row) =>
    row.key === "ita" && form.itaDate ? { ...row, value: formatLongDate(form.itaDate) } : row,
  );

  const hasFillableEmpty = FILLABLE_KEYS.some((key) => !isFilled(String(form[key] ?? "")));

  function startEdit() {
    setDraft(form);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(form);
    setError(null);
    setEditing(false);
  }

  function patchDraft<K extends keyof ApplicantDetailsForm>(
    key: K,
    value: ApplicantDetailsForm[K],
  ) {
    // Never overwrite a value that was already saved.
    if (isFilled(String(form[key] ?? ""))) return;
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "pathway" && value !== "express-entry") {
        next.expressEntryProgram = "";
      }
      if (key === "pathway" && value === "express-entry" && !next.expressEntryProgram) {
        next.expressEntryProgram = "cec";
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // Preserve locked fields from the saved form; only send new fills for empty ones.
      const payload: ApplicantDetailsForm = {
        ...form,
        ...(isFilled(form.nationality) ? {} : { nationality: draft.nationality }),
        ...(isFilled(form.crsScore) ? {} : { crsScore: draft.crsScore }),
        ...(isFilled(form.maritalStatus) ? {} : { maritalStatus: draft.maritalStatus }),
        ...(isFilled(form.spouseStatus) ? {} : { spouseStatus: draft.spouseStatus }),
        ...(isFilled(form.foreignWork) ? {} : { foreignWork: draft.foreignWork }),
        ...(isFilled(form.canadianWork) ? {} : { canadianWork: draft.canadianWork }),
        ...(isFilled(form.dependants) ? {} : { dependants: draft.dependants }),
        ...(isFilled(form.countryOfResidence)
          ? {}
          : { countryOfResidence: draft.countryOfResidence }),
        ...(isFilled(form.medicalType) ? {} : { medicalType: draft.medicalType }),
      };
      const data = await api.updateApplicantDetails(userId, payload);
      if (data.form) setForm(data.form);
      else setForm(payload);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] px-[26px] py-[22px] shadow-[var(--shadow-md)]">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-extrabold tracking-[-0.02em] text-[var(--navy)]">
          Applicant details
        </h2>
        {!editing && hasFillableEmpty ? (
          <button
            type="button"
            onClick={startEdit}
            title="Add missing details"
            className="flex size-[34px] items-center justify-center rounded-full border border-[var(--border2)] bg-[var(--bg-elevated)] text-[var(--muted)] transition-[var(--ease)] hover:border-[var(--navy)] hover:text-[var(--navy)]"
          >
            <svg
              className="size-4 fill-none stroke-current stroke-[1.8]"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-x-[26px] min-[641px]:grid-cols-2">
        {rows.map((d) => {
          const isOffice = OFFICE_KEYS.has(d.key);
          const locked = isRowLocked(form, d.key);
          const displayValue =
            d.key === "pvo"
              ? form.primaryVisaOffice || "Click Here"
              : d.key === "svo"
                ? form.secondaryVisaOffice || "Click Here"
                : d.value;

          return (
            <div
              key={d.key}
              className="flex min-h-[46px] items-center gap-2.5 border-b border-[var(--border)] py-[11px]"
            >
              <span className="flex-1 text-[13px] text-[var(--muted)]">{d.label}</span>
              {isOffice ? (
                <button
                  type="button"
                  onClick={() => setOfficeModalOpen(true)}
                  title="Edit PVO and SVO on Edit milestones"
                  className={[
                    "text-right text-[13px] font-semibold transition-[var(--ease)]",
                    !form.primaryVisaOffice && d.key === "pvo"
                      ? "font-medium text-[var(--muted2)] hover:text-[var(--navy)]"
                      : !form.secondaryVisaOffice && d.key === "svo"
                        ? "font-medium text-[var(--muted2)] hover:text-[var(--navy)]"
                        : "text-[var(--ink)] hover:text-[var(--navy)]",
                  ].join(" ")}
                >
                  {displayValue}
                </button>
              ) : editing && !locked ? (
                <FieldEditor fieldKey={d.key} draft={draft} onChange={patchDraft} />
              ) : (
                <span
                  className={[
                    "text-right text-[13px] font-semibold",
                    d.value === "-" || displayValue === "-"
                      ? "font-medium text-[var(--muted2)]"
                      : "text-[var(--ink)]",
                  ].join(" ")}
                >
                  {d.value}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 text-xs font-semibold text-[var(--red)]" role="alert">
          {error}
        </p>
      ) : null}

      {editing ? (
        <div className="mt-3.5 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelEdit}
            disabled={saving}
            className="rounded-[9px] border border-[var(--border2)] bg-[var(--bg-elevated)] px-4 py-2 text-[13px] font-semibold text-[var(--ink)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-[9px] bg-[var(--red)] px-4 py-2 text-[13px] font-bold text-[var(--on-navy)] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save details"}
          </button>
        </div>
      ) : null}

      {officeModalOpen ? (
        <OfficeEditModal
          userId={userId}
          onClose={() => setOfficeModalOpen(false)}
        />
      ) : null}
    </section>
  );
}

function OfficeEditModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(22,32,43,0.38)]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="office-edit-title"
        className="relative z-[1] w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-5 shadow-[var(--shadow-lg)]"
      >
        <h3
          id="office-edit-title"
          className="m-0 font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-[-0.02em] text-[var(--navy)]"
        >
          Edit visa offices
        </h3>
        <p className="mt-2.5 mb-0 text-[13.5px] leading-relaxed text-[var(--muted)]">
          Primary and secondary visa offices (PVO / SVO) can&apos;t be changed here. Go to{" "}
          <strong className="font-semibold text-[var(--ink)]">Edit milestones</strong> to update
          them so your estimates can refresh.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[9px] border border-[var(--border2)] bg-[var(--bg-elevated)] px-4 py-2 text-[13px] font-semibold text-[var(--ink)]"
          >
            Cancel
          </button>
          <Link
            href={`/dashboard/${userId}/edit-milestone`}
            className="inline-flex items-center rounded-[9px] bg-[var(--red)] px-4 py-2 text-[13px] font-bold text-[var(--on-navy)]"
          >
            Go to Edit milestones
          </Link>
        </div>
      </div>
    </div>
  );
}

function FieldEditor({
  fieldKey,
  draft,
  onChange,
}: {
  fieldKey: string;
  draft: ApplicantDetailsForm;
  onChange: <K extends keyof ApplicantDetailsForm>(key: K, value: ApplicantDetailsForm[K]) => void;
}) {
  switch (fieldKey) {
    case "pathway":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.pathway}
          options={APPLICANT_DETAIL_OPTIONS.pathways}
          onChange={(v) => onChange("pathway", v)}
        />
      );
    case "ee":
      return draft.pathway === "express-entry" ? (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.expressEntryProgram}
          options={APPLICANT_DETAIL_OPTIONS.eePrograms}
          onChange={(v) => onChange("expressEntryProgram", v)}
        />
      ) : (
        <span className="text-[13px] font-medium text-[var(--muted2)]">-</span>
      );
    case "draw":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.drawCategory}
          options={APPLICANT_DETAIL_OPTIONS.drawCategories}
          onChange={(v) => onChange("drawCategory", v)}
        />
      );
    case "ita":
      return (
        <DashboardDatePicker
          className={editControl}
          value={draft.itaDate}
          max={draft.aorDate || undefined}
          popoverAlign="end"
          onChange={(v) => onChange("itaDate", v)}
        />
      );
    case "loc":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.applyingFrom}
          options={APPLICANT_DETAIL_OPTIONS.applyingFrom}
          onChange={(v) => onChange("applyingFrom", v)}
        />
      );
    case "nat":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.nationality}
          options={APPLICANT_DETAIL_OPTIONS.nationalities}
          onChange={(v) => onChange("nationality", v)}
        />
      );
    case "crs":
      return (
        <input
          type="number"
          min={0}
          max={1200}
          placeholder="e.g. 512"
          className={inputControl}
          value={draft.crsScore}
          onChange={(e) => onChange("crsScore", e.target.value)}
        />
      );
    case "mar":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.maritalStatus}
          options={APPLICANT_DETAIL_OPTIONS.marital}
          onChange={(v) => onChange("maritalStatus", v)}
        />
      );
    case "spouse":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.spouseStatus}
          options={APPLICANT_DETAIL_OPTIONS.spouse}
          onChange={(v) => onChange("spouseStatus", v)}
        />
      );
    case "fw":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.foreignWork}
          options={APPLICANT_DETAIL_OPTIONS.yesNo}
          onChange={(v) => onChange("foreignWork", v)}
        />
      );
    case "cw":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.canadianWork}
          options={APPLICANT_DETAIL_OPTIONS.yesNo}
          onChange={(v) => onChange("canadianWork", v)}
        />
      );
    case "dep":
      return (
        <input
          type="number"
          min={0}
          max={12}
          placeholder="0"
          className={inputControl}
          value={draft.dependants}
          onChange={(e) => onChange("dependants", e.target.value)}
        />
      );
    case "cres":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.countryOfResidence}
          options={APPLICANT_DETAIL_OPTIONS.residenceCountries}
          onChange={(v) => onChange("countryOfResidence", v)}
        />
      );
    case "med":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.medicalType}
          options={APPLICANT_DETAIL_OPTIONS.medical}
          onChange={(v) => onChange("medicalType", v)}
        />
      );
    default:
      return null;
  }
}
