import type { ReactNode } from "react";
import { GUIDE_URL, Kicker } from "./landingShared";

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "What exactly is a cohort group?",
    a: "Everyone who received AOR in the same month, on the same stream (inland or outland). Because IRCC broadly processes files in intake order, your AOR-month cohort is the most meaningful comparison group there is. Enter your AOR date and you're in - no joining step.",
  },
  {
    q: "Can I see other people's timelines?",
    a: "Yes - every tracked application becomes an anonymous community timeline showing pathway, AOR month, and milestone days. Filter to your cohort to see exactly what statuses people around your AOR date are getting. Names, emails and application numbers are never shown.",
  },
  {
    q: "Do I have to join WhatsApp or Facebook to use the tracker?",
    a: "No - the tracker is fully functional on its own. The communities are optional and free; most people join once their file hits the background-check stage and the questions start piling up.",
  },
  {
    q: "Does this connect to my IRCC account?",
    a: (
      <>
        No, and be cautious of any tool that claims to. You check your status in your IRCC account or
        the{" "}
        <a
          href="https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-status.html"
          rel="noopener noreferrer"
          target="_blank"
          className="font-semibold text-red"
        >
          official status tracker on canada.ca
        </a>
        , then log it here. We never ask for your GCKey, UCI or application number.
      </>
    ),
  },
  {
    q: 'Where do the "typical day" numbers come from?',
    a: (
      <>
        Community medians from tracked timelines with your pathway and stream. They&apos;re reference
        points, not IRCC promises - official standards (like the 6-month Express Entry standard) live
        on canada.ca, and our{" "}
        <a
          href={GUIDE_URL}
          className="font-semibold text-red"
          rel="noopener noreferrer"
          target="_blank"
        >
          PR tracking guide
        </a>{" "}
        explains every stage in depth.
      </>
    ),
  },
  {
    q: "Is it really free?",
    a: (
      <>
        Yes - free forever, no card, no signup to start. It&apos;s a community tool from GetNorthPath.
        If you&apos;re still <em>before</em> AOR, our{" "}
        <a
          href="https://www.getnorthpath.com/pathways"
          className="font-semibold text-red"
          rel="noopener noreferrer"
          target="_blank"
        >
          $299 CAD flat-fee service
        </a>{" "}
        handles the application itself with AI-validated documents and licensed-consultant review.
      </>
    ),
  },
];

export function LandingFaq() {
  return (
    <section className="border-y border-border bg-bg-elevated py-20" id="faq">
      <div className="wrap">
        <div className="mb-11 max-w-2xl">
          <Kicker>Common questions</Kicker>
          <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">Before you start</h2>
        </div>
        <div className="max-w-3xl">
          {FAQ.map((item, i) => (
            <details
              key={item.q}
              open={i === 0}
              className="group mb-2.5 rounded-xl border border-border bg-bg-elevated"
            >
              <summary className="display flex cursor-pointer list-none items-center justify-between gap-3.5 px-5 py-4 text-sm font-bold text-navy">
                {item.q}
                <span className="shrink-0 text-xl text-red transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
