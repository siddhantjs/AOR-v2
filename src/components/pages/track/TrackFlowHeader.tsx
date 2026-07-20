type Phase = {
  step: number;
  label: string;
  state: "on" | "done" | "todo";
};

type TrackFlowHeaderProps = {
  kicker: string;
  title: string;
  subtitle: string;
  phases: Phase[];
};

function phaseClasses(state: Phase["state"]) {
  if (state === "on") {
    return {
      row: "text-[var(--navy)]",
      badge: "border-[var(--navy)] bg-[var(--navy)] text-[var(--on-navy)]",
    };
  }
  if (state === "done") {
    return {
      row: "text-[var(--green)]",
      badge: "border-[var(--green)] bg-[var(--gbg)] text-[var(--green)]",
    };
  }
  return {
    row: "text-[var(--muted2)]",
    badge: "border-[var(--border2)] bg-[var(--bg-elevated)] text-[var(--muted2)]",
  };
}

export function TrackFlowHeader({
  kicker,
  title,
  subtitle,
  phases,
}: TrackFlowHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-xs font-bold tracking-[0.09em] text-[var(--red)] uppercase">
          {kicker}
        </div>
        <h1 className="mt-1.5 mb-1 text-[28px] font-extrabold tracking-[-0.03em] text-[var(--navy)]">
          {title}
        </h1>
        <p className="m-0 max-w-[600px] text-sm text-[var(--muted)]">{subtitle}</p>
      </div>

      <div className="flex items-center" aria-label="Progress">
        {phases.map((phase, index) => {
          const classes = phaseClasses(phase.state);
          return (
            <div key={phase.step} className="flex items-center gap-2.5">
              {index > 0 ? (
                <div className="mx-2.5 h-[1.5px] w-[34px] bg-[var(--border2)]" aria-hidden />
              ) : null}
              <div
                className={`flex items-center gap-2.5 font-[family-name:var(--font-display)] text-[13.5px] font-bold ${classes.row}`}
              >
                <span
                  className={`flex size-[26px] items-center justify-center rounded-full border-[1.5px] text-xs ${classes.badge}`}
                >
                  {phase.state === "done" ? (
                    <svg
                      className="size-[13px] fill-none stroke-current stroke-[2.6] [stroke-linecap:round] [stroke-linejoin:round]"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    phase.step
                  )}
                </span>
                {phase.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
