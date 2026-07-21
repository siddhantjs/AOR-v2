import { Router } from "express";
import { connectDb } from "@/lib/db";
import { UserModel } from "@/models/User";
import { normalizeUsername, validateUsernameFormat } from "@/lib/username";

export const usernameRouter = Router();

usernameRouter.get("/check", async (req, res) => {
  const raw = String(req.query.username ?? "");
  const format = validateUsernameFormat(raw);

  if (!format.ok) {
    res.status(400).json({ available: false, reason: format.message });
    return;
  }

  const username = normalizeUsername(raw);

  try {
    await connectDb();

    const taken = await UserModel.exists({
      username,
      seededData: false,
    });

    if (taken) {
      res.json({
        available: false,
        reason: "That username is already taken.",
        username,
      });
      return;
    }

    res.json({ available: true, username });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not check username. Try again.";
    res.status(503).json({ available: false, reason: message });
  }
});
