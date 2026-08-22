import { runRead, runSingle } from "./run.js";
import * as q from "../queries/simulatorQueries.js";
import * as policyQueries from "../queries/policyQueries.js";
import type { Record as Neo4jRecord } from "neo4j-driver";

export interface HypotheticalPathRow {
  resource: { id: string; name: string };
  nodes: { id: string; type: string; name: string }[];
  edges: { source: string; target: string; type: string }[];
}

export const simulatorRepository = {
  async permission(id: string) {
    return runSingle(policyQueries.permissionById(id), (r: Neo4jRecord) => r.get("permission"));
  },
  async permissionScopeResources(scope: string) {
    return runRead(q.permissionScopeResources(scope), (r: Neo4jRecord) => r.get("resource"));
  },
  async hypotheticalPaths(agentId: string) {
    return runRead(q.hypotheticalPaths(agentId), (r: Neo4jRecord) => ({
      resource: r.get("resource"),
      nodes: r.get("nodes"),
      edges: r.get("edges"),
    })) as Promise<HypotheticalPathRow[]>;
  },
  async dataAssetsByResource() {
    return runRead(q.dataAssetsInResources(), (r: Neo4jRecord) => ({ resourceId: r.get("resourceId"), asset: r.get("asset") }));
  },
  async systemsByResource() {
    return runRead(q.systemsProvidingResources(), (r: Neo4jRecord) => ({ resourceId: r.get("resourceId"), system: r.get("system") }));
  },
};
