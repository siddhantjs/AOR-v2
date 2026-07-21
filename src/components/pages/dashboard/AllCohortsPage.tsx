import Link from "next/link";
import type { AllCohortsPageData } from "@/lib/loadCohort";

type AllCohortsPageProps = {
  data: AllCohortsPageData;
};

export function AllCohortsPage({ data }: AllCohortsPageProps) {
  return (
    <div>
      <div className="text-xs font-bold tracking-[0.09em] text-[var(--red)] uppercase">
        Community
      </div>
      <h1 className="mt-1.5 mb-1 text-[28px] font-extrabold tracking-[-0.03em] text-[var(--navy)]">
        AOR cohorts
      </h1>
      <p className="m-0 max-w-[600px] text-sm text-[var(--muted)]">
        Applicants grouped by AOR month. Open a cohort to browse real journeys.
      </p>

      {!data.cards.length ? (
        <div className="mt-[22px] rounded-[var(--radius-lg)] border border-dashed border-[var(--border2)] bg-[var(--bg-elevated)] px-9 py-9 text-center">
          <h3 className="m-0 mb-1 text-[17px] font-extrabold text-[var(--navy)]">No cohorts yet</h3>
          <p className="m-0 mx-auto max-w-[440px] text-[13px] text-[var(--muted)]">
            Cohorts appear as applicants submit timelines.
          </p>
        </div>
      ) : (
        <div className="mt-[22px] grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-4">
          {data.cards.map((card) => (
            <Link
              key={card.cohortKey}
              href={`/dashboard/${data.userId}/cohort?c=${encodeURIComponent(card.cohortKey)}`}
              className={[
                "relative rounded-[var(--radius-lg)] border bg-[var(--bg-elevated)] p-5 text-left shadow-[var(--shadow-md)] transition-[var(--ease)] hover:-translate-y-0.5 hover:border-[var(--red)] hover:shadow-[var(--shadow-lg)]",
                card.isYours
                  ? "border-[var(--red)] shadow-[0_0_0_3px_rgba(200,40,30,0.08),var(--shadow-md)]"
                  : "border-[var(--border)]",
              ].join(" ")}
            >
              {card.isYours ? (
                <span className="absolute top-3.5 right-3.5 rounded-full bg-[var(--red)] px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-[0.08em] text-[var(--on-navy)]">
                  YOURS
                </span>
              ) : null}

              <div className="font-[family-name:var(--font-display)] text-[19px] font-extrabold tracking-[-0.02em] text-[var(--navy)]">
                {card.title}
              </div>
              <div className="mt-0.5 text-[12.5px] text-[var(--muted)]">
                <b className="text-[var(--ink)]">{card.total}</b>
                {` applicant${card.total !== 1 ? "s" : ""}${
                  card.isYours && card.total > 0 ? ", including you" : ""
                }`}
              </div>
              <span
                className="mt-3 inline-block rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                style={{ background: card.stageBg, color: card.stageFg }}
              >
                {card.stageLabel}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
