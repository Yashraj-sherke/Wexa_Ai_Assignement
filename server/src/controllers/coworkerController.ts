import type { Request, Response } from "express";
import { coworkerRepository } from "../repositories/coworkerRepository.js";
import { impactService } from "../services/impactService.js";
import { NotFoundError } from "../types/index.js";

interface CoworkerRow {
  id: string; name: string; description: string; status: string; owner: string; environment: string;
  workflows: number; agents: number; systems: number;
  sensitiveAssets: number; hasDestructive: boolean; hasSharedConnector: boolean;
}

export async function listCoworkers(_req: Request, res: Response): Promise<void> {
  const rows = (await coworkerRepository.list()) as CoworkerRow[];
  const data = await Promise.all(
    rows.map(async (c) => {
      const risk = await impactService.getCoworkerRisk(c);
      return {
        id: c.id, name: c.name, description: c.description, status: c.status, owner: c.owner, environment: c.environment,
        workflows: c.workflows, agents: c.agents, systems: c.systems,
        riskScore: risk.score, riskLevel: risk.level,
      };
    })
  );
  res.json({ success: true, data });
}

export async function getCoworker(req: Request, res: Response): Promise<void> {
  const detail = await coworkerRepository.detail(req.params.id);
  if (!detail || !detail.identity) throw new NotFoundError(`Coworker '${req.params.id}' not found`);
  res.json({ success: true, data: detail });
}
