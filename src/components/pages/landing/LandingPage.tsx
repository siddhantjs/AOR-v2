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
    <div className="bg-bg-muted text-ink min-h-screen">
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
