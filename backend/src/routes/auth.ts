import { Router } from "express";
import { connectDb } from "@/lib/db";
import { UserModel } from "@/models/User";

export const authRouter = Router();

type LoginBody = {
  email?: string;
  username?: string;
};

authRouter.post("/login", async (req, res) => {
  const body = (req.body ?? {}) as LoginBody;

  const email = (body.email ?? "").trim();
  const emailNorm = email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    res.status(400).json({ error: "Enter a valid email." });
    return;
  }

  const username = (body.username ?? "").trim().toLowerCase();
  if (!username) {
    res.status(400).json({ error: "Enter your username." });
    return;
  }

  try {
    await connectDb();

    const user = await UserModel.findOne({
      emailNorm,
      username,
    })
      .select("_id")
      .lean();

    if (!user) {
      res.status(404).json({ error: "No timeline found for that email and username." });
      return;
    }

    const userId = String(user._id);
    res.json({
      userId,
      redirectTo: `/dashboard/${userId}`,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not sign in. Try again.";
    res.status(message.includes("Database") ? 503 : 500).json({ error: message });
  }
});
