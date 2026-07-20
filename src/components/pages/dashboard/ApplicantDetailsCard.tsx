"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  APPLICANT_DETAIL_OPTIONS,
  displayApplicantDetails,
  type ApplicantDetailsForm,
} from "@/lib/applicantDetails";
import { formatLongDate } from "@/lib/dates";
import { DashboardDatePicker, Select } from "@/components/ui";

const editControl = "w-[168px] shrink-0 [&_button]:py-1.5 [&_button]:text-[12.5px]";

const inputControl =
  "w-[168px] rounded-[var(--radius-md)] border border-[var(--border2)] bg-[var(--bg-elevated)] px-3 py-1.5 text-right text-[12.5px] text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_rgba(26,35,50,0.08)]";

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

  const rows = displayApplicantDetails(form).map((row) =>
    row.key === "ita" && form.itaDate ? { ...row, value: formatLongDate(form.itaDate) } : row,
  );

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
      const res = await fetch(`/api/dashboard/${userId}/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as {
        error?: string;
        form?: ApplicantDetailsForm;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not save details.");
        return;
      }
      if (data.form) setForm(data.form);
      else setForm(draft);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Could not save details.");
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
        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            title="Edit details"
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
        {rows.map((d) => (
          <div
            key={d.key}
            className="flex min-h-[46px] items-center gap-2.5 border-b border-[var(--border)] py-[11px]"
          >
            <span className="flex-1 text-[13px] text-[var(--muted)]">{d.label}</span>
            {editing ? (
              <FieldEditor fieldKey={d.key} draft={draft} onChange={patchDraft} />
            ) : (
              <span
                className={[
                  "text-right text-[13px] font-semibold",
                  d.value === "—" ? "font-medium text-[var(--muted2)]" : "text-[var(--ink)]",
                ].join(" ")}
              >
                {d.value}
              </span>
            )}
          </div>
        ))}
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
    </section>
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
        <span className="text-[13px] font-medium text-[var(--muted2)]">—</span>
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
    case "pvo":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.primaryVisaOffice}
          options={APPLICANT_DETAIL_OPTIONS.offices}
          onChange={(v) => onChange("primaryVisaOffice", v)}
        />
      );
    case "svo":
      return (
        <Select
          className={editControl}
          placeholder="Select"
          value={draft.secondaryVisaOffice}
          options={APPLICANT_DETAIL_OPTIONS.offices}
          onChange={(v) => onChange("secondaryVisaOffice", v)}
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
