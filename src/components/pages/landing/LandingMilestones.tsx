import { Button } from "@/components/ui";
import { CheckIcon, CheckList, Kicker } from "./landingShared";

export function LandingMilestones() {
  return (
    <section className="py-20" id="milestones">
      <div className="wrap">
        <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-12">
          <div>
            <Kicker>Milestone tracking</Kicker>
            <h2 className="mt-2 mb-3.5 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              One tap per milestone.{" "}
              <em className="text-red not-italic sm:italic">Context on every single one.</em>
            </h2>
            <p className="mb-3.5 text-sm text-muted">
              Your IRCC account tells you a status changed. Our checklist tells you whether
              that&apos;s early, on time, or worth a follow-up. Every milestone carries a typical-day
              marker — the community median for files with your exact pathway and stream.
            </p>
            <CheckList
              items={[
                {
                  title: "13 milestones, every pathway",
                  body: "Express Entry (CEC, FSW, FST), PNP and spousal/family sponsorship, with the list adapting automatically (P1/P2 portal emails for inland, PPR for outland).",
                },
                {
                  title: "Typical-day markers",
                  body: '"background check typically starts ~day 62 for files like yours." Waiting stops feeling like guessing.',
                },
                {
                  title: "Background-check sub-stages",
                  body: "log criminality, security and information sharing from your own IRCC login. No other public dataset has this breakdown.",
                },
                {
                  title: "Smart date checks",
                  body: "the tracker flags dates before your AOR or in the future, so your timeline stays clean and your cohort data stays honest.",
                },
                {
                  title: '"Next up for you"',
                  body: "always know which milestone to watch for and roughly when it should land.",
                },
              ]}
            />
            <Button href="/track" arrow className="mt-2">
              Start my checklist
            </Button>
          </div>
          <div
            className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-md"
            aria-hidden
          >
            <div className="flex items-center justify-between border-b border-border bg-bg-muted px-4 py-3">
              <b className="text-sm font-extrabold text-navy">CEC · Inland · AOR Mar 14, 2026</b>
              <span className="text-xs text-muted2">Day 128</span>
            </div>
            {[
              { d: true, t: "Biometrics letter (BIL)", s: "Received Mar 29", typ: "day 15 · typ ~14" },
              {
                d: true,
                t: "Biometrics completed",
                s: "Done Apr 8 at Service Canada",
                typ: "day 25 · typ ~26",
              },
              { d: true, t: "Medical passed", s: '"Results received" May 12', typ: "day 59 · typ ~58" },
              {
                d: true,
                t: "Background check started",
                s: 'First "In progress" May 18',
                typ: "day 65 · typ ~62",
              },
              {
                d: false,
                t: "Criminality completed",
                tag: true,
                s: "Check your IRCC tracker login",
                typ: "community",
              },
              {
                d: false,
                t: "Eligibility passed",
                s: 'Shows "Recommended / Passed"',
                typ: "typ ~day 95",
              },
              {
                d: false,
                t: "Final decision",
                s: "Approved — then portal emails",
                typ: "typ ~day 125",
              },
            ].map((m) => (
              <div
                key={m.t}
                className="flex gap-3 border-b border-dashed border-border px-4 py-3 text-sm last:border-0"
              >
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    m.d ? "border-green bg-green" : "border-border2 bg-bg-elevated"
                  }`}
                >
                  <CheckIcon
                    className={`size-3 text-white ${m.d ? "opacity-100" : "opacity-0"}`}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="text-sm font-bold">
                    {m.t}
                    {m.tag ? (
                      <span className="ml-1.5 rounded bg-abg px-1.5 py-0.5 text-xs font-semibold text-amber">
                        SELF-REPORTED
                      </span>
                    ) : null}
                  </b>
                  <small className="mt-0.5 block text-xs text-muted2">{m.s}</small>
                </div>
                <span
                  className={`shrink-0 text-xs whitespace-nowrap ${m.d ? "text-green" : "text-muted2"}`}
                >
                  {m.typ}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
