import express from "express";
import cors from "cors";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error";
import { authRouter } from "@/routes/auth";
import { usernameRouter } from "@/routes/username";
import { trackRouter } from "@/routes/track";
import { dashboardRouter } from "@/routes/dashboard";
import { cohortRouter } from "@/routes/cohort";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/username", usernameRouter);
  app.use("/api/track", trackRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/dashboard", cohortRouter);

  app.use(errorHandler);

  return app;
}
