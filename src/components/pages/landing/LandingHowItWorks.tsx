import { Button } from "@/components/ui";
import { Kicker } from "./landingShared";

export function LandingHowItWorks() {
  return (
    <section className="py-20">
      <div className="wrap">
        <div className="mb-11 max-w-2xl">
          <Kicker>Getting started</Kicker>
          <h2 className="mt-2 mb-3 text-3xl font-extrabold text-navy sm:text-4xl">
            Two steps. About two minutes.
          </h2>
          <p className="text-base text-muted">
            No account, no GCKey, no application number. You check your status in your own IRCC
            account — this is where you make sense of it.
          </p>
        </div>
        <div className="grid max-w-4xl gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-7 shadow-md">
            <span className="mb-3.5 inline-block rounded-lg bg-red-pale px-2.5 py-1 text-xs font-semibold text-red">
              Step 1
            </span>
            <h3 className="mb-2 text-base font-extrabold text-navy">Your application</h3>
            <p className="text-sm text-muted">
              Pick your pathway (CEC, FSW, FST, PNP or sponsorship), whether you&apos;re inland or
              outland, and your AOR date. That&apos;s enough to build your timeline and place you in
              your cohort.
            </p>
            <div
              className="mt-4 rounded-xl border border-border bg-bg-muted px-4 py-3 text-xs font-semibold text-muted"
              aria-hidden
            >
              {[
                "Pathway · CEC (Express Entry)",
                "Applying from inside Canada",
                "AOR · Mar 14, 2026 → March cohort",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 py-1 text-ink">
                  <span className="size-3.5 rounded-full border-2 border-green bg-green" />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-7 shadow-md">
            <span className="mb-3.5 inline-block rounded-lg bg-red-pale px-2.5 py-1 text-xs font-semibold text-red">
              Step 2
            </span>
            <h3 className="mb-2 text-base font-extrabold text-navy">Your milestones</h3>
            <p className="text-sm text-muted">
              Tick milestones as they appear in your IRCC account. Your dashboard tracks days since
              AOR, journey progress, your expected decision window and what&apos;s next — while your
              cohort view updates live.
            </p>
            <div
              className="mt-4 rounded-xl border border-border bg-bg-muted px-4 py-3 text-xs font-semibold text-muted"
              aria-hidden
            >
              <div className="flex items-center gap-2 py-1 text-ink">
                <span className="size-3.5 rounded-full border-2 border-green bg-green" />
                Biometrics done · day 25
              </div>
              <div className="flex items-center gap-2 py-1 text-ink">
                <span className="size-3.5 rounded-full border-2 border-green bg-green" />
                Medical passed · day 59
              </div>
              <div className="flex items-center gap-2 py-1">
                <span className="size-3.5 rounded-full border-2 border-border2 bg-bg-elevated" />
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
