import type { Request, Response } from "express";
import { agentRepository } from "../repositories/agentRepository.js";
import { impactService } from "../services/impactService.js";
import { NotFoundError } from "../types/index.js";

export async function listAgents(_req: Request, res: Response): Promise<void> {
  const rows = (await agentRepository.list()) as {
    id: string; name: string; purpose: string; status: string; riskLevel: string;
    coworker: string | null; coworkerId: string | null; systems: { toNumber?: () => number } | number;
  }[];
  const data = rows.map((a) => ({
    id: a.id, name: a.name, purpose: a.purpose, status: a.status, riskLevel: a.riskLevel,
    coworker: a.coworker, coworkerId: a.coworkerId,
    systems: typeof a.systems === "number" ? a.systems : Number(a.systems?.toNumber?.() ?? 0),
  }));
  res.json({ success: true, data });
}

export async function getAgent(req: Request, res: Response): Promise<void> {
  const detail = await agentRepository.detail(req.params.id);
  if (!detail || !detail.agent) throw new NotFoundError(`Agent '${req.params.id}' not found`);
  res.json({ success: true, data: detail });
}

export async function getAgentImpact(req: Request, res: Response): Promise<void> {
  const impact = await impactService.getAgentImpact(req.params.id);
  res.json({ success: true, data: impact });
}
