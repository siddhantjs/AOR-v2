import { notFound } from "next/navigation";
import { EditMilestonesPage } from "@/components/pages/dashboard/EditMilestonesPage";
import { DashboardChrome } from "@/components/pages/dashboard/DashboardChrome";
import { loadEditMilestonesData } from "@/lib/loadDashboard";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function EditMilestoneRoute({ params }: PageProps) {
  const { userId } = await params;

  let data;
  try {
    data = await loadEditMilestonesData(userId);
  } catch {
    notFound();
  }
  if (!data) notFound();

  return (
    <DashboardChrome userId={userId} active="edit">
      <main className="mx-auto max-w-[var(--max)] px-[22px] pt-8 pb-[100px]">
        <EditMilestonesPage data={data} />
      </main>
    </DashboardChrome>
  );
}
