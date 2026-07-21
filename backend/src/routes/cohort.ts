import { Router } from "express";
import { loadAllCohortsPageData, loadCohortPageData } from "@/lib/loadCohort";

export const cohortRouter = Router();

cohortRouter.get("/:userId/cohort", async (req, res) => {
  const userId = String(req.params.userId ?? "");
  if (!/^[a-f\d]{24}$/i.test(userId)) {
    res.status(400).json({ error: "Invalid user." });
    return;
  }

  const cohortKeyParam = typeof req.query.c === "string" ? req.query.c : null;

  try {
    const data = await loadCohortPageData(userId, cohortKeyParam);
    if (!data) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not load cohort.";
    res.status(message.includes("Database") ? 503 : 500).json({ error: message });
  }
});

cohortRouter.get("/:userId/all-cohorts", async (req, res) => {
  const userId = String(req.params.userId ?? "");
  if (!/^[a-f\d]{24}$/i.test(userId)) {
    res.status(400).json({ error: "Invalid user." });
    return;
  }

  try {
    const data = await loadAllCohortsPageData(userId);
    if (!data) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error && err.message === "MONGODB_URI is not set"
        ? "Database is not configured."
        : "Could not load cohorts.";
    res.status(message.includes("Database") ? 503 : 500).json({ error: message });
  }
});
