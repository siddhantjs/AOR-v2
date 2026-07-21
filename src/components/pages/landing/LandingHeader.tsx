"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { LuMenu, LuX } from "react-icons/lu";
import { LogoMark } from "@/components/common/LogoMark";
import { Button } from "@/components/ui";
import { GUIDE_URL } from "./landingShared";

const NAV_LINKS = [
  ["#milestones", "Milestones"],
  ["#cohorts", "Cohort groups"],
  ["#timelines", "Community timelines"],
  ["#community", "WhatsApp & Facebook"],
] as const;

export function LandingHeader() {
  const panelId = useId();
  const [menuOpen, setMenuOpen] = useState(false);

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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="border-border bg-bg-elevated sticky top-0 z-50 border-b">
      <div className="wrap flex h-16 items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="display text-navy text-lg font-extrabold tracking-tight">
            AOR<span className="text-red">Track</span>
          </span>
        </Link>
        <div className="flex-1" />
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Sections">
          {NAV_LINKS.map(([href, label]) => (
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
        <div className="hidden items-center gap-2 sm:flex">
          <Button
            href="/login"
            size="sm"
            className="border-navy text-navy hover:border-red hover:bg-bg-muted hover:text-red bg-transparent"
          >
            Login
          </Button>
          <Button href="/track" size="sm">
            Track my PR
          </Button>
        </div>
        <button
          type="button"
          className="text-navy hover:bg-bg-muted flex size-10 items-center justify-center rounded-lg transition lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls={panelId}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <LuX className="size-5" aria-hidden /> : <LuMenu className="size-5" aria-hidden />}
        </button>
      </div>

      <div
        className={[
          "fixed inset-0 z-60 lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close menu"
          className={[
            "absolute inset-0 bg-navy/40 transition-opacity duration-200",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={closeMenu}
        />

        <aside
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={[
            "bg-bg-elevated absolute top-0 right-0 flex h-full w-[min(300px,88vw)] flex-col shadow-lg transition-transform duration-300 ease-out",
            menuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="border-border flex h-16 items-center justify-between border-b px-4">
            <span className="display text-navy text-sm font-extrabold tracking-tight">Menu</span>
            <button
              type="button"
              className="text-navy hover:bg-bg-muted flex size-10 items-center justify-center rounded-lg transition"
              aria-label="Close menu"
              onClick={closeMenu}
            >
              <LuX className="size-5" aria-hidden />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Sections">
            {NAV_LINKS.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={closeMenu}
                className="text-ink hover:bg-bg-muted hover:text-navy rounded-lg px-3.5 py-3 text-sm font-semibold transition"
              >
                {label}
              </a>
            ))}
            <a
              href={GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="text-ink hover:bg-bg-muted hover:text-navy rounded-lg px-3.5 py-3 text-sm font-semibold transition"
            >
              Guide
            </a>
          </nav>

          <div className="border-border flex flex-col gap-2 border-t p-4 sm:hidden">
            <Button href="/login" size="sm" className="w-full" onClick={closeMenu}>
              Login
            </Button>
            <Button href="/track" size="sm" className="w-full" onClick={closeMenu}>
              Track my PR
            </Button>
          </div>
        </aside>
      </div>
    </header>
  );
}
