import {
  LandingCohorts,
  LandingCommunity,
  LandingCta,
  LandingFaq,
  LandingFooter,
  LandingHeader,
  LandingHero,
  LandingHowItWorks,
  LandingMilestones,
  LandingStrip,
  LandingTimelines,
} from "./sections";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-muted text-ink">
      <LandingHeader />
      <LandingHero />
      <LandingStrip />
      <LandingMilestones />
      <LandingCohorts />
      <LandingTimelines />
      <LandingCommunity />
      <LandingHowItWorks />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
