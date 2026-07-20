import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardPage } from "@/components/pages/dashboard";
import { LogoMark } from "@/components/common/LogoMark";
import { loadDashboardView } from "@/lib/loadDashboard";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function DashboardRoute({ params }: PageProps) {
  const { userId } = await params;
  let data;
  try {
    data = await loadDashboardView(userId);
  } catch {
    notFound();
  }
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--max)] items-center justify-between px-[22px]">
          <Link href="/" className="flex items-center gap-1">
            <LogoMark />
            <span className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-[-0.02em] text-[var(--navy)]">
              AOR<span className="text-[var(--red)]">Track</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] font-semibold">
            <span className="rounded-[9px] bg-[var(--bg-muted)] px-3.5 py-2 text-[var(--navy)]">
              My timeline
            </span>
            <Link
              href={`/track`}
              className="rounded-[9px] px-3.5 py-2 text-[var(--muted)] transition-[var(--ease)] hover:text-[var(--navy)]"
            >
              Edit milestones
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[var(--max)] px-[22px] pt-6 pb-[80px]">
        <DashboardPage data={data} />
      </main>
    </div>
  );
}
