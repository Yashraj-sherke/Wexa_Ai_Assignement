import { simulatorRepository, type HypotheticalPathRow } from "../repositories/simulatorRepository.js";
import { agentRepository } from "../repositories/agentRepository.js";
import { assessRisk, computeDelta } from "./riskService.js";
import type { ReachabilitySnapshot, SimulatorPath, SimulatorResult } from "../types/index.js";
import { NotFoundError } from "../types/index.js";

export interface SimulateInput {
  agentId: string;
  permissionId: string;
  mode: "grant" | "revoke";
}

export interface ReachSet {
  resourceIds: Set<string>;
  sensitiveAssetIds: Set<string>;
  systemIds: Set<string>;
}

/** Pure: build a reachability set from repo-shaped data. Testable without a DB. */
export function buildReachSet(
  resources: { id: string }[],
  dataAssets: { id: string; sensitivity: string }[],
  systems: { id: string }[]
): ReachSet {
  return {
    resourceIds: new Set(resources.map((r) => r.id)),
    sensitiveAssetIds: new Set(dataAssets.filter((a) => a.sensitivity === "HIGH" || a.sensitivity === "CRITICAL").map((a) => a.id)),
    systemIds: new Set(systems.map((s) => s.id)),
  };
}

/** Pure: union a grant into a reach set (returns a new set; no mutation of input). */
export function unionGrant(set: ReachSet, granted: { resourceIds: string[]; sensitiveAssetIds: string[]; systemIds: string[] }): ReachSet {
  return {
    resourceIds: new Set([...set.resourceIds, ...granted.resourceIds]),
    sensitiveAssetIds: new Set([...set.sensitiveAssetIds, ...granted.sensitiveAssetIds]),
    systemIds: new Set([...set.systemIds, ...granted.systemIds]),
  };
}

/** Pure: subtract a revoke from a reach set. */
export function subtractRevoke(set: ReachSet, revoked: { resourceIds: string[]; sensitiveAssetIds: string[]; systemIds: string[] }): ReachSet {
  const del = {
    resourceIds: new Set(revoked.resourceIds),
    sensitiveAssetIds: new Set(revoked.sensitiveAssetIds),
    systemIds: new Set(revoked.systemIds),
  };
  return {
    resourceIds: new Set([...set.resourceIds].filter((id) => !del.resourceIds.has(id))),
    sensitiveAssetIds: new Set([...set.sensitiveAssetIds].filter((id) => !del.sensitiveAssetIds.has(id))),
    systemIds: new Set([...set.systemIds].filter((id) => !del.systemIds.has(id))),
  };
}

export function snapshot(set: ReachSet, extraFacts: { destructive: boolean; external: boolean; noGate: boolean; shared: boolean; broad: boolean }): ReachabilitySnapshot {
  const risk = assessRisk({
    sensitiveDataReachable: set.sensitiveAssetIds.size,
    hasDestructiveAction: extraFacts.destructive,
    hasExternalConnector: extraFacts.external,
    hasNoApprovalGate: extraFacts.noGate,
    hasSharedConnector: extraFacts.shared,
    hasBroadScope: extraFacts.broad,
  });
  return {
    resources: set.resourceIds.size,
    sensitiveAssets: set.sensitiveAssetIds.size,
    systems: set.systemIds.size,
    riskScore: risk.score,
    riskLevel: risk.level,
  };
}

/** Convert hypothetical path rows into API path shapes. */
export function toSimulatorPaths(rows: HypotheticalPathRow[]): SimulatorPath[] {
  return rows.slice(0, 50).map((row) => ({ nodes: row.nodes, edges: row.edges }));
}

