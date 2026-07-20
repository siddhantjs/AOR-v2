import { connectDb } from "@/lib/db";
import { buildDashboardView, type DashboardView } from "@/lib/dashboardView";
import type { User } from "@/lib/schema/types";
import { UserModel } from "@/models/User";

export async function loadDashboardView(
  userId: string,
): Promise<DashboardView | null> {
  if (!/^[a-f\d]{24}$/i.test(userId)) return null;

  await connectDb();
  const doc = await UserModel.findById(userId).lean();
  if (!doc) return null;

  return buildDashboardView(doc as unknown as User);
}
