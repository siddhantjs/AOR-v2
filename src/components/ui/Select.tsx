"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { controlClass, errorClass, hintClass, labelClass } from "./fieldStyles";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SelectProps<T extends string = string> = {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  value: T | "";
  options: readonly SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
  onChange: (value: T) => void;
};

export function Select<T extends string = string>({
  label,
  required,
  hint,
  error,
  value,
  options,
  placeholder = "Select…",
  disabled,
  id: idProp,
  name,
  className,
  "aria-label": ariaLabel,
  onChange,
}: SelectProps<T>) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const listboxId = `${id}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = options.find((o) => o.value === value);
  const hasError = Boolean(error);
  const enabledOptions = useMemo(() => options.filter((o) => !o.disabled), [options]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }

    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const idx = enabledOptions.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [open, value, enabledOptions]);

  function selectOption(opt: SelectOption<T>) {
    if (opt.disabled) return;
    onChange(opt.value);
    close();
  }

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, enabledOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = enabledOptions[activeIndex];
      if (opt) selectOption(opt);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(enabledOptions.length - 1);
    }
  }

  return (
    <div ref={rootRef} className={className}>
      {label ? (
        <label htmlFor={id} className={labelClass()}>
          {label}
          {required ? <span className="text-[var(--red)]"> *</span> : null}
        </label>
      ) : null}

      {name ? <input type="hidden" name={name} value={value} /> : null}

      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={hasError || undefined}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onTriggerKeyDown}
          className={controlClass(
            hasError,
            "flex cursor-pointer items-center justify-between gap-2 text-left",
          )}
        >
          <span
            className={selected ? "truncate text-[var(--ink)]" : "truncate text-[var(--muted2)]"}
          >
            {selected?.label ?? placeholder}
          </span>
          <svg
            className={[
              "size-4 shrink-0 fill-none stroke-[var(--muted)] stroke-[1.8] transition-[var(--ease)] [stroke-linecap:round] [stroke-linejoin:round]",
              open ? "rotate-180" : "",
            ].join(" ")}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={id}
            onKeyDown={onListKeyDown}
            className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] py-1 shadow-[var(--shadow-md)] outline-none"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const enabledIdx = enabledOptions.findIndex((o) => o.value === opt.value);
              const isActive = !opt.disabled && enabledIdx === activeIndex;

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => {
                    if (!opt.disabled) setActiveIndex(enabledIdx);
                  }}
                  onClick={() => selectOption(opt)}
                  className={[
                    "cursor-pointer px-3 py-2 text-sm transition-[var(--ease)]",
                    opt.disabled
                      ? "cursor-not-allowed text-[var(--muted2)] opacity-50"
                      : isActive
                        ? "bg-[var(--red-pale)] text-[var(--red)]"
                        : isSelected
                          ? "bg-[var(--bg-muted)] font-semibold text-[var(--navy)]"
                          : "text-[var(--ink)] hover:bg-[var(--bg-muted)]",
                  ].join(" ")}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {hint && !error ? <p className={hintClass()}>{hint}</p> : null}
      {error ? <p className={errorClass()}>{error}</p> : null}
    </div>
  );
}
