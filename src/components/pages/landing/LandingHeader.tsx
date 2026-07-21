import Link from "next/link";
import { LogoMark } from "@/components/common/LogoMark";
import { Button } from "@/components/ui";
import { GUIDE_URL } from "./landingShared";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-elevated">
      <div className="w-full p-8 flex h-16 items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="display text-lg font-extrabold tracking-tight text-navy">
            AOR<span className="text-red">Track</span>
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
        <Button href="/login" size="sm" className="border-navy bg-transparent text-navy hover:bg-bg-muted hover:scale-105 hover:border-red hover:text-red">
          Sign in
        </Button>
        <Button href="/track" size="sm">
          Track my PR
        </Button>
      </div>
    </header>
  );
}
