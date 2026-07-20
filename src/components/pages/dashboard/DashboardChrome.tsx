import type { ReactNode } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/common/LogoMark";

type NavKey = "timeline" | "cohort" | "all-cohorts" | "edit";

type DashboardChromeProps = {
  userId: string;
  active: NavKey;
  children: ReactNode;
};

export function DashboardChrome({ userId, active, children }: DashboardChromeProps) {
  const base = `/dashboard/${userId}`;

  const link = (href: string, key: NavKey, label: string) => {
    const on = active === key;
    return on ? (
      <span className="rounded-[9px] bg-[var(--bg-muted)] px-3.5 py-2 text-[var(--navy)]">
        {label}
      </span>
    ) : (
      <Link
        href={href}
        className="rounded-[9px] px-3.5 py-2 text-[var(--muted)] transition-[var(--ease)] hover:text-[var(--navy)]"
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--max)] items-center justify-between gap-3 px-[22px]">
          <Link href="/" className="flex shrink-0 items-center gap-1">
            <LogoMark />
            <span className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              AOR<span className="text-[var(--red)]">Track</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 text-[13px] font-semibold">
            {link(base, "timeline", "My timeline")}
            {link(`${base}/cohort`, "cohort", "My cohort")}
            {link(`${base}/all-cohorts`, "all-cohorts", "All cohorts")}
            {link(`${base}/edit-milestone`, "edit", "Edit milestones")}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
