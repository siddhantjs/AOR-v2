import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { UserModel } from "@/models/User";
import { normalizeUsername, validateUsernameFormat } from "@/lib/username";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("username") ?? "";
  const format = validateUsernameFormat(raw);

  if (!format.ok) {
    return NextResponse.json(
      { available: false, reason: format.message },
      { status: 400 },
    );
  }

  const username = normalizeUsername(raw);

  try {
    await connectDb();

    // Unique for live users only (SCHEMA_V3: seededData === false).
    const taken = await UserModel.exists({
      username,
      seededData: false,
    });

    if (taken) {
      return NextResponse.json({
        available: false,
        reason: "That username is already taken.",
        username,
      });
    }

    return NextResponse.json({ available: true, username });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not check username. Try again.";
    return NextResponse.json({ available: false, reason: message }, { status: 503 });
  }
}
