import { Button } from "@/components/ui";
import { CheckList, Kicker } from "./landingShared";

const FEED_ITEMS = [
  {
    av: "RS",
    who: "northern_ray",
    meta: "CEC · Inland · AOR Mar 2026",
    badge: "b" as const,
    text: "BGC STARTED · D64",
    dots: 5,
  },
  {
    av: "AK",
    who: "aki_toronto",
    meta: "FSW · Outland · AOR Jan 2026",
    badge: "a" as const,
    text: "ELIGIBILITY · D148",
    dots: 8,
  },
  {
    av: "MP",
    who: "maple_bound",
    meta: "PNP-EE · Inland · AOR Feb 2026",
    badge: "g" as const,
    text: "P1 RECEIVED · D122",
    dots: 9,
  },
  {
    av: "JD",
    who: "jd_van",
    meta: "CEC · Inland · AOR Mar 2026",
    badge: "b" as const,
    text: "MEDICAL PASSED · D57",
    dots: 4,
  },
  {
    av: "SN",
    who: "sunrise_nov",
    meta: "Spousal · Inland · AOR Nov 2025",
    badge: "a" as const,
    text: "BGC IN PROGRESS · D231",
    dots: 5,
  },
  {
    av: "LH",
    who: "lh_calgary",
    meta: "FSW · Outland · AOR Dec 2025",
    badge: "g" as const,
    text: "PPR!! · D171",
    dots: 10,
  },
  {
    av: "PT",
    who: "prairie_t",
    meta: "CEC · Inland · AOR Feb 2026",
    badge: "g" as const,
    text: "eCOPR · D156",
    dots: 11,
  },
  {
    av: "NB",
    who: "nb_dreams",
    meta: "PNP paper · Outland · AOR Aug 2025",
    badge: "b" as const,
    text: "BIOMETRICS · D68",
    dots: 2,
  },
];

function TimelineCard({ item }: { item: (typeof FEED_ITEMS)[number] }) {
  const badgeClass =
    item.badge === "g"
      ? "bg-gbg text-green"
      : item.badge === "b"
        ? "bg-bbg text-blue"
        : "bg-abg text-amber";
  const total = 12;

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-4 shadow-md">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-extrabold text-white">
          {item.av}
        </span>
        <span className="min-w-0">
          <b className="block text-xs font-extrabold text-navy">{item.who}</b>
          <small className="text-xs text-muted2">{item.meta}</small>
        </span>
        <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
          {item.text}
        </span>
      </div>
      <div className="flex items-center">
        {Array.from({ length: total }, (_, i) => {
          const on = i < item.dots;
          const hot = i === item.dots - 1;
          return (
            <span key={i} className="flex flex-1 items-center last:flex-none">
              <i
                className={`size-3 shrink-0 rounded-full border-2 ${
                  on
                    ? hot
                      ? "animate-landing-dot-pulse border-red bg-red"
                      : "border-green bg-gbg"
                    : "border-border2 bg-bg-elevated"
                }`}
              />
              {i < total - 1 ? (
                <s
                  className={`h-px flex-1 no-underline ${
                    i < item.dots - 1 ? "bg-green" : "bg-border2"
                  }`}
                />
              ) : null}
            </span>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted2">
        <span>AOR</span>
        <span>PR CARD</span>
      </div>
    </div>
  );
}

function TimelineFeed() {
  const items = [...FEED_ITEMS, ...FEED_ITEMS];
  return (
    <div className="relative h-96 overflow-hidden rounded-2xl" aria-hidden>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-bg-muted to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-bg-muted to-transparent" />
      <div className="flex animate-landing-feed flex-col gap-3 motion-reduce:animate-none">
        {items.map((item, i) => (
          <TimelineCard key={`${item.who}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export function LandingTimelines() {
  return (
    <section className="py-20" id="timelines">
      <div className="wrap">
        <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-12">
          <div>
            <Kicker>Community timelines</Kicker>
            <h2 className="mt-2 mb-3.5 text-2xl font-extrabold text-navy sm:text-3xl">
              Real applicants, real timelines —{" "}
              <em className="text-red not-italic sm:italic">anonymous, always.</em>
            </h2>
            <p className="mb-3.5 text-sm text-muted">
              Every person who tracks their PR with GetNorthPath adds one more anonymous timeline to
              the community. Scroll the live feed to see who just got a PPR, whose background check
              just started, and how long each stage really took for files like yours.
            </p>
            <CheckList
              items={[
                {
                  title: "Filter by what matters",
                  body: "pathway, AOR month, inland/outland, country. Find the timelines that look like yours.",
                },
                {
                  title: "Milestone-by-milestone dots",
                  body: "see at a glance which stage each file is at and on which day it got there.",
                },
                {
                  title: "Anonymous by design",
                  body: "display handles only. No names, no emails, no UCI or application numbers, ever.",
                },
                {
                  title: "Your timeline gives back",
                  body: "the milestones you log make the medians sharper for the next applicant. That's the whole idea.",
                },
              ]}
            />
            <Button href="/track" arrow>
              Add my timeline
            </Button>
          </div>
          <TimelineFeed />
        </div>
      </div>
    </section>
  );
}
