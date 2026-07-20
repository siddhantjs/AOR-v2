"use client";

import { useMemo, useState } from "react";
import {
  DRAW_CATEGORIES,
  EXPRESS_ENTRY_PROGRAMS,
  PATHWAYS,
  type ApplyingFrom,
  type DrawCategory,
  type ExpressEntryProgram,
  type Pathway,
} from "@/lib/schema/constants";
import { controlClass, DashboardDatePicker, errorClass, hintClass, labelClass, Select } from "@/components/ui";

const PATHWAY_LABELS: Record<Pathway, string> = {
  "express-entry": "Express Entry",
  "provincial-nominee-program": "PNP, Provincial Nominee Program",
};

const EE_PROGRAM_LABELS: Record<ExpressEntryProgram, string> = {
  cec: "CEC, Canadian Experience Class",
  fswp: "FSWP, Federal Skilled Worker Program",
  fstp: "FSTP, Federal Skilled Trades Program",
};

const RESIDENCE_OPTIONS: {
  value: ApplyingFrom;
  title: string;
  subtitle: string;
}[] = [
  {
    value: "inland",
    title: "Inland",
    subtitle: "You live in Canada right now",
  },
  {
    value: "outland",
    title: "Outland",
    subtitle: "You live outside Canada",
  },
];

const PATHWAY_OPTIONS = PATHWAYS.map((pathway) => ({
  value: pathway,
  label: PATHWAY_LABELS[pathway],
}));

const EE_PROGRAM_OPTIONS = EXPRESS_ENTRY_PROGRAMS.map((program) => ({
  value: program,
  label: EE_PROGRAM_LABELS[program],
}));

const DRAW_OPTIONS = DRAW_CATEGORIES.map((cat) => ({
  value: cat.value,
  label: cat.label,
}));

export type ApplicationFormValues = {
  applyingFrom: ApplyingFrom | null;
  pathway: Pathway;
  expressEntryProgram: ExpressEntryProgram | null;
  drawCategory: DrawCategory;
  itaDate: string;
  aorDate: string;
  email: string;
};

type FieldErrors = Partial<Record<keyof ApplicationFormValues, string>>;

const INITIAL: ApplicationFormValues = {
  applyingFrom: null,
  pathway: "express-entry",
  expressEntryProgram: "cec",
  drawCategory: "general",
  itaDate: "",
  aorDate: "",
  email: "",
};

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

/** Matches HTML `onCoreDates` / `validatePhase1` date rules. */
function validateCoreDates(
  values: Pick<ApplicationFormValues, "itaDate" | "aorDate">,
  opts: { requirePresent?: boolean } = {},
): FieldErrors {
  const { requirePresent = true } = opts;
  const errors: FieldErrors = {};

  if (requirePresent) {
    if (!values.itaDate) {
      errors.itaDate = "Add your ITA date.";
    }
    if (!values.aorDate) {
      errors.aorDate = "Add your AOR date.";
    }
  }

  if (values.itaDate && values.aorDate && values.aorDate <= values.itaDate) {
    errors.aorDate = "AOR comes after your ITA. Check both dates.";
  } else if (values.aorDate && values.aorDate > todayIso()) {
    errors.aorDate = "AOR cannot be in the future.";
  }

  return errors;
}

function validate(values: ApplicationFormValues): FieldErrors {
  const errors: FieldErrors = {
    ...validateCoreDates(values, { requirePresent: true }),
  };

  if (!values.applyingFrom) {
    errors.applyingFrom = "Choose Inland or Outland.";
  }
  if (values.pathway === "express-entry" && !values.expressEntryProgram) {
    errors.expressEntryProgram = "Choose an Express Entry program.";
  }
  if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "A valid email is required.";
  }

  return errors;
}

type ApplicationDetailsCardProps = {
  onContinue?: (values: ApplicationFormValues) => void;
};

