import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { normalizeUsername, validateUsernameFormat } from "@/lib/username";
import { UserModel } from "@/models/User";

type LoginBody = {
  email?: string;
  username?: string;
};

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const emailNorm = email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return NextResponse.json(
      { error: "Enter a valid email." },
      { status: 400 },
    );
  }

  const format = validateUsernameFormat(body.username ?? "");
  if (!format.ok) {
    return NextResponse.json({ error: format.message }, { status: 400 });
  }
  const username = normalizeUsername(body.username ?? "");

  try {
    await connectDb();

    const user = await UserModel.findOne({
      emailNorm,
      username,
      seededData: false,
    })
      .select("_id")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "No timeline found for that email and username." },
        { status: 404 },
      );
    }

    const userId = String(user._id);
    return NextResponse.json({
      userId,
      redirectTo: `/dashboard/${userId}`,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not sign in. Try again.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Database") ? 503 : 500 },
    );
  }
}
