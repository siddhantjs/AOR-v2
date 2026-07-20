"use client";

import { useEffect, useId, useRef, useState } from "react";
import { controlClass, errorClass, hintClass, labelClass } from "./fieldStyles";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

type Cell = {
  day: number;
  iso: string;
  outside: boolean;
};

function todayIso(): string {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

function toIso(y: number, m: number, day: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)) - 1;
  const d = Number(iso.slice(8, 10));
  const dt = new Date(y, m, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) {
    return null;
  }
  return { y, m, d };
}

/** Display as DD-MM-YYYY (matches product UI). */
function formatDisplay(iso: string): string {
  const p = parseIso(iso);
  if (!p) return "";
  return `${String(p.d).padStart(2, "0")}-${String(p.m + 1).padStart(2, "0")}-${p.y}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function buildCells(viewY: number, viewM: number): Cell[] {
  const CELLS = 5 * 7; // 5 rows
  const firstDow = new Date(viewY, viewM, 1).getDay();
  const dim = daysInMonth(viewY, viewM);
  const prevM = viewM === 0 ? 11 : viewM - 1;
  const prevY = viewM === 0 ? viewY - 1 : viewY;
  const prevDim = daysInMonth(prevY, prevM);
  const nextM = viewM === 11 ? 0 : viewM + 1;
  const nextY = viewM === 11 ? viewY + 1 : viewY;

  // Prefer Sunday alignment; if the month needs a 6th week, drop leading
  // outside days so every in-month date still fits in 5 rows.
  let leadingCount = firstDow;
  if (leadingCount + dim > CELLS) {
    leadingCount = Math.max(0, CELLS - dim);
  }

  const cells: Cell[] = [];

  for (let i = leadingCount - 1; i >= 0; i--) {
    const day = prevDim - i;
    cells.push({ day, iso: toIso(prevY, prevM, day), outside: true });
  }

  for (let day = 1; day <= dim; day++) {
    cells.push({ day, iso: toIso(viewY, viewM, day), outside: false });
  }

  let nextDay = 1;
  while (cells.length < CELLS) {
    cells.push({
      day: nextDay,
      iso: toIso(nextY, nextM, nextDay),
      outside: true,
    });
    nextDay += 1;
  }

  return cells.slice(0, CELLS);
}

function isOutOfRange(iso: string, min?: string, max?: string): boolean {
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Defaults to today (no future dates). Pass empty string to allow any future date. */
  max?: string;
  min?: string;
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** When false, the calendar popover closes. */
  active?: boolean;
  /** Anchor the fixed-width popover to the start or end of the trigger. */
  popoverAlign?: "start" | "end";
  "aria-labelledby"?: string;
};

/**
 * Themed calendar date picker. Value contract: `yyyy-mm-dd`.
 * Display format: `DD-MM-YYYY`.
 */
export function DashboardDatePicker({
  value,
  onChange,
  max = todayIso(),
  min,
  id: idProp,
  label,
  required,
  hint,
  error,
  placeholder = "dd-mm-yyyy",
  disabled,
  className,
  active = true,
  popoverAlign = "start",
  "aria-labelledby": ariaLabelledBy,
}: Props) {
  const autoId = useId();
  const rootId = idProp ?? autoId;
  const labelId = `${rootId}-label`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);

  const selected = parseIso(value);
  const hasError = Boolean(error);

  const [viewY, setViewY] = useState(() => selected?.y ?? new Date().getFullYear());
  const [viewM, setViewM] = useState(() => selected?.m ?? new Date().getMonth());

  useEffect(() => {
    if (!active) {
      setOpen(false);
      setMonthMenuOpen(false);
    }
  }, [active]);

  useEffect(() => {
    if (!open) return;
    if (selected) {
      setViewY(selected.y);
      setViewM(selected.m);
    }
  }, [open, selected?.y, selected?.m]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setMonthMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMonthMenuOpen(false);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const canPrev = (() => {
    const prevM = viewM === 0 ? 11 : viewM - 1;
    const prevY = viewM === 0 ? viewY - 1 : viewY;
    const last = toIso(prevY, prevM, daysInMonth(prevY, prevM));
    return !min || last >= min;
  })();

  const canNext = (() => {
    const nextM = viewM === 11 ? 0 : viewM + 1;
    const nextY = viewM === 11 ? viewY + 1 : viewY;
    const first = toIso(nextY, nextM, 1);
    return !max || first <= max;
  })();

  function goPrev() {
    if (!canPrev) return;
    if (viewM === 0) {
      setViewY((y) => y - 1);
      setViewM(11);
    } else {
      setViewM((m) => m - 1);
    }
  }

  function goNext() {
    if (!canNext) return;
    if (viewM === 11) {
      setViewY((y) => y + 1);
      setViewM(0);
    } else {
      setViewM((m) => m + 1);
    }
  }

  function pick(iso: string) {
    if (isOutOfRange(iso, min, max || undefined)) return;
    onChange(iso);
    setOpen(false);
    setMonthMenuOpen(false);
  }

  function clear() {
    onChange("");
    setOpen(false);
    setMonthMenuOpen(false);
  }

  function pickToday() {
    const t = todayIso();
    if (isOutOfRange(t, min, max || undefined)) return;
    const p = parseIso(t)!;
    setViewY(p.y);
    setViewM(p.m);
    pick(t);
  }

  const cells = buildCells(viewY, viewM);
  const today = todayIso();
  const display = value ? formatDisplay(value) : placeholder;

  return (
    <div
      ref={rootRef}
      className={["relative", open ? "z-50" : "", className].filter(Boolean).join(" ")}
    >
      {label ? (
        <label id={labelId} htmlFor={rootId} className={labelClass()}>
          {label}
          {required ? <span className="text-[var(--red)]"> *</span> : null}
        </label>
      ) : null}

      <button
        type="button"
        id={rootId}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={hasError || undefined}
        aria-labelledby={ariaLabelledBy ?? (label ? labelId : undefined)}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          setMonthMenuOpen(false);
        }}
        className={controlClass(
          hasError,
          [
            "flex cursor-pointer items-center justify-between gap-2 text-left",
            open ? "border-[var(--navy)] shadow-[0_0_0_3px_rgba(26,35,50,0.08)]" : "",
          ].join(" "),
        )}
      >
        <span className={value ? "truncate text-[var(--ink)]" : "truncate text-[var(--muted2)]"}>
          {display}
        </span>
        <svg
          className="size-4 shrink-0 fill-none stroke-[var(--muted)] stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      </button>

      {open ? (
        <div
          className={[
            "absolute z-50 mt-1.5 w-[288px] min-w-[288px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow-md)]",
            popoverAlign === "end" ? "right-0" : "left-0",
          ].join(" ")}
          role="dialog"
          aria-modal="false"
          aria-label="Choose date"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-1 font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--navy)] transition-[var(--ease)] hover:bg-[var(--bg-muted)]"
                aria-haspopup="listbox"
                aria-expanded={monthMenuOpen}
                onClick={() => setMonthMenuOpen((o) => !o)}
              >
                {MONTHS[viewM]}, {viewY}
                <svg
                  className="size-3 fill-none stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round]"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {monthMenuOpen ? (
                <ul
                  role="listbox"
                  className="absolute top-full left-0 z-10 mt-1 max-h-48 w-40 overflow-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] py-1 shadow-[var(--shadow-sm)]"
                >
                  {MONTHS.map((name, m) => (
                    <li key={name} role="option" aria-selected={m === viewM}>
                      <button
                        type="button"
                        className={[
                          "w-full px-3 py-1.5 text-left text-sm",
                          m === viewM
                            ? "bg-[var(--bbg)] font-semibold text-[var(--blue)]"
                            : "text-[var(--ink)] hover:bg-[var(--bg-muted)]",
                        ].join(" ")}
                        onClick={() => {
                          setViewM(m);
                          setMonthMenuOpen(false);
                        }}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink)] transition-[var(--ease)] hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-35"
                onClick={goPrev}
                disabled={!canPrev}
                aria-label="Previous month"
              >
                <svg
                  className="size-3.5 fill-none stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round]"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink)] transition-[var(--ease)] hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-35"
                onClick={goNext}
                disabled={!canNext}
                aria-label="Next month"
              >
                <svg
                  className="size-3.5 fill-none stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round]"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          <div
            className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] font-bold text-[var(--ink)]"
            aria-hidden
          >
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5" role="grid">
            {cells.map((cell) => {
              const disabledDay = isOutOfRange(cell.iso, min, max || undefined);
              const isSelected = cell.iso === value;
              const isToday = cell.iso === today;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  role="gridcell"
                  disabled={disabledDay}
                  aria-selected={isSelected}
                  aria-label={formatDisplay(cell.iso)}
                  onClick={() => {
                    const p = parseIso(cell.iso)!;
                    setViewY(p.y);
                    setViewM(p.m);
                    pick(cell.iso);
                  }}
                  className={[
                    "flex aspect-square items-center justify-center rounded-[var(--radius-sm)] text-[13px] font-medium transition-[var(--ease)]",
                    "disabled:cursor-not-allowed disabled:opacity-30",
                    cell.outside && !isSelected ? "text-[var(--muted2)]" : "text-[var(--ink)]",
                    isSelected
                      ? "bg-[var(--blue)] font-semibold text-[var(--on-navy)] ring-2 ring-[var(--navy)] ring-offset-1 ring-offset-[var(--bg-elevated)]"
                      : isToday
                        ? "ring-1 ring-[var(--border2)]"
                        : "hover:bg-[var(--bg-muted)]",
                  ].join(" ")}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2">
            <button
              type="button"
              className="rounded-[var(--radius-sm)] px-2 py-1 text-sm font-semibold text-[var(--blue)] transition-[var(--ease)] hover:bg-[var(--bbg)]"
              onClick={clear}
            >
              Clear
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-sm)] px-2 py-1 text-sm font-semibold text-[var(--blue)] transition-[var(--ease)] hover:bg-[var(--bbg)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={pickToday}
              disabled={isOutOfRange(today, min, max || undefined)}
            >
              Today
            </button>
          </div>
        </div>
      ) : null}

      {hint && !error ? <p className={hintClass()}>{hint}</p> : null}
      {error ? <p className={errorClass()}>{error}</p> : null}
    </div>
  );
}
