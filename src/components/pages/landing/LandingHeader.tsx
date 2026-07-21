import Link from "next/link";
import { LogoMark } from "@/components/common/LogoMark";
import { Button } from "@/components/ui";
import { GUIDE_URL } from "./landingShared";

export function LandingHeader() {
  return (
    <header className="border-border bg-bg-elevated sticky top-0 z-50 border-b">
      <div className="flex h-16 w-full items-center gap-2.5 p-8">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="display text-navy text-lg font-extrabold tracking-tight">
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
              className="text-muted hover:bg-bg-muted hover:text-ink rounded-lg px-3 py-2 text-sm font-semibold transition"
            >
              {label}
            </a>
          ))}
          <a
            href={GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:bg-bg-muted hover:text-ink rounded-lg px-3 py-2 text-sm font-semibold transition"
          >
            Guide
          </a>
        </nav>
        <Button
          href="/login"
          size="sm"
          className="border-navy text-navy hover:bg-bg-muted hover:border-red hover:text-red bg-transparent hover:scale-105"
        >
          Login
        </Button>
        <Button href="/track" size="sm">
          Track my PR
        </Button>
      </div>
    </header>
  );
}
