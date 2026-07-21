import Link from "next/link";
import { LogoMark } from "@/components/common/LogoMark";
import { Button } from "@/components/ui";
import { GUIDE_URL } from "./landingShared";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-elevated">
      <div className="wrap flex h-16 items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="display text-lg font-extrabold tracking-tight text-navy">
            AOR<span className="text-red">Track</span>
          </span>
          <span className="ml-1 hidden rounded-md border border-border2 px-1.5 py-0.5 text-xs font-semibold text-muted2 sm:inline">
            PR TRACKER
          </span>
        </Link>
        <div className="flex-1" />
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Sections">
          {[
            ["#milestones", "Milestones"],
            ["#cohorts", "Cohort groups"],
            ["#timelines", "Community timelines"],
            ["#community", "WhatsApp & Facebook"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-bg-muted hover:text-ink"
            >
              {label}
            </a>
          ))}
          <a
            href={GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-bg-muted hover:text-ink"
          >
            Guide
          </a>
        </nav>
        <Link
          href="/login"
          className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:text-navy sm:inline"
        >
          Sign in
        </Link>
        <Button href="/track" size="sm">
          Track my PR
        </Button>
      </div>
    </header>
  );
}
