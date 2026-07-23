"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight, LuCheck, LuPlus, LuRefreshCw } from "react-icons/lu";
import { LogoMark } from "@/components/common/LogoMark";
import { Button } from "@/components/ui";
import { daysSince, formatShortDate } from "@/lib/dates";
import type { ShareJourneyView, ShareMilestone } from "@/lib/api.types";

type ShareJourneyPageProps = {
  data: ShareJourneyView;
};

function ProgressBar({ pct }: { pct: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setWidth(pct);
      return;
    }
    const t = window.setTimeout(() => setWidth(pct), 140);
    return () => window.clearTimeout(t);
  }, [pct]);

  return (
    <div className="mt-3.5 h-[7px] overflow-hidden rounded-full bg-[var(--bg-muted)]">
      <i
        className="block h-full rounded-full bg-gradient-to-r from-[var(--red)] to-[#e8604f] transition-[width] duration-[1100ms] ease-[cubic-bezier(0.2,0.7,0.3,1)]"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function MilestoneRight({ m }: { m: ShareMilestone }) {
  if (m.status === "done") {
    return (
      <>
        <div className="font-[family-name:var(--font-mono)] text-[12.5px] font-semibold whitespace-nowrap text-[var(--navy)]">
          {m.date ? formatShortDate(m.date) : "—"}
        </div>
        <div className="mt-px font-[family-name:var(--font-mono)] font-bold text-[10.5px] whitespace-nowrap text-[var(--green)]">
          Day {m.day ?? 0}
        </div>
      </>
    );
  }

  if (m.status === "now") {
    return (
      <div className="max-w-[160px] text-right font-[family-name:var(--font-mono)] text-[11.5px] leading-snug font-semibold text-[var(--amber)]">
        {m.estimateLabel ?? "In progress"}
      </div>
    );
  }

  return (
    <div className="max-w-[160px] text-right font-[family-name:var(--font-mono)] text-[11.5px] leading-snug font-semibold text-[var(--blue)]">
      {m.estimateLabel ? `Est. ${m.estimateLabel}` : "—"}
    </div>
  );
}

function MilestoneIcon({ status }: { status: ShareMilestone["status"] }) {
  if (status === "done") {
    return <LuCheck className="size-[11px] text-[var(--green)]" strokeWidth={3} aria-hidden />;
  }
  if (status === "now") {
    return <LuRefreshCw className="size-[11px] text-[var(--red)]" strokeWidth={2.5} aria-hidden />;
  }
  return <LuPlus className="size-[11px] text-[var(--muted2)]" strokeWidth={2.5} aria-hidden />;
}

export function ShareJourneyPage({ data }: ShareJourneyPageProps) {
  const days = daysSince(data.aor);
  const total = data.milestones.length;
  const done = data.milestones.filter((m) => m.status === "done").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const next = data.milestones.find((m) => m.status !== "done");
  const ecopr = data.milestones.find((m) => /eCOPR/i.test(m.label));
  const nextLabel = next ? next.label.replace(" received", "") : "Complete";
  const ecoprLabel = ecopr?.estimateLabel
    ? ecopr.estimateLabel
    : ecopr?.date
      ? formatShortDate(ecopr.date)
      : "—";
  const firstEstIndex = data.milestones.findIndex((m) => m.status === "est");

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 bg-[var(--navy3)] text-white">
        <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <LogoMark />
            <span className="font-[family-name:var(--font-display)] text-[15.5px] font-extrabold text-white">
              AOR<span className="text-[var(--red)]">Track</span>
            </span>
          </Link>
          <span className="hidden border-l border-white/15 pl-3 font-[family-name:var(--font-mono)] text-[11px] text-[#8d99a5] sm:inline">
            Shared view · #{data.publicId}
          </span>
          <span className="flex-1" />
          <span className="hidden items-center gap-1.5 rounded-full border border-[rgba(31,157,97,0.3)] bg-[rgba(31,157,97,0.14)] px-3 py-1 text-[11.5px] font-semibold text-[#8fe0b4] sm:inline-flex">
            <i className="size-1.5 rounded-full bg-[var(--green)]" />
            Read-only
          </span>
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 rounded-[9px] bg-[var(--red)] px-3.5 py-2 font-[family-name:var(--font-display)] text-[13px] font-bold whitespace-nowrap text-white no-underline hover:bg-[var(--red2)]"
          >
            Track my PR <LuArrowRight className="size-[15px] shrink-0" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1080px] px-5 pt-[26px] pb-[60px]">
        <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]">
          <div className="grid grid-cols-1 min-[821px]:grid-cols-[296px_1fr]">
            <aside className="border-b border-[var(--border)] bg-[#fcfcfd] px-6 py-[26px] min-[821px]:border-r min-[821px]:border-b-0">
              <div className="relative overflow-hidden rounded-[14px] bg-[var(--navy3)] px-[18px] pt-[18px] pb-4 text-white">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-[60px] -right-[60px] size-[180px] rounded-full bg-[radial-gradient(circle,rgba(214,52,36,0.24),transparent_68%)]"
                />
                <div className="relative z-1 font-[family-name:var(--font-mono)] text-[10.5px] text-[#8d99a5]">
                  Applicant #{data.publicId}
                </div>
                <h1 className="relative z-1 mt-1 font-[family-name:var(--font-display)] text-[23px] font-extrabold tracking-[-0.03em] text-white">
                  {data.pathway}
                </h1>
                <div className="relative z-1 mt-1.5 text-xs font-semibold text-[#aab4be]">
                  {data.stream}
                </div>
                <div className="relative z-1 mt-4 flex items-baseline justify-between border-t border-white/12 pt-3.5">
                  <span className="font-[family-name:var(--font-mono)] text-[10.5px] text-[#8d99a5]">
                    AOR DATE
                  </span>
                  <b className="font-[family-name:var(--font-mono)] text-[13px] font-semibold text-white">
                    {formatShortDate(data.aor)}
                  </b>
                </div>
              </div>

              <div className="mt-[18px] rounded-[13px] border border-[var(--border)] bg-white px-[18px] py-4">
                <div className="font-[family-name:var(--font-display)] text-[32px] leading-none font-extrabold tracking-[-0.04em] text-[var(--navy)]">
                  {days}
                  <em className="not-italic text-[var(--red)]">d</em>
                </div>
                <div className="mt-0.5 text-[11.5px] font-semibold text-[var(--muted)]">
                  since AOR
                </div>
                <ProgressBar pct={pct} />
                <div className="mt-1.5 flex justify-between font-[family-name:var(--font-mono)] text-[9.5px] font-semibold text-[var(--muted2)]">
                  <span>
                    {done} of {total} done
                  </span>
                  <span>{pct}%</span>
                </div>
              </div>

              <div className="mt-4">
                {(
                  [
                    ["Milestones done", String(done)],
                    ["Next up", nextLabel],
                    ["Est. eCOPR", ecoprLabel],
                    ["Updated", formatShortDate(data.updated)],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-2.5 border-b border-dashed border-[var(--border)] py-2.5 text-[12.5px] last:border-0"
                  >
                    <span className="font-semibold text-[var(--muted)]">{label}</span>
                    <b className="max-w-[55%] text-right font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--navy)]">
                      {value}
                    </b>
                  </div>
                ))}
              </div>

              <div className="mt-3.5 rounded-[11px] border border-[#f6cdc8] bg-gradient-to-b from-white to-[#fffafa] px-3.5 py-3">
                <b className="block font-[family-name:var(--font-display)] text-[12.5px] font-extrabold text-[var(--navy)]">
                  {data.cohortLabel}
                </b>
                <small className="text-[11px] text-[var(--muted2)]">
                  {data.cohortN} tracked applicants
                </small>
              </div>
            </aside>

            <div className="px-[18px] py-[22px] sm:px-7 sm:py-[26px]">
              <h2 className="m-0 font-[family-name:var(--font-display)] text-[17px] font-extrabold text-[var(--navy)]">
                Milestone timeline
              </h2>
              <p className="mt-1 mb-5 max-w-[560px] text-[12.5px] text-[var(--muted)]">
                Read-only snapshot. Logged dates are what this applicant saved. Pending windows use
                the same estimate format as AORTrack.
              </p>

              <div>
                {data.milestones.map((m, i) => {
                  const showDivider = i === firstEstIndex && firstEstIndex >= 0;

                  return (
                    <div key={`${m.label}-${i}`}>
                      {showDivider ? (
                        <div className="flex items-center gap-3 py-4 pt-4 pb-2">
                          <span className="font-[family-name:var(--font-mono)] text-[9.5px] font-semibold tracking-[0.09em] text-[var(--muted2)] uppercase whitespace-nowrap">
                            Estimated ahead
                          </span>
                          <i className="h-px flex-1 bg-[var(--border)]" />
                        </div>
                      ) : null}
                      <div
                        className={[
                          "relative flex gap-3.5 py-3.5",
                          "before:absolute before:top-0 before:bottom-0 before:left-[11px] before:w-0.5",
                          m.status === "done"
                            ? "before:bg-[var(--gbg)]"
                            : "before:bg-[var(--border2)]",
                          i === 0 ? "before:top-6" : "",
                          i === data.milestones.length - 1 ? "before:bottom-[calc(100%-24px)]" : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "relative z-1 mt-px flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-white",
                            m.status === "done"
                              ? "border-[var(--green)] bg-[var(--gbg)]"
                              : m.status === "now"
                                ? "animate-landing-spin-border border-dashed border-[var(--red)] bg-[var(--red-pale)] motion-reduce:animate-none"
                                : "border-[var(--border2)]",
                          ].join(" ")}
                        >
                          <MilestoneIcon status={m.status} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <b
                            className={[
                              "block font-[family-name:var(--font-display)] text-sm",
                              m.status === "done"
                                ? "font-bold text-[var(--navy)]"
                                : m.status === "now"
                                  ? "font-bold text-[var(--red)]"
                                  : "font-semibold text-[var(--muted)]",
                            ].join(" ")}
                          >
                            {m.label}
                          </b>
                          {m.status === "now" ? (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-[var(--abg)] bg-[var(--abg)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[9.5px] font-semibold text-[var(--amber)]">
                              <LuRefreshCw
                                className="size-2.5 shrink-0"
                                strokeWidth={2.6}
                                aria-hidden
                              />
                              In progress, applicant to confirm
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 pl-2 text-right">
                          <MilestoneRight m={m} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-[22px] max-w-[520px] text-center text-xs leading-relaxed text-[var(--muted2)]">
          Timing windows are guidance based on this profile, not IRCC guarantees. This link does not
          expose email, UCI, or application numbers.
        </p>

        <div className="mt-[22px] flex flex-wrap justify-center gap-3">
          <Button href="/track" arrow>
            Start tracking
          </Button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-[11px] border border-[var(--border2)] bg-white px-[26px] py-3 font-[family-name:var(--font-display)] text-sm font-bold text-[var(--ink)] no-underline hover:border-[var(--muted2)]"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
