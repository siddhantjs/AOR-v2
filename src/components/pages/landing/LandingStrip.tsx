export function LandingStrip() {
  const stats = [
    {
      title: (
        <>
          <em className="text-red not-italic">13</em> milestones
        </>
      ),
      sub: "From AOR to PR card, one checklist",
    },
    {
      title: (
        <>
          Cohorts by <em className="text-red not-italic">AOR month</em>
        </>
      ),
      sub: "Auto-grouped, inland & outland",
    },
    {
      title: (
        <>
          Real <em className="text-red not-italic">timelines</em>
        </>
      ),
      sub: "Browse what others are tracking",
    },
    {
      title: (
        <>
          Live <em className="text-red not-italic">community</em>
        </>
      ),
      sub: "WhatsApp & Facebook groups",
    },
  ];

  return (
    <div className="w-full bg-navy text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-evenly gap-3 p-4 text-center">
        {stats.map((s) => (
          <div key={s.sub}>
            <b className="block text-2xl font-extrabold">{s.title}</b>
            <span className="text-xs font-semibold text-white/55">{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
