import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { DbUnavailableError } from "../db/driver.js";
import { NotFoundError } from "../types/index.js";
import { ZodError } from "zod";

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string };
}

/** Final error handler: maps known errors to proper codes, never leaks internals. */
export const errorHandler: ErrorRequestHandler = (err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
    } satisfies ApiErrorBody);
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } } satisfies ApiErrorBody);
    return;
  }
  if (err instanceof DbUnavailableError || (err as { name?: string })?.name === "Neo4jError" || (err as { name?: string })?.name === "ServiceUnavailable") {
    res.status(503).json({
      success: false,
      error: { code: "DB_UNAVAILABLE", message: "Database is unavailable. Please try again later." },
    } satisfies ApiErrorBody);
    return;
  }
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
  } satisfies ApiErrorBody);
};
