"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  applicantTimelineRows,
  cohortFilterOptions,
  type CohortApplicantView,
} from "@/lib/cohortBrowse";
import type { CohortPageData } from "@/lib/loadCohort";
import type { MilestoneId } from "@/lib/schema/constants";

type CohortPageProps = {
  data: CohortPageData;
};

type FilterValue = "all" | MilestoneId;

export function CohortPage({ data }: CohortPageProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const filters = useMemo(() => cohortFilterOptions(), []);

  const rows = useMemo(() => {
    if (filter === "all") return data.applicants;
    return data.applicants.filter((a) => Boolean(a.loggedMs[filter]));
  }, [data.applicants, filter]);

  const selected = rows.find((a) => a.id === openId) ?? null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function onCohortChange(key: string) {
    const q = encodeURIComponent(key);
    router.push(`/dashboard/${data.userId}/cohort?c=${q}`);
  }

  const onlyYou = data.isYours && data.applicants.length === 1 && data.applicants[0]?.isYou;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold tracking-[0.09em] text-[var(--red)] uppercase">
            {data.eyebrow}
          </div>
          <h1 className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[var(--navy)]">
            {data.title}
          </h1>
          <div className="text-[13px] text-[var(--muted)]">{data.countLabel}</div>
        </div>
        <select
          className="rounded-[10px] border border-[var(--border2)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-[13.5px] font-semibold text-[var(--navy)] outline-none"
          value={data.activeCohortKey}
          onChange={(e) => onCohortChange(e.target.value)}
          aria-label="Choose cohort"
        >
          {data.options.map((o) => (
            <option key={o.cohortKey} value={o.cohortKey}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-[var(--ease)]",
              filter === f.value
                ? "border-[var(--navy)] bg-[var(--navy)] text-[var(--on-navy)]"
                : "border-[var(--border2)] bg-[var(--bg-elevated)] text-[var(--muted)] hover:border-[var(--muted2)] hover:text-[var(--ink)]",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {onlyYou ? (
        <div className="mb-3.5 rounded-[var(--radius-lg)] border border-dashed border-[var(--border2)] bg-[var(--bg-elevated)] px-9 py-9 text-center">
          <h3 className="m-0 mb-1 text-[17px] font-extrabold text-[var(--navy)]">
            You are the first one here
          </h3>
          <p className="m-0 mx-auto max-w-[440px] text-[13px] text-[var(--muted)]">
            You are the pioneer of this cohort. Your estimates still hold, and this page fills up as
            others join.
          </p>
        </div>
      ) : null}

      {!rows.length ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border2)] bg-[var(--bg-elevated)] px-9 py-9 text-center">
          <h3 className="m-0 mb-1 text-[17px] font-extrabold text-[var(--navy)]">
            No journeys here yet
          </h3>
          <p className="m-0 mx-auto max-w-[440px] text-[13px] text-[var(--muted)]">
            This cohort is waiting for its first applicant.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]">
          {rows.map((a) => (
            <ApplicantRow key={a.id} applicant={a} onOpen={() => setOpenId(a.id)} />
          ))}
        </div>
      )}

      {selected ? <ApplicantDrawer applicant={selected} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}

