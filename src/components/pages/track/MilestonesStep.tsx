"use client";

import { useMemo, useState } from "react";
import {
  MILESTONES,
  OFFICE_LIST,
  type MilestoneId,
  type MilestoneSection,
  type VisaOffice,
} from "@/lib/schema/constants";
import type { MilestoneEstimate } from "@/lib/schema/types";
import { formatEstimateRange } from "@/lib/estimateFormat";
import {
  emptyMilestonesFormState,
  type MilestoneEntry,
  type MilestonesFormState,
} from "@/lib/milestonesForm";
import { DashboardDatePicker, PageLoader, Select } from "@/components/ui";
import { api } from "@/lib/api";
import type { ApplicationFormValues } from "./ApplicationDetailsCard";

export type { MilestoneEntry, MilestonesFormState };
export { emptyMilestonesFormState };

const SECTION_LABELS: Record<MilestoneSection, string> = {
  biometrics: "Biometrics",
  "medical-and-background": "Medical and background",
  "decision-and-portals": "Decision and portals",
  "the-finish-line": "The finish line",
};

const OFFICE_OPTIONS: { value: VisaOffice; label: string }[] = OFFICE_LIST.map((o) => ({
  value: o,
  label: o,
}));

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayAfterIso(iso: string): string {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)) - 1;
  const d = Number(iso.slice(8, 10));
  const dt = new Date(y, m, d);
  dt.setDate(dt.getDate() + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function needsOf(id: MilestoneId): MilestoneId | null {
  const m = MILESTONES.find((x) => x.id === id);
  if (!m || !("needs" in m) || !m.needs) return null;
  return m.needs as MilestoneId;
}

function isSub(id: MilestoneId): boolean {
  const m = MILESTONES.find((x) => x.id === id);
  return Boolean(m && "sub" in m && m.sub);
}

const MILESTONE_SECTIONS: {
  sec: MilestoneSection;
  items: (typeof MILESTONES)[number][];
}[] = (() => {
  const out: { sec: MilestoneSection; items: (typeof MILESTONES)[number][] }[] = [];
  for (const m of MILESTONES) {
    const last = out[out.length - 1];
    if (!last || last.sec !== m.sec) out.push({ sec: m.sec, items: [m] });
    else last.items.push(m);
  }
  return out;
})();

/** Port of HTML `validateMs` rules. */
function validateMilestoneDate(
  id: MilestoneId,
  state: MilestonesFormState,
  aorDate: string,
): string {
  const st = state.milestones[id];
  if (!st.done || !st.date) return "";

  const d = st.date;
  const today = todayIso();

  if (d > today) {
    return "This date is in the future. Log milestones once they happen.";
  }
  if (aorDate && id === "bil" && d === aorDate) {
    return "Your BIL cannot land the same day as your AOR. It typically arrives about 2 months later. Check both dates.";
  }
  if (aorDate && id === "bil" && d < aorDate) {
    return "Your BIL cannot come before your AOR.";
  }
  if (aorDate && id !== "bil" && d <= aorDate) {
    return "This cannot be on or before your AOR date.";
  }

  const bil = state.milestones.bil.date;
  if (id === "bio_done" && bil && d < bil) {
    return "Biometrics cannot be completed before your BIL arrived.";
  }
  if (id === "bio_done" && bil && d === bil) {
    return "Same day BIL and biometrics is almost never possible. You need to book an appointment first.";
  }

  const bgc = state.milestones.bgc_start.date;
  if ((id === "crim" || id === "info" || id === "sec") && bgc && d < bgc) {
    return "This check cannot finish before your background check started.";
  }

  const bio = state.milestones.bio_done.date;
  if (id === "bgc_start" && bio && d < bio) {
    return "Background checks start after biometrics. Check this date.";
  }

  const elig = state.milestones.elig.date;
  if (id === "final" && elig && d < elig) {
    return "Final decision cannot come before eligibility passed.";
  }

  const p1 = state.milestones.p1.date;
  if (id === "p2" && p1 && d < p1) {
    return "P2 cannot arrive before P1.";
  }

  const p2 = state.milestones.p2.date;
  if (id === "ecopr" && p2 && d < p2) {
    return "eCOPR cannot come before your P2 invite.";
  }

  const ecopr = state.milestones.ecopr.date;
  if (id === "prcard" && ecopr && d <= ecopr) {
    return "Your PR card arrives after your eCOPR.";
  }

  return "";
}

type MilestonesStepProps = {
  userId: string;
  application: ApplicationFormValues;
  estimates?: MilestoneEstimate[];
  estimateNotice?: string | null;
  /** Prefill when editing an existing timeline. */
  initialState?: MilestonesFormState;
  backLabel?: string;
  onBack: () => void;
  onSubmit: (state: MilestonesFormState) => void | Promise<void>;
  /** Called after offices are saved and with-offices estimates return. */
  onEstimatesChange?: (estimates: MilestoneEstimate[]) => void;
};

export function MilestonesStep({
  userId,
  application,
  estimates: estimatesProp = [],
  estimateNotice = null,
  initialState,
  backLabel = "Back",
  onBack,
  onSubmit,
  onEstimatesChange,
}: MilestonesStepProps) {
  const [state, setState] = useState<MilestonesFormState>(
    () => initialState ?? emptyMilestonesFormState(),
  );
  const [estimates, setEstimates] = useState<MilestoneEstimate[]>(estimatesProp);
  const [errors, setErrors] = useState<Partial<Record<MilestoneId, string>>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingOffices, setSavingOffices] = useState(false);
  const [officeConfirmOpen, setOfficeConfirmOpen] = useState(false);
  const [officesLocked, setOfficesLocked] = useState(
    () => Boolean(initialState?.primaryVisaOffice || initialState?.secondaryVisaOffice),
  );

  const estimatesById = useMemo(() => {
    const map = new Map<MilestoneId, MilestoneEstimate>();
    for (const est of estimates) {
      map.set(est.milestoneId, est);
    }
    return map;
  }, [estimates]);

  const canSaveOffices =
    !officesLocked && Boolean(state.primaryVisaOffice && state.secondaryVisaOffice);

  async function saveOffices() {
    if (!canSaveOffices || savingOffices) return;

    setSavingOffices(true);
    setSubmitError(null);
    try {
      const data = await api.trackOffices({
        userId,
        primaryVisaOffice: state.primaryVisaOffice,
        secondaryVisaOffice: state.secondaryVisaOffice,
      });
      setEstimates(data.estimates ?? []);
      onEstimatesChange?.(data.estimates ?? []);
      setOfficesLocked(true);
      if (data.status === "failed") {
        flash(data.reason ?? "Offices saved, but estimates could not be refreshed.");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save offices. Try again.");
    } finally {
      setSavingOffices(false);
    }
  }

  function confirmSaveOffices() {
    setOfficeConfirmOpen(false);
    void saveOffices();
  }

  function estimateLabel(id: MilestoneId): string {
    if (id === "bio_done") return "30 days after BIL";
    const est = estimatesById.get(id);
    if (est) return formatEstimateRange(est);
    const def = MILESTONES.find((m) => m.id === id);
    if (!def?.est) return "no estimate";
    // BIL-only on first pass; remaining windows come after PVO/SVO are saved.
    return officesLocked || state.primaryVisaOffice || state.secondaryVisaOffice
      ? "Est. pending"
      : "After PVO & SVO";
  }

  const loggedCount = useMemo(
    () =>
      MILESTONES.filter((m) => state.milestones[m.id].done && state.milestones[m.id].date).length,
    [state.milestones],
  );

  const showOffices = state.milestones.bio_done.done && Boolean(state.milestones.bio_done.date);

  const aorMinNext = application.aorDate ? dayAfterIso(application.aorDate) : undefined;

  function flash(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3200);
  }

  function clearDependent(id: MilestoneId, next: MilestonesFormState) {
    if (id === "bil" && next.milestones.bio_done.done) {
      next.milestones.bio_done = { done: false, date: "" };
    }
    if (id === "bil" || id === "bio_done") {
      next.primaryVisaOffice = "";
      next.secondaryVisaOffice = "";
    }
    if (id === "bgc_start") {
      for (const sub of ["crim", "info", "sec"] as const) {
        if (next.milestones[sub].done) {
          next.milestones[sub] = { done: false, date: "" };
        }
      }
    }
  }

  function toggle(id: MilestoneId) {
    const need = needsOf(id);
    const st = state.milestones[id];

    if (!st.done && need && !state.milestones[need].done) {
      flash(
        id === "bio_done"
          ? "Log your BIL first. You cannot complete biometrics without the letter."
          : "Mark background check initiated first. Sub checks come after it starts.",
      );
      return;
    }

    setState((prev) => {
      const next: MilestonesFormState = {
        ...prev,
        milestones: { ...prev.milestones },
      };
      const cur = next.milestones[id];
      const done = !cur.done;
      next.milestones[id] = { done, date: done ? cur.date : "" };
      if (!done) clearDependent(id, next);
      return next;
    });

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setSubmitError(null);
  }

  function setDate(id: MilestoneId, date: string) {
    setState((prev) => {
      const next: MilestonesFormState = {
        ...prev,
        milestones: {
          ...prev.milestones,
          [id]: { ...prev.milestones[id], date },
        },
      };
      const msg = validateMilestoneDate(id, next, application.aorDate);
      setErrors((e) => {
        const copy = { ...e };
        if (msg) copy[id] = msg;
        else delete copy[id];
        return copy;
      });
      return next;
    });
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (submitting) return;

    const nextErrors: Partial<Record<MilestoneId, string>> = {};
    let firstBad: { id: MilestoneId; msg: string } | null = null;

    for (const m of MILESTONES) {
      const st = state.milestones[m.id];
      if (st.done && !st.date) {
        const msg = `Add the date for ${m.label}.`;
        nextErrors[m.id] = msg;
        if (!firstBad) firstBad = { id: m.id, msg };
        continue;
      }
      const msg = validateMilestoneDate(m.id, state, application.aorDate);
      if (msg) {
        nextErrors[m.id] = msg;
        if (!firstBad) firstBad = { id: m.id, msg };
      }
    }

    setErrors(nextErrors);
    if (firstBad) {
      flash(firstBad.msg);
      document.getElementById(`ms-row-${firstBad.id}`)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(state);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not save your timeline. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div>
      {estimateNotice ? (
        <div
          className="mb-4 rounded-[var(--radius-md)] border border-[#efd9a8] bg-[var(--abg)] px-4 py-3 text-sm font-semibold text-[#5b4a1e]"
          role="status"
        >
          {estimateNotice}
        </div>
      ) : null}

      {notice ? (
        <div
          className="mb-4 rounded-[var(--radius-md)] border border-[var(--red)] bg-[var(--red-pale)] px-4 py-3 text-sm font-semibold text-[var(--red)]"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <div className="mb-[18px] flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-2 rounded-[9px] border border-[var(--border2)] bg-[var(--bg-elevated)] px-[15px] py-2 text-[13px] font-bold text-[var(--ink)] transition-[var(--ease)] hover:border-[var(--muted2)]"
          >
            <svg
              className="size-4 fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </button>

          <div className="min-w-[140px] flex-1 sm:w-[170px] sm:flex-none">
            <div className="mb-1.5 flex justify-between text-[11.5px] font-semibold text-[var(--muted)]">
              <span>Logged</span>
              <b className="text-[var(--navy)]">
                {loggedCount} of {MILESTONES.length}
              </b>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-[var(--red)] transition-[width] duration-300 ease-out"
                style={{
                  width: `${Math.round((loggedCount / MILESTONES.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--red)] px-[22px] py-[11px] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--on-navy)] transition-[var(--ease)] hover:bg-[var(--red2)] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        >
          {submitting ? "Saving…" : "Submit"}
        </button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]">
        {MILESTONE_SECTIONS.map(({ sec, items }, secIndex) => (
          <div key={sec}>
            <div
              className={[
                "border-t border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2.5 text-[11px] font-bold tracking-[0.1em] text-[var(--muted2)] uppercase sm:px-[26px]",
                secIndex === 0 ? "border-t-0" : "",
              ].join(" ")}
            >
              {SECTION_LABELS[sec]}
            </div>

            {items.map((m) => {
              const st = state.milestones[m.id];
              const err = errors[m.id];

              return (
                <div key={m.id}>
                  <div
                    id={`ms-row-${m.id}`}
                    className={[
                      "relative grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-2.5 border-t border-[var(--border)] px-4 py-3.5 transition-[var(--ease)] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:px-[26px] sm:py-[15px]",
                      isSub(m.id) ? "pl-10 sm:pl-[52px]" : "",
                      st.done
                        ? "bg-[linear-gradient(90deg,rgba(200,40,30,0.035),transparent_55%)] before:absolute before:top-0 before:bottom-0 before:left-0 before:w-[3px] before:bg-[var(--red)]"
                        : "hover:bg-[var(--bg-muted)]",
                      err ? "bg-[var(--red-pale)]" : "",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      aria-label={`Mark ${m.label}`}
                      aria-pressed={st.done}
                      onClick={() => toggle(m.id)}
                      className={[
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-[1.6px] transition-[var(--ease)] sm:mt-0",
                        st.done
                          ? "border-[var(--red)] bg-[var(--red)]"
                          : "border-[var(--border2)] bg-[var(--bg-elevated)] hover:border-[var(--red)]",
                      ].join(" ")}
                    >
                      <svg
                        className={[
                          "size-3 fill-none stroke-white stroke-[3] [stroke-linecap:round] [stroke-linejoin:round]",
                          st.done ? "opacity-100" : "opacity-0",
                        ].join(" ")}
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--ink)]">{m.label}</div>
                      <div className="text-xs break-words text-[var(--muted)]">{m.desc}</div>
                      {err ? (
                        <div className="mt-1 text-xs font-semibold text-[var(--red)]">{err}</div>
                      ) : null}
                    </div>

                    <div className="col-start-2 flex min-w-0 flex-wrap items-center justify-start gap-2 sm:col-start-3 sm:justify-end sm:gap-3">
                      {!st.done ? (
                        <span
                          className={[
                            "max-w-full text-left text-[11.5px] leading-snug sm:text-right",
                            estimatesById.has(m.id) || m.id === "bio_done"
                              ? "font-semibold text-[var(--navy)]"
                              : "text-[var(--muted2)] sm:whitespace-nowrap",
                          ].join(" ")}
                        >
                          {estimateLabel(m.id)}
                        </span>
                      ) : null}
                      {st.done ? (
                        <div className="w-full min-w-0 sm:w-[168px]">
                          <DashboardDatePicker
                            value={st.date}
                            onChange={(v) => setDate(m.id, v)}
                            min={application.aorDate ? aorMinNext : undefined}
                            max={todayIso()}
                            placeholder="dd-mm-yyyy"
                            popoverAlign="end"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {m.id === "bio_done" && showOffices ? (
                    <div className="border-t border-[var(--border)] bg-[var(--bg-muted)] px-4 py-5 sm:px-[26px]">
                      <h3 className="m-0 text-[14.5px] font-extrabold text-[var(--navy)]">
                        Which offices hold your file?
                      </h3>
                      <p className="mt-0.5 mb-3 text-[12.5px] text-[var(--muted)]">
                        After biometrics your file moves to a visa office. Telling us which one
                        sharpens every estimate below.
                      </p>

                      <div className="mb-3.5 flex gap-2.5 rounded-[11px] border border-[#efd9a8] bg-[var(--abg)] px-3.5 py-3 text-[12.5px] leading-[1.55] text-[#5b4a1e]">
                        <svg
                          className="mt-0.5 size-4 shrink-0 fill-none stroke-[var(--amber)] stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>
                          Not sure about your PVO or SVO? Call IRCC at{" "}
                          <a
                            className="font-bold text-[var(--red)] no-underline sm:whitespace-nowrap"
                            href="tel:18882422100"
                          >
                            1 888 242 2100
                          </a>{" "}
                          if you are within Canada, or{" "}
                          <a
                            className="font-bold text-[var(--red)] no-underline sm:whitespace-nowrap"
                            href="tel:16139444000"
                          >
                            1 613 944 4000
                          </a>{" "}
                          if you are outside Canada.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 min-[621px]:grid-cols-2">
                        <Select
                          label="Primary Visa Office (PVO)"
                          placeholder="Select"
                          value={state.primaryVisaOffice}
                          options={OFFICE_OPTIONS}
                          disabled={officesLocked || savingOffices}
                          onChange={(v) =>
                            setState((prev) => ({
                              ...prev,
                              primaryVisaOffice: v,
                            }))
                          }
                        />
                        <Select
                          label="Secondary Visa Office (SVO)"
                          placeholder="Select"
                          value={state.secondaryVisaOffice}
                          options={OFFICE_OPTIONS}
                          disabled={officesLocked || savingOffices}
                          onChange={(v) =>
                            setState((prev) => ({
                              ...prev,
                              secondaryVisaOffice: v,
                            }))
                          }
                        />
                      </div>

                      <div className="mt-4 flex justify-end">
                        {officesLocked ? (
                          <span className="text-[12.5px] font-semibold text-[var(--muted)]">
                            Offices saved
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!canSaveOffices || savingOffices}
                            onClick={() => setOfficeConfirmOpen(true)}
                            className="inline-flex items-center justify-center rounded-[10px] bg-[var(--navy)] px-[18px] py-2.5 text-[13px] font-bold text-[var(--on-navy)] transition-[var(--ease)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Save offices
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {submitError ? (
        <p className="mt-4 text-sm font-semibold text-[var(--red)]" role="alert">
          {submitError}
        </p>
      ) : null}

      {officeConfirmOpen ? (
        <OfficeSaveConfirmModal
          onCancel={() => setOfficeConfirmOpen(false)}
          onConfirm={confirmSaveOffices}
        />
      ) : null}

      <PageLoader
        open={submitting || savingOffices}
        message={savingOffices ? "Updating estimates…" : "Saving your timeline…"}
      />
    </div>
  );
}

function OfficeSaveConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(22,32,43,0.38)]"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="office-save-title"
        className="relative z-[1] w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-5 shadow-[var(--shadow-lg)]"
      >
        <h3
          id="office-save-title"
          className="m-0 font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-[-0.02em] text-[var(--navy)]"
        >
          Confirm visa offices
        </h3>
        <p className="mt-2.5 mb-0 text-[13.5px] leading-relaxed text-[var(--muted)]">
          Are you sure you want to submit these offices? PVO and SVO can&apos;t be edited later.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[9px] border border-[var(--border2)] bg-[var(--bg-elevated)] px-4 py-2 text-[13px] font-semibold text-[var(--ink)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[9px] bg-[var(--red)] px-4 py-2 text-[13px] font-bold text-[var(--on-navy)]"
          >
            Yes, save offices
          </button>
        </div>
      </div>
    </div>
  );
}