export function ApplicationDetailsCard({ onContinue }: ApplicationDetailsCardProps) {
  const [values, setValues] = useState<ApplicationFormValues>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);
  const [datesTouched, setDatesTouched] = useState(false);

  const showEeProgram = values.pathway === "express-entry";
  const visibleErrors = useMemo(() => {
    if (touched) return errors;
    if (!datesTouched) return {};
    return {
      ...(errors.itaDate ? { itaDate: errors.itaDate } : {}),
      ...(errors.aorDate ? { aorDate: errors.aorDate } : {}),
    };
  }, [touched, datesTouched, errors]);

  function update<K extends keyof ApplicationFormValues>(
    key: K,
    value: ApplicationFormValues[K],
  ) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "pathway" && value !== "express-entry") {
        next.expressEntryProgram = null;
      }
      if (key === "pathway" && value === "express-entry" && !next.expressEntryProgram) {
        next.expressEntryProgram = "cec";
      }
      return next;
    });
  }

  /** Live date checks — same rules as HTML `onCoreDates`. */
  function updateDate(key: "itaDate" | "aorDate", value: string) {
    const next = { ...values, [key]: value };
    setDatesTouched(true);
    setValues(next);
    setErrors((prevErrs) => {
      const { itaDate: _i, aorDate: _a, ...rest } = prevErrs;
      return { ...rest, ...validateCoreDates(next, { requirePresent: false }) };
    });
  }

  function handleContinue() {
    const nextErrors = validate(values);
    setTouched(true);
    setDatesTouched(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onContinue?.(values);
  }

  return (
    <div className="mx-auto max-w-[660px]">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-[30px_34px] shadow-[var(--shadow-md)] max-[620px]:p-5">
        <h2 className="m-0 text-lg font-extrabold tracking-[-0.02em] text-[var(--navy)]">
          Application details
        </h2>
        <p className="mt-1 mb-[22px] text-[13px] text-[var(--muted)]">
          Everything here shapes which timelines we compare you against.
        </p>

        <div className="mb-4">
          <label className={labelClass()}>
            Where are you applying from? <span className="text-[var(--red)]">*</span>
          </label>
          <div
            className="grid grid-cols-2 gap-2.5"
            role="group"
            aria-label="Applying from"
          >
            {RESIDENCE_OPTIONS.map((opt) => {
              const selected = values.applyingFrom === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("applyingFrom", opt.value)}
                  className={[
                    "rounded-[var(--radius-md)] border px-3 py-3 text-left transition-[var(--ease)]",
                    selected
                      ? "border-[var(--red)] bg-[var(--red-pale)] shadow-[0_0_0_3px_rgba(200,40,30,0.08)]"
                      : visibleErrors.applyingFrom
                        ? "border-[var(--red)] bg-[var(--bg-elevated)]"
                        : "border-[var(--border2)] bg-[var(--bg-elevated)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "block font-[family-name:var(--font-display)] text-sm font-bold",
                      selected ? "text-[var(--red)]" : "text-[var(--ink)]",
                    ].join(" ")}
                  >
                    {opt.title}
                  </span>
                  <small className="text-[11.5px] text-[var(--muted)]">{opt.subtitle}</small>
                </button>
              );
            })}
          </div>
          {visibleErrors.applyingFrom ? (
            <p className={errorClass()}>{visibleErrors.applyingFrom}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-x-[18px] gap-y-4 min-[621px]:grid-cols-2">
          <Select
            label="Pathway"
            required
            value={values.pathway}
            options={PATHWAY_OPTIONS}
            onChange={(v) => update("pathway", v)}
          />

          {showEeProgram ? (
            <Select
              label="Express Entry program"
              required
              value={values.expressEntryProgram ?? ""}
              options={EE_PROGRAM_OPTIONS}
              error={visibleErrors.expressEntryProgram}
              onChange={(v) => update("expressEntryProgram", v)}
            />
          ) : null}

          <Select
            className="min-[621px]:col-span-2"
            label="Draw category"
            required
            value={values.drawCategory}
            options={DRAW_OPTIONS}
            onChange={(v) => update("drawCategory", v)}
          />

          <DashboardDatePicker
            label="ITA date"
            required
            value={values.itaDate}
            onChange={(v) => updateDate("itaDate", v)}
            max={todayIso()}
            hint="The day IRCC invited you to apply."
            error={visibleErrors.itaDate}
          />

          <DashboardDatePicker
            label="AOR date"
            required
            value={values.aorDate}
            onChange={(v) => updateDate("aorDate", v)}
            min={values.itaDate ? dayAfterIso(values.itaDate) : undefined}
            max={todayIso()}
            hint="The day IRCC acknowledged your application. Sets your cohort."
            error={visibleErrors.aorDate}
          />

          <div className="min-[621px]:col-span-2">
            <label htmlFor="track-email" className={labelClass()}>
              Email <span className="text-[var(--red)]">*</span>
            </label>
            <input
              id="track-email"
              type="email"
              className={controlClass(Boolean(visibleErrors.email))}
              value={values.email}
              placeholder="you@example.com"
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
            />
            {!visibleErrors.email ? (
              <p className={hintClass()}>
                Saves your timeline and sends milestone alerts. Never shown publicly.
              </p>
            ) : (
              <p className={errorClass()}>{visibleErrors.email}</p>
            )}
          </div>
        </div>

        <div className="mt-[22px] flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--red)] px-[22px] py-[11px] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--on-navy)] transition-[var(--ease)] hover:bg-[var(--red2)]"
          >
            Continue
            <svg
              className="size-4 shrink-0 fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
