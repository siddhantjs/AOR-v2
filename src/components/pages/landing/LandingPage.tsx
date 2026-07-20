import Link from "next/link";
import { LogoMark } from "@/components/common/LogoMark";

const MILESTONE_PREVIEW = [
  { label: "AOR", done: true },
  { label: "Medical", done: true },
  { label: "BGC", done: false, estimate: "Mid Sep" },
  { label: "Decision", done: false, estimate: "Early Nov" },
  { label: "eCOPR", done: false, estimate: "Late Dec" },
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--max)] items-center gap-3 px-[22px]">
          <Link href="/" className="flex items-center gap-1">
            <LogoMark />
            <span className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              AOR<span className="text-[var(--red)]">Track</span>
            </span>
          </Link>
          <div className="flex-1" />
          <Link
            href="/login"
            className="rounded-[9px] border border-[var(--border2)] bg-[var(--bg-elevated)] px-3.5 py-2 text-[13px] font-semibold text-[var(--ink)] transition-[var(--ease)] hover:border-[var(--muted2)]"
          >
            Log in
          </Link>
          <Link
            href="/track"
            className="rounded-[9px] bg-[var(--red)] px-3.5 py-2 text-[13px] font-semibold text-[var(--on-navy)] transition-[var(--ease)] hover:bg-[var(--red2)]"
          >
            Start tracking
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[var(--bg)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 55% at 85% 15%, rgba(200,40,30,0.08), transparent 55%), radial-gradient(ellipse 55% 45% at 5% 80%, rgba(26,35,50,0.05), transparent 50%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 80%)",
          }}
        />

        <div className="relative mx-auto grid min-h-[calc(100vh-var(--header-h))] max-w-[var(--max)] items-center gap-12 px-[22px] py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
          <div className="animate-[landing-rise_0.7s_ease-out_both]">
            <p className="font-[family-name:var(--font-display)] text-[42px] leading-none font-extrabold tracking-[-0.04em] text-[var(--navy)] sm:text-[56px] lg:text-[64px]">
              AOR<span className="text-[var(--red)]">Track</span>
            </p>
            <h1 className="mt-5 max-w-[18ch] text-[26px] leading-[1.2] font-extrabold tracking-[-0.03em] text-[var(--navy)] sm:text-[32px]">
              See where your PR file sits — and what comes next.
            </h1>
            <p className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">
              Log your milestones, get AI date windows, and browse real journeys
              in your AOR cohort.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/track"
                className="inline-flex items-center rounded-[10px] bg-[var(--red)] px-[22px] py-[12px] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--on-navy)] transition-[var(--ease)] hover:bg-[var(--red2)]"
              >
                Start tracking free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-[10px] border border-[var(--border2)] bg-[var(--bg-elevated)] px-[22px] py-[12px] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--navy)] transition-[var(--ease)] hover:border-[var(--muted2)]"
              >
                Open my timeline
              </Link>
            </div>
          </div>

          <div
            className="animate-[landing-rise_0.7s_ease-out_0.12s_both]"
            aria-hidden
          >
            <TimelinePreview />
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--bg-muted)]">
        <div className="mx-auto max-w-[var(--max)] px-[22px] py-16 sm:py-20">
          <p className="text-xs font-bold tracking-[0.09em] text-[var(--red)] uppercase">
            How it works
          </p>
          <h2 className="mt-2 max-w-[22ch] font-[family-name:var(--font-display)] text-[28px] font-extrabold tracking-[-0.03em] text-[var(--navy)] sm:text-[32px]">
            Two minutes to join your cohort.
          </h2>
          <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-[var(--muted)] sm:text-[15px]">
            Tell us your ITA and AOR, mark what has already happened, and we
            estimate the rest from people on a similar path.
          </p>

          <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {[
              {
                n: "1",
                title: "Application details",
                body: "Pathway, draw, inland or outland, and your key dates.",
              },
              {
                n: "2",
                title: "Log milestones",
                body: "Tick BIL, medical, portals, and more — skip what is still ahead.",
              },
              {
                n: "3",
                title: "Follow the timeline",
                body: "AI windows for what is pending, plus your cohort on the dashboard.",
              },
            ].map((step) => (
              <li key={step.n} className="relative">
                <span className="font-[family-name:var(--font-display)] text-[13px] font-bold tracking-[0.06em] text-[var(--red)]">
                  Step {step.n}
                </span>
                <h3 className="mt-1.5 text-[17px] font-bold tracking-[-0.02em] text-[var(--navy)]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-12">
            <Link
              href="/track"
              className="inline-flex items-center rounded-[10px] bg-[var(--red)] px-[22px] py-[11px] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--on-navy)] transition-[var(--ease)] hover:bg-[var(--red)]/80"
            >
              Begin with your application
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex max-w-[var(--max)] flex-wrap items-center justify-between gap-3 px-[22px] py-6">
          <div className="flex items-center gap-1.5">
            <LogoMark />
            <span className="font-[family-name:var(--font-display)] text-sm font-extrabold text-[var(--navy)]">
              AOR<span className="text-[var(--red)]">Track</span>
            </span>
          </div>
          <p className="text-[12.5px] text-[var(--muted)]">
            Canadian PR timelines · Not affiliated with IRCC
          </p>
        </div>
      </footer>
    </div>
  );
}

function TimelinePreview() {
  return (
    <div className="relative rounded-[18px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-md)] sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] text-[var(--muted2)] uppercase">
            Your timeline
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.02em] text-[var(--navy)]">
            214 days since AOR
          </p>
        </div>
        <p className="animate-[landing-pulse_2.4s_ease-in-out_infinite] text-[12px] font-semibold text-[var(--red)]">
          Next: Background check
        </p>
      </div>

      <ul className="relative space-y-0">
        <span
          aria-hidden
          className="absolute top-3 bottom-3 left-[7px] w-px origin-top animate-[landing-draw_1.1s_ease-out_0.25s_both] bg-[var(--border2)]"
        />
        {MILESTONE_PREVIEW.map((m, i) => (
          <li
            key={m.label}
            className="relative flex items-start gap-3 py-2.5"
            style={{
              animation: `landing-rise 0.55s ease-out ${0.28 + i * 0.07}s both`,
            }}
          >
            <span
              className={`relative z-[1] mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                m.done
                  ? "border-[var(--green)] bg-[var(--green)]"
                  : "border-[var(--border2)] bg-[var(--bg-elevated)]"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-[13.5px] font-semibold ${
                    m.done ? "text-[var(--navy)]" : "text-[var(--muted)]"
                  }`}
                >
                  {m.label}
                </span>
                {m.done ? (
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted2)]">
                    done
                  </span>
                ) : (
                  <span className="rounded-md bg-[var(--bg-muted)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                    {m.estimate}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
