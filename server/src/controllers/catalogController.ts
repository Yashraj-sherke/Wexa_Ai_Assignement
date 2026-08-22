import type { Request, Response } from "express";
import { graphRepository } from "../repositories/graphRepository.js";
import { policyRepository } from "../repositories/policyRepository.js";
import { actionRepository } from "../repositories/actionRepository.js";
import { graphExplorerRepository } from "../repositories/graphExplorerRepository.js";
import { traceService } from "../services/traceService.js";
import { NotFoundError } from "../types/index.js";

export async function listSystems(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await graphRepository.listSystems() });
}
export async function listDataAssets(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await graphRepository.listDataAssets() });
}
export async function listResources(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await graphRepository.listResources() });
}
export async function listPolicies(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await policyRepository.list() });
}
export async function getPolicy(req: Request, res: Response): Promise<void> {
  const policy = await policyRepository.detail(req.params.id);
  if (!policy) throw new NotFoundError(`Policy '${req.params.id}' not found`);
  res.json({ success: true, data: policy });
}
export async function listPermissions(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await graphRepository.listPermissions() });
}
export async function listActions(req: Request, res: Response): Promise<void> {
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50) || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset ?? 0) || 0, 0);
  const status = typeof req.query.status === "string" && req.query.status.length > 0 ? req.query.status : undefined;
  const page = await actionRepository.list(limit, offset, status);
  res.json({
    success: true,
    data: { actions: page.items.filter((item) => item != null), total: page.total, limit: page.limit, offset: page.offset },
  });
}
export async function getActionTrace(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await traceService.getActionTrace(req.params.id) });
}
export async function getGraph(req: Request, res: Response): Promise<void> {
  const depth = Math.min(Math.max(Number(req.query.depth ?? 2) || 2, 1), 4);
  const sub = await graphExplorerRepository.subgraph(req.params.nodeType, req.params.nodeId, depth);
  if (sub.nodes.length === 0) {
    throw new NotFoundError(`Node '${req.params.nodeType}/${req.params.nodeId}' not found`);
  }
  res.json({ success: true, data: sub });
}
export async function getMetaNodeTypes(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: { nodeTypes: await graphRepository.listNodeTypes() } });
}
