"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { CheckList, Kicker } from "./landingShared";

const COHORT_BARS = [
  { label: "Biometrics letter", pct: 93 },
  { label: "Biometrics done", pct: 86 },
  { label: "Medical passed", pct: 79 },
  { label: "Background check", sub: "most files sit here now", pct: 63, hl: true },
  { label: "Eligibility passed", pct: 34 },
  { label: "Final decision", pct: 18 },
  { label: "eCOPR / landed", pct: 7 },
] as const;

function CohortBars() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-md"
      aria-hidden
    >
      <div className="flex items-center justify-between border-b border-border bg-bg-muted px-4 py-3">
        <b className="text-sm font-extrabold text-navy">March 2026 cohort · Inland</b>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-pale bg-red-pale px-2 py-0.5 text-xs text-red">
          ● YOU ARE HERE
        </span>
      </div>
      {COHORT_BARS.map((row) => (
        <div
          key={row.label}
          className="flex items-center gap-3 border-b border-dashed border-border px-4 py-2.5 text-xs last:border-0"
        >
          <div className="w-36 shrink-0 font-semibold">
            {row.label}
            {"sub" in row && row.sub ? (
              <small className="block text-xs font-medium text-muted2">{row.sub}</small>
            ) : null}
          </div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-muted">
            <i
              className={`block h-full rounded-full transition-all duration-1000 ease-out ${
                "hl" in row && row.hl ? "bg-red" : "bg-navy"
              }`}
              style={{ width: on ? `${row.pct}%` : "0%" }}
            />
          </div>
          <div className="w-11 shrink-0 text-right text-xs text-muted">{row.pct}%</div>
        </div>
      ))}
    </div>
  );
}

export function LandingCohorts() {
  return (
    <section className="border-y border-border bg-bg-elevated py-20" id="cohorts">
      <div className="wrap">
        <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-12">
          <CohortBars />
          <div>
            <Kicker>Cohort groups</Kicker>
            <h2 className="mt-2 mb-3.5 text-2xl font-extrabold text-navy sm:text-3xl">
              Your AOR month is your group.{" "}
              <em className="text-red not-italic sm:italic">See exactly what it&apos;s getting.</em>
            </h2>
            <p className="mb-3.5 text-sm text-muted">
              IRCC broadly works through files in intake order — so the only comparison that means
              anything is people who got AOR the same month as you, on the same stream. The moment you
              enter your AOR date, you&apos;re placed in that cohort automatically.
            </p>
            <CheckList
              items={[
                {
                  title: "Milestone reach rates",
                  body: "what % of your cohort has the BIL, has cleared medicals, has background checks running, has decisions. Updated as members log.",
                },
                {
                  title: "Your position, pinned",
                  body: "instantly see if you're ahead of, level with, or behind the pack — and by how many milestones.",
                },
                {
                  title: "Browse any month",
                  body: "peek at the cohorts ahead of you to preview what's coming, or behind you to see the queue building.",
                },
                {
                  title: "Inland vs outland, separated",
                  body: "because a Vancouver-processed inland file and a New Delhi outland file are different journeys.",
                },
              ]}
            />
            <Button href="/track" arrow>
              Join my cohort
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
