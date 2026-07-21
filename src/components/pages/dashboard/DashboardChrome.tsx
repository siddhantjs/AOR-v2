"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/common/LogoMark";

type NavKey = "timeline" | "cohort" | "all-cohorts" | "edit";

type NavItem = {
  href: string;
  key: NavKey;
  label: string;
};

type DashboardChromeProps = {
  userId: string;
  active: NavKey;
  children: ReactNode;
};

export function DashboardChrome({ userId, active, children }: DashboardChromeProps) {
  const base = `/dashboard/${userId}`;
  const panelId = useId();
  const [menuOpen, setMenuOpen] = useState(false);

  const items: NavItem[] = [
    { href: base, key: "timeline", label: "My timeline" },
    { href: `${base}/cohort`, key: "cohort", label: "My cohort" },
    { href: `${base}/all-cohorts`, key: "all-cohorts", label: "All cohorts" },
    { href: `${base}/edit-milestone`, key: "edit", label: "Edit milestones" },
  ];

  useEffect(() => {
    if (!menuOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [active]);

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--max)] items-center justify-between gap-3 px-4 sm:px-[22px]">
          <Link href="/" className="flex shrink-0 items-center gap-1">
            <LogoMark />
            <span className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              AOR<span className="text-[var(--red)]">Track</span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 text-[13px] font-semibold md:flex"
            aria-label="Dashboard"
          >
            {items.map((item) => (
              <DesktopNavLink key={item.key} item={item} active={active} />
            ))}
          </nav>

          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-[9px] text-[var(--navy)] transition-[var(--ease)] hover:bg-[var(--bg-muted)] md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={panelId}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg
                className="size-5 fill-none stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round]"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="size-5 fill-none stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round]"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div
        className={[
          "fixed inset-0 z-[60] md:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close menu"
          className={[
            "absolute inset-0 bg-[rgba(22,32,43,0.38)] transition-opacity duration-200",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setMenuOpen(false)}
        />

        <aside
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={[
            "absolute top-0 right-0 flex h-full w-[min(300px,88vw)] flex-col bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] transition-transform duration-[280ms] ease-[cubic-bezier(0.3,0.8,0.3,1)]",
            menuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-[var(--header-h)] items-center justify-between border-b border-[var(--border)] px-4">
            <span className="font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              Menu
            </span>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-[9px] text-[var(--navy)] transition-[var(--ease)] hover:bg-[var(--bg-muted)]"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <svg
                className="size-5 fill-none stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round]"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Dashboard">
            {items.map((item) => {
              const on = active === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={[
                    "rounded-[10px] px-3.5 py-3 text-[15px] font-semibold transition-[var(--ease)]",
                    on
                      ? "bg-[var(--bg-muted)] text-[var(--navy)]"
                      : "text-[var(--ink)] hover:bg-[var(--bg-muted)] hover:text-[var(--navy)]",
                  ].join(" ")}
                  aria-current={on ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>

      {children}
    </div>
  );
}

function DesktopNavLink({ item, active }: { item: NavItem; active: NavKey }) {
  const on = active === item.key;
  const pad = "shrink-0 whitespace-nowrap rounded-[9px] px-3.5 py-2";
  if (on) {
    return <span className={`${pad} bg-[var(--bg-muted)] text-[var(--navy)]`}>{item.label}</span>;
  }
  return (
    <Link
      href={item.href}
      className={`${pad} text-[var(--muted)] transition-[var(--ease)] hover:text-[var(--navy)]`}
    >
      {item.label}
    </Link>
  );
}
