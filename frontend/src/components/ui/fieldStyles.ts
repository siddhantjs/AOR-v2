/** Shared Tailwind class fragments for themed form controls (globals.css tokens). */

export function controlClass(hasError: boolean, extra = "") {
  return [
    "w-full rounded-[var(--radius-md)] border bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition-[var(--ease)]",
    "focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_rgba(26,35,50,0.08)]",
    "disabled:cursor-not-allowed disabled:opacity-60",
    hasError ? "border-[var(--red)] bg-[var(--red-pale)]" : "border-[var(--border2)]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function labelClass() {
  return "mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]";
}

export function hintClass() {
  return "mt-1.5 text-[11.5px] text-[var(--muted2)]";
}

export function errorClass() {
  return "mt-1.5 text-xs font-semibold text-[var(--red)]";
}
