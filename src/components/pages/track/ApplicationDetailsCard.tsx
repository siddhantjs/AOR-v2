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

function validate(values: ApplicationFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.applyingFrom) {
    errors.applyingFrom = "Choose Inland or Outland.";
  }
  if (values.pathway === "express-entry" && !values.expressEntryProgram) {
    errors.expressEntryProgram = "Choose an Express Entry program.";
  }
  if (!values.itaDate) {
    errors.itaDate = "Add your ITA date.";
  }
  if (!values.aorDate) {
    errors.aorDate = "Add your AOR date.";
  }
  if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "A valid email is required.";
  }

  return errors;
}

function fieldControlClass(hasError: boolean) {
  return [
    "w-full rounded-[var(--radius-md)] border bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition-[var(--ease)]",
    "focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_rgba(26,35,50,0.08)]",
    hasError ? "border-[var(--red)] bg-[var(--red-pale)]" : "border-[var(--border2)]",
  ].join(" ");
}

type ApplicationDetailsCardProps = {
  onContinue?: (values: ApplicationFormValues) => void;
};

export function ApplicationDetailsCard({ onContinue }: ApplicationDetailsCardProps) {
  const [values, setValues] = useState<ApplicationFormValues>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  const showEeProgram = values.pathway === "express-entry";
  const visibleErrors = useMemo(() => (touched ? errors : {}), [touched, errors]);

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

  function handleContinue() {
    const nextErrors = validate(values);
    setTouched(true);
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
          <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]">
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
            <div className="mt-1.5 text-xs font-semibold text-[var(--red)]">
              {visibleErrors.applyingFrom}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-x-[18px] gap-y-4 min-[621px]:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]">
              Pathway <span className="text-[var(--red)]">*</span>
            </label>
            <select
              className={fieldControlClass(false)}
              value={values.pathway}
              onChange={(e) => update("pathway", e.target.value as Pathway)}
            >
              {PATHWAYS.map((pathway) => (
                <option key={pathway} value={pathway}>
                  {PATHWAY_LABELS[pathway]}
                </option>
              ))}
            </select>
          </div>

          {showEeProgram ? (
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]">
                Express Entry program <span className="text-[var(--red)]">*</span>
              </label>
              <select
                className={fieldControlClass(Boolean(visibleErrors.expressEntryProgram))}
                value={values.expressEntryProgram ?? ""}
                onChange={(e) =>
                  update("expressEntryProgram", e.target.value as ExpressEntryProgram)
                }
              >
                {EXPRESS_ENTRY_PROGRAMS.map((program) => (
                  <option key={program} value={program}>
                    {EE_PROGRAM_LABELS[program]}
                  </option>
                ))}
              </select>
              {visibleErrors.expressEntryProgram ? (
                <div className="mt-1.5 text-xs font-semibold text-[var(--red)]">
                  {visibleErrors.expressEntryProgram}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="min-[621px]:col-span-2">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]">
              Draw category <span className="text-[var(--red)]">*</span>
            </label>
            <select
              className={fieldControlClass(false)}
              value={values.drawCategory}
              onChange={(e) => update("drawCategory", e.target.value as DrawCategory)}
            >
              {DRAW_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]">
              ITA date <span className="text-[var(--red)]">*</span>
            </label>
            <input
              type="date"
              className={fieldControlClass(Boolean(visibleErrors.itaDate))}
              value={values.itaDate}
              onChange={(e) => update("itaDate", e.target.value)}
            />
            <div className="mt-1.5 text-[11.5px] text-[var(--muted2)]">
              The day IRCC invited you to apply.
            </div>
            {visibleErrors.itaDate ? (
              <div className="mt-1.5 text-xs font-semibold text-[var(--red)]">
                {visibleErrors.itaDate}
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]">
              AOR date <span className="text-[var(--red)]">*</span>
            </label>
            <input
              type="date"
              className={fieldControlClass(Boolean(visibleErrors.aorDate))}
              value={values.aorDate}
              onChange={(e) => update("aorDate", e.target.value)}
            />
            <div className="mt-1.5 text-[11.5px] text-[var(--muted2)]">
              The day IRCC acknowledged your application. Sets your cohort.
            </div>
            {visibleErrors.aorDate ? (
              <div className="mt-1.5 text-xs font-semibold text-[var(--red)]">
                {visibleErrors.aorDate}
              </div>
            ) : null}
          </div>

          <div className="min-[621px]:col-span-2">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]">
              Email <span className="text-[var(--red)]">*</span>
            </label>
            <input
              type="email"
              className={fieldControlClass(Boolean(visibleErrors.email))}
              value={values.email}
              placeholder="you@example.com"
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
            />
            <div className="mt-1.5 text-[11.5px] text-[var(--muted2)]">
              Saves your timeline and sends milestone alerts. Never shown publicly.
            </div>
            {visibleErrors.email ? (
              <div className="mt-1.5 text-xs font-semibold text-[var(--red)]">
                {visibleErrors.email}
              </div>
            ) : null}
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
