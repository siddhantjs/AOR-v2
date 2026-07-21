"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { CheckIcon } from "./landingShared";

const DEMO_ROWS = [
  { label: "Biometrics letter (BIL)", co: "86% of cohort" },
  { label: "Biometrics completed", co: "81% of cohort" },
  { label: "Medical passed", co: "74% of cohort" },
  { label: "Background check started", co: "63% of cohort" },
  { label: "Final decision", co: "18% of cohort" },
  { label: "eCOPR → PR card", co: "7% of cohort" },
] as const;

function HeroDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStep(DEMO_ROWS.length);
      return;
    }
    let s = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      s = (s + 1) % (DEMO_ROWS.length + 2);
      setStep(s);
      timer = setTimeout(tick, s === 0 ? 2600 : 1500);
    };
    timer = setTimeout(tick, 1500);
    return () => clearTimeout(timer);
  }, []);

  const pace = step < 3 ? "on pace" : step < 5 ? "ahead" : "almost there";

  return (
    <div
      className="landing-demo-shadow overflow-hidden rounded-2xl bg-bg-elevated text-ink"
      aria-hidden
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-bg-muted px-4 py-2.5">
        <i className="size-2.5 rounded-full bg-red-pale" />
        <i className="size-2.5 rounded-full bg-border2" />
        <i className="size-2.5 rounded-full bg-border2" />
        <span className="ml-2 text-xs text-muted2">aortrack.app</span>
      </div>
      <div className="px-5 py-4">
        <div className="mb-4 flex gap-1.5">
          <span className="rounded-lg border border-red-pale bg-red-pale px-3 py-1.5 text-xs font-bold text-red">
            My milestones
          </span>
          <span className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted2">
            My cohort · Mar 2026
          </span>
        </div>
        {DEMO_ROWS.map((row, i) => {
          const hit = i < step;
          const now = i === step;
          return (
            <div
              key={row.label}
              className={`flex items-center gap-2.5 border-b border-dashed border-border py-2 transition-opacity duration-500 last:border-0 ${
                hit || now ? "opacity-100" : "opacity-35"
              }`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  hit
                    ? "border-green bg-green"
                    : now
                      ? "animate-landing-spin-border border-dashed border-red bg-bg-elevated"
                      : "border-border2 bg-bg-elevated"
                }`}
              >
                <CheckIcon
                  className={`size-3 text-white ${hit ? "opacity-100" : "opacity-0"}`}
                />
              </span>
              <span className={`flex-1 text-xs font-semibold ${now ? "text-red" : ""}`}>
                {row.label}
              </span>
              <span className="text-xs text-muted2">{row.co}</span>
            </div>
          );
        })}
        <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-border bg-bg-muted px-3.5 py-2.5 text-xs text-muted">
          <span>
            You&apos;re <b className="font-semibold text-red">{pace}</b> with your AOR-month group
          </span>
          <span className="ml-auto flex gap-0.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <i
                key={i}
                className={`h-3.5 w-1 rounded-sm ${
                  i < 3 || (i === 3 && step >= 4) ? "bg-red" : "bg-border2"
                }`}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-navy3 text-white">
      <div aria-hidden className="landing-hero-glow" />
      <div className="wrap relative z-10 grid items-center gap-10 pt-14 pb-16 lg:grid-cols-2 lg:gap-12">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/80">
            <span className="size-1.5 animate-landing-dot-pulse rounded-full bg-green" />
            Free · every PR pathway · inland &amp; outland
          </span>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
            You&apos;re not waiting alone.{" "}
            <em className="text-red not-italic sm:italic">Track it together.</em>
          </h1>
          <p className="mt-5 mb-8 max-w-lg text-base leading-relaxed text-white/65">
            Tick off every IRCC milestone as it happens, get placed in your AOR-month cohort
            automatically, watch what statuses people around you are getting, and join thousands of
            applicants comparing notes on WhatsApp and Facebook.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/track" arrow>
              Track my PR — free
            </Button>
            <Button href="#cohorts" variant="ghost">
              See cohort groups
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-xs font-semibold text-white/55">
            {[
              "2-step setup, no signup",
              "We never ask for your GCKey",
              "Timelines are always anonymous",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckIcon className="size-4 text-green" />
                {t}
              </span>
            ))}
          </div>
        </div>
        <HeroDemo />
      </div>
    </section>
  );
}
