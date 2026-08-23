import type { Request, Response } from "express";
import { z } from "zod";
import { simulatorService, type SimulateInput } from "../services/simulatorService.js";

export const simulateAccessImpactSchema = z.object({
  agentId: z.string().min(1),
  permissionId: z.string().min(1),
  mode: z.enum(["grant", "revoke"]),
});

export async function simulateAccessImpact(req: Request, res: Response): Promise<void> {
  const input = simulateAccessImpactSchema.parse(req.body) as SimulateInput;
  const result = await simulatorService.simulate(input);
  res.json({ success: true, data: result });
}
