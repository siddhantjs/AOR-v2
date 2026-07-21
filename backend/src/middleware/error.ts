import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error.";
  if (message === "MONGODB_URI is not set") {
    res.status(503).json({ error: "Database is not configured." });
    return;
  }
  if (message.includes("GEMINI_API_KEY")) {
    res.status(503).json({ error: "AI estimates are not configured." });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error." });
}
