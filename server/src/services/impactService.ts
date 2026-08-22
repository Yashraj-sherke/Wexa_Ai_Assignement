import { agentRepository } from "../repositories/agentRepository.js";
import { policyRepository } from "../repositories/policyRepository.js";
import { assessRisk, type RiskFacts } from "./riskService.js";
import type { AgentImpact } from "../types/index.js";
import { NotFoundError } from "../types/index.js";

export const impactService = {
  async getAgentImpact(agentId: string): Promise<AgentImpact> {
    const detail = await agentRepository.detail(agentId);
    if (!detail || !detail.agent) throw new NotFoundError(`Agent '${agentId}' not found`);

    const [reachRes, reachAssets, systems, connectors, workflows, governed, applied, gates, destructive, shared, external] =
      await Promise.all([
        agentRepository.reachableResources(agentId),
        agentRepository.reachableDataAssets(agentId),
        agentRepository.reachableSystems(agentId),
        agentRepository.reachableConnectors(agentId),
        agentRepository.workflows(agentId),
        agentRepository.policies(agentId),
        agentRepository.appliedPolicies(agentId),
        agentRepository.approvalGates(agentId),
        agentRepository.destructiveActions(agentId),
        agentRepository.sharedConnectorAgents(agentId),
        agentRepository.externalConnectors(agentId),
      ]);

    const directIds = new Set((detail.directResources as { id: string }[] | null ?? []).map((r) => r.id));
    const indirect = reachRes.flatMap((r) => (r.resource ? [r.resource] : [])).filter((r) => !directIds.has(r.id));
    const sensitiveAssets = reachAssets.flatMap((r) =>
      r.asset && (r.asset.sensitivity === "HIGH" || r.asset.sensitivity === "CRITICAL") ? [r.asset] : []
    );

    const policyMap = new Map<string, { id: string; name: string; effect: string }>();
    for (const p of [...(governed ?? []), ...(applied ?? [])] as { id: string; name: string; effect: string }[]) {
      policyMap.set(p.id, p);
    }

    // Broad scope: any permission granted by governing policies uses a wildcard scope.
    const policiesDetail = await Promise.all([...policyMap.keys()].map((id) => policyRepository.detail(id)));
    const hasBroadScope = policiesDetail.some((p: { permissions?: { scope?: string }[] } | null) =>
      (p?.permissions ?? []).some((perm) => perm.scope === "*" || perm.scope === "resource:*" || perm.scope?.endsWith(":*"))
    );

    const facts: RiskFacts = {
      sensitiveDataReachable: sensitiveAssets.length,
      hasDestructiveAction: (destructive ?? []).length > 0,
      hasExternalConnector: (external ?? []).length > 0,
      hasNoApprovalGate: (gates ?? []).length === 0,
      hasSharedConnector: (shared ?? []).length > 0,
      hasBroadScope,
    };

    return {
      directResources: [...directIds]
        .map((id) => (detail.directResources as { id: string }[]).find((r) => r.id === id))
        .filter(Boolean) as AgentImpact["directResources"],
      indirectResources: indirect as AgentImpact["indirectResources"],
      sensitiveDataAssets: sensitiveAssets as AgentImpact["sensitiveDataAssets"],
      systems: (systems ?? []) as AgentImpact["systems"],
      connectors: (connectors ?? []) as AgentImpact["connectors"],
      workflowsAffected: (workflows ?? []) as AgentImpact["workflowsAffected"],
      policies: [...policyMap.values()],
      risk: assessRisk(facts),
    };
  },

  async getCoworkerRisk(coworker: {
    sensitiveAssets: number;
    hasDestructive: boolean;
    hasSharedConnector: boolean;
  }) {
    return assessRisk({
      sensitiveDataReachable: coworker.sensitiveAssets,
      hasDestructiveAction: coworker.hasDestructive,
      hasExternalConnector: false, // refined per-agent in impact endpoint
      hasNoApprovalGate: false,
      hasSharedConnector: coworker.hasSharedConnector,
      hasBroadScope: false,
    });
  },
};