export const simulatorService = {
  /** Computes a hypothetical grant/revoke WITHOUT mutating the graph. */
  async simulate(input: SimulateInput): Promise<SimulatorResult> {
    const agent = await agentRepository.detail(input.agentId);
    if (!agent || !agent.agent) throw new NotFoundError(`Agent '${input.agentId}' not found`);

    const permission = await simulatorRepository.permission(input.permissionId);
    if (!permission) throw new NotFoundError(`Permission '${input.permissionId}' not found`);

    const [reachRes, reachAssets, reachSystems, gates, destructive, shared, external, scopeResources, assetsByRes, systemsByRes] =
      await Promise.all([
        agentRepository.reachableResources(input.agentId),
        agentRepository.reachableDataAssets(input.agentId),
        agentRepository.reachableSystems(input.agentId),
        agentRepository.approvalGates(input.agentId),
        agentRepository.destructiveActions(input.agentId),
        agentRepository.sharedConnectorAgents(input.agentId),
        agentRepository.externalConnectors(input.agentId),
        simulatorRepository.permissionScopeResources(permission.scope as string),
        simulatorRepository.dataAssetsByResource(),
        simulatorRepository.systemsByResource(),
      ]);

    const assetsFor = (resourceId: string) => assetsByRes.filter((x) => x.resourceId === resourceId).map((x) => x.asset);
    const systemsFor = (resourceId: string) => systemsByRes.filter((x) => x.resourceId === resourceId).map((x) => x.system);
    const isBroad = permission.scope === "*" || permission.scope === "resource:*" || String(permission.scope).endsWith(":*");

    const before = buildReachSet(
      reachRes.flatMap((r) => (r.resource ? [r.resource] : [])),
      reachAssets.flatMap((r) => (r.asset ? [r.asset as { id: string; sensitivity: string }] : [])),
      reachSystems as { id: string }[]
    );

    const grantedResourceIds = scopeResources.map((r) => r.id);
    const grantedAssetIds = scopeResources.flatMap((r) => assetsFor(r.id)).map((a) => a.id);
    const grantedSystemIds = scopeResources.flatMap((r) => systemsFor(r.id)).map((s) => s.id);
    const grant = {
      resourceIds: grantedResourceIds,
      sensitiveAssetIds: grantedAssetIds,
      systemIds: grantedSystemIds,
    };

    const after =
      input.mode === "grant"
        ? unionGrant(before, grant)
        : subtractRevoke(before, grant);

    const facts = {
      destructive: (destructive ?? []).length > 0,
      external: (external ?? []).length > 0,
      noGate: (gates ?? []).length === 0,
      shared: (shared ?? []).length > 0,
      broad: isBroad,
    };

    const beforeSnap = snapshot(before, { ...facts, broad: false });
    const afterSnap = snapshot(after, facts);

    // Newly reachable nodes + illustrative paths (grant only).
    const newlyReachable: { id: string; type: string; name: string }[] = [];
    const newPaths: SimulatorPath[] = [];
    if (input.mode === "grant") {
      const existingAssets = new Set(reachAssets.flatMap((r) => (r.asset ? [r.asset.id] : [])));
      for (const r of scopeResources) {
        if (!before.resourceIds.has(r.id)) newlyReachable.push({ id: r.id, type: "Resource", name: r.name });
      }
      for (const r of scopeResources) {
        for (const a of assetsFor(r.id)) {
          if (!existingAssets.has(a.id)) newlyReachable.push({ id: a.id, type: "DataAsset", name: a.name });
        }
      }
      const paths = await simulatorRepository.hypotheticalPaths(input.agentId);
      newPaths.push(...toSimulatorPaths(paths.filter((p) => !before.resourceIds.has(p.resource.id))));
    } else {
      // Revoked = previously reachable but in permission scope.
      for (const id of grantedResourceIds) {
        if (before.resourceIds.has(id)) newlyReachable.push({ id, type: "Resource", name: id });
      }
    }

    return {
      before: beforeSnap,
      after: afterSnap,
      delta: computeDelta(beforeSnap, afterSnap),
      newlyReachable: newlyReachable.slice(0, 100),
      newPaths,
    };
  },
};