function ApplicantRow({
  applicant: a,
  onOpen,
}: {
  applicant: CohortApplicantView;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "grid w-full grid-cols-[40px_1fr_22px] items-center gap-3.5 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-3.5 text-left transition-[var(--ease)] first:border-t-0 hover:bg-[var(--bg-muted)] min-[701px]:grid-cols-[40px_1.4fr_1fr_auto_22px]",
        a.isYou ? "bg-[var(--red-pale)]" : "",
      ].join(" ")}
    >
      <span
        className="flex size-[38px] items-center justify-center rounded-full font-[family-name:var(--font-display)] text-[13px] font-bold text-white"
        style={{ background: a.avatarBg }}
      >
        {a.initials}
      </span>
      <span>
        <span className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--ink)]">
          {a.handle}
        </span>
        <br />
        <span className="text-xs text-[var(--muted)]">
          {a.progLabel} · {a.catShort} · {a.streamLabel}
        </span>
      </span>
      <span
        className="hidden justify-self-start rounded-full px-2.5 py-1 text-[11.5px] font-semibold min-[701px]:inline-block"
        style={{ background: a.stageBg, color: a.stageFg }}
      >
        {a.stageLabel}
      </span>
      <span className="hidden font-[family-name:var(--font-mono)] text-[11.5px] whitespace-nowrap text-[var(--muted2)] min-[701px]:inline">
        AOR {a.aorLabel}
      </span>
      <svg
        className="size-4 justify-self-end fill-none stroke-[var(--muted2)] stroke-[1.8]"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

function ApplicantDrawer({
  applicant: a,
  onClose,
}: {
  applicant: CohortApplicantView;
  onClose: () => void;
}) {
  const timeline = applicantTimelineRows(a);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] bg-[rgba(22,32,43,0.38)]"
        aria-label="Close details"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 bottom-0 z-[95] flex w-[440px] max-w-[94vw] flex-col bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]"
        aria-label="Applicant details"
      >
        <div className="flex items-center gap-3.5 border-b border-[var(--border)] px-6 py-5">
          <span
            className="flex size-[46px] items-center justify-center rounded-full font-[family-name:var(--font-display)] text-[15px] font-bold text-white"
            style={{ background: a.avatarBg }}
          >
            {a.initials}
          </span>
          <div>
            <div className="font-[family-name:var(--font-display)] text-[17px] font-extrabold text-[var(--navy)]">
              {a.handle}
            </div>
            <div className="text-[12.5px] text-[var(--muted)]">
              {a.progLabel} · {a.catShort} · {a.streamLabel}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex size-[34px] items-center justify-center rounded-full border border-[var(--border2)] text-[var(--muted)] hover:border-[var(--navy)] hover:text-[var(--navy)]"
            aria-label="Close"
          >
            <svg
              className="size-4 fill-none stroke-current stroke-[1.8]"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h4 className="mt-0 mb-2 text-xs font-bold tracking-[0.09em] text-[var(--muted2)] uppercase">
            Timeline
          </h4>
          <div className="relative py-1 pl-[22px] before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:rounded before:bg-[var(--border)]">
            {timeline.map((r) => (
              <div
                key={`${r.label}-${r.dateLabel}`}
                className={[
                  "relative flex items-baseline justify-between gap-3 py-2 before:absolute before:top-3.5 before:-left-[19px] before:size-2 before:rounded-full",
                  r.pending
                    ? "before:bg-[var(--bg-elevated)] before:outline before:outline-2 before:outline-[var(--border2)]"
                    : "before:bg-[var(--green)] before:outline before:outline-3 before:outline-[var(--gbg)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-[13px] font-semibold",
                    r.pending ? "font-medium text-[var(--muted2)]" : "text-[var(--ink)]",
                  ].join(" ")}
                >
                  {r.label}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[11.5px] whitespace-nowrap text-[var(--muted)]">
                  {r.pending ? (
                    r.dateLabel
                  ) : (
                    <>
                      <b className="text-[var(--ink)]">{r.dateLabel}</b>
                      {` · ${r.agoDays}d ago`}
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>

          <h4 className="mt-5 mb-2 text-xs font-bold tracking-[0.09em] text-[var(--muted2)] uppercase">
            Applicant details
          </h4>
          {a.details.map((d) => (
            <div
              key={d.label}
              className="flex min-h-[42px] items-center gap-2.5 border-b border-[var(--border)] py-2.5"
            >
              <span className="flex-1 text-[13px] text-[var(--muted)]">{d.label}</span>
              <span className="text-right text-[13px] font-semibold text-[var(--ink)]">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
