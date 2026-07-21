import { notFound } from "next/navigation";
import { AllCohortsPage } from "@/components/pages/dashboard/AllCohortsPage";
import { DashboardChrome } from "@/components/pages/dashboard/DashboardChrome";
import { api } from "@/lib/api";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AllCohortsRoute({ params }: PageProps) {
  const { userId } = await params;

  let data;
  try {
    data = await api.getAllCohorts(userId);
  } catch {
    notFound();
  }
  if (!data) notFound();

  return (
    <DashboardChrome userId={userId} active="all-cohorts">
      <main className="mx-auto max-w-[var(--max)] px-[22px] pt-6 pb-[80px]">
        <AllCohortsPage data={data} />
      </main>
    </DashboardChrome>
  );
}
