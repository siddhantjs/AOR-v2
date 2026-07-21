import Link from "next/link";
import { LogoMark } from "@/components/common/LogoMark";
import { DISCORD_URL, FACEBOOK_URL, GUIDE_URL, WHATSAPP_URL } from "./landingShared";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy3 px-0 pt-11 pb-8 text-sm text-white/55">
      <div className="wrap">
        <div className="mb-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <LogoMark />
              <span className="display text-base font-extrabold text-white">
                AOR<span className="text-red">Track</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-xs">
              The free community tracker from GetNorthPath — precision immigration for the modern age.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-xs tracking-wider text-white/80 uppercase">Tracker</h4>
            <Link href="/track" className="block py-1 hover:text-white">
              Track my PR
            </Link>
            <a href="#milestones" className="block py-1 hover:text-white">
              Milestone tracking
            </a>
            <a href="#cohorts" className="block py-1 hover:text-white">
              Cohort groups
            </a>
            <a href="#timelines" className="block py-1 hover:text-white">
              Community timelines
            </a>
          </div>
          <div>
            <h4 className="mb-3 text-xs tracking-wider text-white/80 uppercase">Community</h4>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 hover:text-white"
            >
              WhatsApp groups
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 hover:text-white"
            >
              Facebook community
            </a>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 hover:text-white"
            >
              Discord
            </a>
            <a
              href={GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 hover:text-white"
            >
              PR tracking guide
            </a>
          </div>
          <div>
            <h4 className="mb-3 text-xs tracking-wider text-white/80 uppercase">Official sources</h4>
            <a
              href="https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-status.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 hover:text-white"
            >
              IRCC status tracker
            </a>
            <a
              href="https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 hover:text-white"
            >
              Check processing times
            </a>
            <a
              href="https://www.canada.ca/en/services/immigration-citizenship.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 hover:text-white"
            >
              IRCC — canada.ca
            </a>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3.5 border-t border-white/10 pt-5 text-xs">
          <span>© 2026 GetNorthPath. Serving clients worldwide; Canadian immigration focus.</span>
          <span>
            <a href="https://www.getnorthpath.com/privacy" className="hover:text-white">
              Privacy
            </a>{" "}
            ·{" "}
            <a href="https://www.getnorthpath.com/terms" className="hover:text-white">
              Terms
            </a>{" "}
            · Not affiliated with IRCC or the Government of Canada.
          </span>
        </div>
      </div>
    </footer>
  );
}
