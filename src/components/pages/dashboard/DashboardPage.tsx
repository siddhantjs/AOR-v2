"use client";

import { useState, type ReactNode } from "react";
import type { DashboardView } from "@/lib/dashboardView";

const CHECK = (
  <svg
    className="size-[11px] fill-none stroke-white stroke-[3] [stroke-linecap:round] [stroke-linejoin:round]"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

type DashboardPageProps = {
  data: DashboardView;
};

export function DashboardPage({ data }: DashboardPageProps) {
  const [copied, setCopied] = useState(false);

  function shareHref(): string {
    if (data.shareToken && typeof window !== "undefined") {
      return `${window.location.origin}/s/${data.shareToken}`;
    }
    return `https://${data.sharePath}`;
  }

  function copyLink() {
    void navigator.clipboard.writeText(shareHref()).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareWA() {
    const msg = `Following my Canadian PR journey on AORTrack: ${shareHref()}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="rounded-[18px] bg-[var(--navy)] p-1.5 text-[var(--on-navy)] shadow-[var(--shadow-md)]">
        <div className="grid grid-cols-1 overflow-hidden rounded-[14px] min-[821px]:grid-cols-3">
          <HeroCell
            label="Days since AOR"
            big={String(data.daysSinceAor)}
            sub={data.aorSub}
          />
          <HeroCell
            label="Typical wait in your group"
            big={
              data.typicalWaitDays != null ? (
                <>
                  {data.typicalWaitDays}
                  <small className="ml-1 text-[17px] font-bold text-[#aeb9c5]">
                    days
                  </small>
                </>
              ) : (
                "—"
              )
            }
            sub={data.typicalWaitSub}
            divider
          />
          <HeroCell
            label="Expected approval around"
            big={
              <span className="block pt-2 text-[clamp(1.1rem,2.4vw,1.85rem)] leading-tight text-[#ff8d80]">
                {data.expectedBig}
              </span>
            }
            sub={data.expectedSub}
            divider
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 min-[901px]:grid-cols-[1.55fr_1fr]">
        <div>
          {/* Timeline */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] px-[26px] py-[22px] shadow-[var(--shadow-md)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="m-0 text-base font-extrabold tracking-[-0.02em] text-[var(--navy)]">
                Your timeline
              </h2>
              <span className="inline-block rounded-[7px] bg-[var(--bbg)] px-2.5 py-0.5 text-[11.5px] font-semibold text-[var(--blue)]">
                {data.officeChip}
              </span>
            </div>

            <div className="mt-3.5">
              {data.timeline.map((row, i) => (
                <div
                  key={row.id}
                  className={[
                    "grid grid-cols-[26px_1fr_auto] items-center gap-3.5 border-t border-[var(--border)] py-[11px]",
                    i === 0 ? "border-t-0" : "",
                    row.sub ? "pl-[34px]" : "",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex size-[22px] items-center justify-center rounded-full border-[1.6px] bg-[var(--bg-elevated)]",
                      row.status === "done"
                        ? "border-[var(--green)] bg-[var(--green)]"
                        : "border-dashed border-[var(--muted2)]",
                    ].join(" ")}
                  >
                    {row.status === "done" ? CHECK : null}
                  </div>
                  <div
                    className={[
                      "text-[13.5px] font-semibold text-[var(--ink)]",
                      row.sub ? "text-[13px] font-medium text-[var(--muted)]" : "",
                    ].join(" ")}
                  >
                    {row.label}
                  </div>
                  <div className="text-right">
                    {row.status === "done" ? (
                      <>
                        <div className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--green)]">
                          {row.dateLabel}
                        </div>
                        <div className="text-[11px] text-[var(--muted2)]">
                          {row.agoDays} days ago
                        </div>
                      </>
                    ) : (
                      <span
                        className={[
                          "inline-block rounded-[7px] px-2.5 py-0.5 text-[11.5px] font-semibold",
                          row.status === "window"
                            ? "bg-[var(--abg)] text-[var(--amber)]"
                            : "bg-[var(--bbg)] text-[var(--blue)]",
                        ].join(" ")}
                      >
                        {row.chipLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Applicant details (read-only for now) */}
          <section className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] px-[26px] py-[22px] shadow-[var(--shadow-md)]">
            <h2 className="m-0 mb-1.5 text-base font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              Applicant details
            </h2>
            <div className="grid grid-cols-1 gap-x-[26px] min-[641px]:grid-cols-2">
              {data.details.map((d) => (
                <div
                  key={d.key}
                  className="flex min-h-[46px] items-center gap-2.5 border-b border-[var(--border)] py-[11px]"
                >
                  <span className="flex-1 text-[13px] text-[var(--muted)]">
                    {d.label}
                  </span>
                  <span
                    className={[
                      "text-right text-[13px] font-semibold",
                      d.value === "—"
                        ? "font-medium text-[var(--muted2)]"
                        : "text-[var(--ink)]",
                    ].join(" ")}
                  >
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div>
          {/* Share */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] px-[26px] py-[22px] shadow-[var(--shadow-md)]">
            <h2 className="m-0 text-base font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              Share my journey
            </h2>
            <p className="mt-0.5 mb-3.5 text-[12.5px] text-[var(--muted)]">
              Read only link. No personal data exposed.
            </p>
            <div className="mb-3 break-all rounded-[9px] border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
              {data.sharePath}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-[9px] border border-[var(--border2)] bg-[var(--bg-elevated)] px-[15px] py-2 text-[13px] font-semibold text-[var(--ink)] transition-[var(--ease)] hover:border-[var(--navy)]"
              >
                <svg
                  className="size-3.5 fill-none stroke-current stroke-[1.8]"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? "Copied" : "Copy link"}
              </button>
              <button
                type="button"
                onClick={shareWA}
                className="inline-flex items-center gap-2 rounded-[9px] border border-transparent bg-[#25d366] px-[15px] py-2 text-[13px] font-semibold text-white transition-[var(--ease)] hover:bg-[#1ebe57]"
              >
                WhatsApp
              </button>
            </div>
          </section>

          {/* Next up */}
          <section className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] px-[26px] py-[22px] shadow-[var(--shadow-md)]">
            <h2 className="m-0 text-base font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              Next up for you
            </h2>
            {data.nextUp ? (
              <>
                <p className="mt-0.5 mb-3.5 text-[12.5px] text-[var(--muted)]">
                  Based on your profile estimates so far.
                </p>
                <div className="rounded-xl border border-[var(--border)] px-4 py-[15px]">
                  <div className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[var(--navy)]">
                    {data.nextUp.label}
                  </div>
                  <div className="mt-1.5">
                    <span
                      className={[
                        "inline-block rounded-[7px] px-2.5 py-0.5 text-[11.5px] font-semibold",
                        data.nextUp.kind === "window"
                          ? "bg-[var(--abg)] text-[var(--amber)]"
                          : "bg-[var(--red-pale)] text-[var(--red)]",
                      ].join(" ")}
                    >
                      {data.nextUp.kind === "estimate"
                        ? `Est. ${data.nextUp.chipLabel}`
                        : data.nextUp.chipLabel}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-3.5 rounded-xl border border-[var(--border)] px-4 py-[15px] font-semibold text-[var(--green)]">
                Journey complete. Enjoy Canada.
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="mt-6 flex max-w-[740px] gap-2 text-xs text-[var(--muted2)]">
        <svg
          className="mt-0.5 size-4 shrink-0 fill-none stroke-current stroke-[1.6]"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>{data.footnote}</span>
      </div>
    </div>
  );
}

function HeroCell({
  label,
  big,
  sub,
  divider = false,
}: {
  label: string;
  big: ReactNode;
  sub: string;
  divider?: boolean;
}) {
  return (
    <div
      className={[
        "relative px-7 py-6",
        divider
          ? "before:absolute before:inset-x-[8%] before:top-0 before:h-px before:bg-white/12 min-[821px]:before:inset-y-[22%] min-[821px]:before:left-0 min-[821px]:before:right-auto min-[821px]:before:h-auto min-[821px]:before:w-px"
          : "",
      ].join(" ")}
    >
      <div className="text-[11px] font-bold tracking-[0.1em] text-[#8b99a8] uppercase">
        {label}
      </div>
      <div className="mt-1 font-[family-name:var(--font-display)] text-[44px] leading-[1.1] font-extrabold tracking-[-0.03em]">
        {big}
      </div>
      <div className="mt-1 text-xs text-[#8b99a8]">{sub}</div>
    </div>
  );
}
