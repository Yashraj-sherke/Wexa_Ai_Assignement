import type { Request, Response } from "express";
import { checkHealth } from "../db/driver.js";

export async function health(_req: Request, res: Response): Promise<void> {
  const status = await checkHealth(); // must not throw
  res.json({ success: true, data: { status: "ok", database: status } });
}
