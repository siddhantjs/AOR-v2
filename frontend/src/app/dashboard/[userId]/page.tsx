import { notFound } from "next/navigation";
import { DashboardPage } from "@/components/pages/dashboard";
import { DashboardChrome } from "@/components/pages/dashboard/DashboardChrome";
import { api } from "@/lib/api";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function DashboardRoute({ params }: PageProps) {
  const { userId } = await params;
  let data;
  try {
    data = await api.getDashboard(userId);
  } catch {
    notFound();
  }
  if (!data) notFound();

  return (
    <DashboardChrome userId={userId} active="timeline">
      <main className="mx-auto max-w-[var(--max)] px-[22px] pt-6 pb-[80px]">
        <DashboardPage data={data} />
      </main>
    </DashboardChrome>
  );
}
