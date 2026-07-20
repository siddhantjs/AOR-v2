import { notFound } from "next/navigation";
import { CohortPage } from "@/components/pages/dashboard/CohortPage";
import { DashboardChrome } from "@/components/pages/dashboard/DashboardChrome";
import { loadCohortPageData } from "@/lib/loadCohort";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ c?: string }>;
};

export default async function CohortRoute({ params, searchParams }: PageProps) {
  const { userId } = await params;
  const { c } = await searchParams;

  let data;
  try {
    data = await loadCohortPageData(userId, c ?? null);
  } catch {
    notFound();
  }
  if (!data) notFound();

  return (
    <DashboardChrome userId={userId} active="cohort">
      <main className="mx-auto max-w-[var(--max)] px-[22px] pt-6 pb-[80px]">
        <CohortPage data={data} />
      </main>
    </DashboardChrome>
  );
}
