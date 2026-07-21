import { Button } from "@/components/ui";
import { GUIDE_URL, Kicker } from "./landingShared";

export function LandingCta() {
  return (
    <section className="bg-navy3 relative overflow-hidden py-20 text-white">
      <div aria-hidden className="landing-band-glow" />
      <div className="wrap relative z-10 text-center">
        <Kicker className="text-red">Free · 2 steps · your cohort is waiting</Kicker>
        <h2 className="mx-auto mt-2 mb-3.5 max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
          Somewhere out there is your cohort,{" "}
          <em className="text-red not-italic sm:italic">tracking without you.</em>
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-base text-white/65">
          Add your AOR date, tick your milestones, and turn the longest wait of your life into
          something you can actually see moving.
        </p>
        <Button href="/track" arrow>
          Track my PR - free
        </Button>
        <p className="mt-4 text-xs font-semibold text-white/45">
          New to the process? Read the{" "}
          <a href={GUIDE_URL} className="text-white/80" target="_blank" rel="noopener noreferrer">
            complete AOR-to-PR-card guide
          </a>{" "}
          first.
        </p>
      </div>
    </section>
  );
}
