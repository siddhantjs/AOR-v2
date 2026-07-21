import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui";
import { CheckIcon, FACEBOOK_URL, Kicker, WHATSAPP_URL } from "./landingShared";

function Bubbles({ messages }: { messages: { label: string; text: string }[] }) {
  return (
    <div className="relative my-1 mb-5 min-h-24">
      {messages.map((m, i) => (
        <div
          key={m.text}
          className="absolute left-0 animate-landing-bub rounded-xl rounded-bl-sm border border-white/15 bg-white/15 px-3 py-2 text-xs text-white backdrop-blur-sm"
          style={{ animationDelay: `${i * 4}s` }}
        >
          <b className="mb-0.5 block text-xs font-semibold opacity-75">{m.label}</b>
          {m.text}
        </div>
      ))}
    </div>
  );
}

export function LandingCommunity() {
  return (
    <section className="border-y border-border bg-bg-elevated py-20" id="community">
      <div className="wrap">
        <div className="mb-11 max-w-2xl">
          <Kicker>Beyond the dashboard</Kicker>
          <h2 className="mt-2 mb-3 text-3xl font-extrabold text-navy sm:text-4xl">
            The wait is easier with{" "}
            <em className="text-red not-italic sm:italic">people in it with you.</em>
          </h2>
          <p className="text-base text-muted">
            Numbers tell you where your file is. The community tells you what it felt like, what to do
            next, and celebrates with you when the golden email lands. Join free — the tracker works
            fully without it, but it&apos;s better with it.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="landing-card-wa relative flex flex-col overflow-hidden rounded-2xl p-7 text-white shadow-md">
            <div aria-hidden className="landing-card-orb" />
            <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-white/14">
              <FaWhatsapp className="size-6 text-white" aria-hidden />
            </span>
            <h3 className="mb-2 text-xl font-extrabold text-white">WhatsApp cohort groups</h3>
            <p className="mb-4 max-w-sm text-sm text-white/80">
              Fast-moving groups organized by AOR month — the same people you&apos;re grouped with in
              the tracker, talking in real time.
            </p>
            <Bubbles
              messages={[
                { label: "Mar 2026 · Inland", text: 'BGC just flipped to "In progress" — day 64! 🙌' },
                {
                  label: "Mar 2026 · Inland",
                  text: "Anyone else's medical still pending after day 70?",
                },
                { label: "Mar 2026 · Inland", text: "P1 RECEIVED!! Day 126. It's happening 🇨🇦" },
              ]}
            />
            <ul className="mb-5 space-y-1">
              {[
                "Status updates the moment they happen",
                "Ask about your stage, get answers from people at it",
                "PPR & eCOPR celebrations, daily",
              ].map((t) => (
                <li key={t} className="flex gap-2 py-1 text-xs text-white/80">
                  <CheckIcon className="mt-0.5 size-3.5 text-white" />
                  {t}
                </li>
              ))}
            </ul>
            <Button
              href={WHATSAPP_URL}
              variant="inverse"
              arrow
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 self-start text-green"
            >
              Join on WhatsApp
            </Button>
          </div>

          <div className="landing-card-fb relative flex flex-col overflow-hidden rounded-2xl p-7 text-white shadow-md">
            <div aria-hidden className="landing-card-orb" />
            <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-white/14">
              <FaFacebookF className="size-6 text-white" aria-hidden />
            </span>
            <h3 className="mb-2 text-xl font-extrabold text-white">Facebook community</h3>
            <p className="mb-4 max-w-sm text-sm text-white/80">
              The slower, searchable side — detailed timeline posts, stage-by-stage guides from
              members, and threads you can find months later.
            </p>
            <Bubbles
              messages={[
                {
                  label: "Timeline post",
                  text: "Full CEC inland timeline: AOR → PR card in 174 days (with dates)",
                },
                { label: "Guide", text: 'What "info sharing completed" looked like on my tracker' },
                {
                  label: "Milestone",
                  text: "eCOPR after 11 months outland FSW — don't lose hope!",
                },
              ]}
            />
            <ul className="mb-5 space-y-1">
              {[
                "Long-form timeline write-ups you can search",
                "Stage explainers written by people who lived them",
                "A record of how past cohorts moved",
              ].map((t) => (
                <li key={t} className="flex gap-2 py-1 text-xs text-white/80">
                  <CheckIcon className="mt-0.5 size-3.5 text-white" />
                  {t}
                </li>
              ))}
            </ul>
            <Button
              href={FACEBOOK_URL}
              variant="inverse"
              arrow
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 self-start text-blue"
            >
              Join on Facebook
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
