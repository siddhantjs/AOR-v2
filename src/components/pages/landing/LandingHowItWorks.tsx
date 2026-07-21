import { Button } from "@/components/ui";
import { Kicker } from "./landingShared";

export function LandingHowItWorks() {
  return (
    <section className="py-20">
      <div className="wrap">
        <div className="mb-11 max-w-2xl">
          <Kicker>Getting started</Kicker>
          <h2 className="text-navy mt-2 mb-3 text-3xl font-extrabold sm:text-4xl">
            Two steps. About two minutes.
          </h2>
          <p className="text-muted text-base">
            No account, no GCKey, no application number. You check your status in your own IRCC
            account - this is where you make sense of it.
          </p>
        </div>
        <div className="grid max-w-4xl gap-5 md:grid-cols-2">
          <div className="border-border bg-bg-elevated rounded-xl border p-7 shadow-md">
            <span className="bg-red-pale text-red mb-3.5 inline-block rounded-lg px-2.5 py-1 text-xs font-semibold">
              Step 1
            </span>
            <h3 className="text-navy mb-2 text-base font-extrabold">Your application</h3>
            <p className="text-muted text-sm">
              Pick your pathway (CEC, FSW, FST, PNP or sponsorship), whether you&apos;re inland or
              outland, and your AOR date. That&apos;s enough to build your timeline and place you in
              your cohort.
            </p>
            <div
              className="border-border bg-bg-muted text-muted mt-4 rounded-xl border px-4 py-3 text-xs font-semibold"
              aria-hidden
            >
              {[
                "Pathway · CEC (Express Entry)",
                "Applying from inside Canada",
                "AOR · Mar 14, 2026 → March cohort",
              ].map((t) => (
                <div key={t} className="text-ink flex items-center gap-2 py-1">
                  <span className="border-green bg-green size-3.5 rounded-full border-2" />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="border-border bg-bg-elevated rounded-xl border p-7 shadow-md">
            <span className="bg-red-pale text-red mb-3.5 inline-block rounded-lg px-2.5 py-1 text-xs font-semibold">
              Step 2
            </span>
            <h3 className="text-navy mb-2 text-base font-extrabold">Your milestones</h3>
            <p className="text-muted text-sm">
              Tick milestones as they appear in your IRCC account. Your dashboard tracks days since
              AOR, journey progress, your expected decision window and what&apos;s next - while your
              cohort view updates live.
            </p>
            <div
              className="border-border bg-bg-muted text-muted mt-4 rounded-xl border px-4 py-3 text-xs font-semibold"
              aria-hidden
            >
              <div className="text-ink flex items-center gap-2 py-1">
                <span className="border-green bg-green size-3.5 rounded-full border-2" />
                Biometrics done · day 25
              </div>
              <div className="text-ink flex items-center gap-2 py-1">
                <span className="border-green bg-green size-3.5 rounded-full border-2" />
                Medical passed · day 59
              </div>
              <div className="flex items-center gap-2 py-1">
                <span className="border-border2 bg-bg-elevated size-3.5 rounded-full border-2" />
                Next up: background check · typ ~day 62
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <Button href="/track" arrow>
            Open the tracker
          </Button>
        </div>
      </div>
    </section>
  );
}
