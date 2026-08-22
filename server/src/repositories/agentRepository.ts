import { runRead, runSingle } from "./run.js";
import * as q from "../queries/agentQueries.js";
import type { Record as Neo4jRecord } from "neo4j-driver";

export interface PathRow {
  resource?: { id: string; name: string; [key: string]: unknown };
  asset?: { id: string; name: string; sensitivity: string; [key: string]: unknown };
  pathIds: string[];
  pathLabels: string[];
  pathNames: string[];
  pathRels: string[];
}

export const agentRepository = {
  async list() {
    return runRead(q.listAgents(), (r: Neo4jRecord) => r.get("agent"));
  },
  async detail(id: string) {
    return runSingle(q.getAgent(id), (r: Neo4jRecord) => ({
      agent: r.get("agent"),
      coworkers: r.get("coworkers"),
      workflows: r.get("workflows"),
      skills: r.get("skills"),
      knowledgeBases: r.get("knowledgeBases"),
      directResources: r.get("directResources"),
    }));
  },
  async reachableResources(agentId: string) {
    return runRead(q.reachableResources(agentId), (r: Neo4jRecord) => ({
      resource: r.get("resource"),
      pathIds: r.get("pathIds"),
      pathLabels: r.get("pathLabels"),
      pathNames: r.get("pathNames"),
      pathRels: r.get("pathRels"),
    })) as Promise<PathRow[]>;
  },
  async reachableDataAssets(agentId: string) {
    return runRead(q.reachableDataAssets(agentId), (r: Neo4jRecord) => ({
      asset: r.get("asset"),
      pathIds: r.get("pathIds"),
      pathLabels: r.get("pathLabels"),
      pathNames: r.get("pathNames"),
      pathRels: r.get("pathRels"),
    })) as Promise<PathRow[]>;
  },
  async reachableSystems(agentId: string) {
    return runRead(q.reachableSystems(agentId), (r: Neo4jRecord) => r.get("system"));
  },
  async reachableConnectors(agentId: string) {
    return runRead(q.reachableConnectors(agentId), (r: Neo4jRecord) => r.get("connector"));
  },
  async workflows(agentId: string) {
    return runRead(q.workflowsForAgent(agentId), (r: Neo4jRecord) => r.get("workflow"));
  },
  async policies(agentId: string) {
    return runRead(q.policiesForAgent(agentId), (r: Neo4jRecord) => r.get("policy"));
  },
  async appliedPolicies(agentId: string) {
    return runRead(q.policiesAppliedToAgent(agentId), (r: Neo4jRecord) => r.get("policy"));
  },
  async approvalGates(agentId: string) {
    return runRead(q.approvalGatesForAgent(agentId), (r: Neo4jRecord) => r.get("gate"));
  },
  async destructiveActions(agentId: string) {
    return runRead(q.destructiveActionsForAgent(agentId), (r: Neo4jRecord) => r.get("action"));
  },
  async sharedConnectorAgents(agentId: string) {
    return runRead(q.sharedConnectorAgents(agentId), (r: Neo4jRecord) => ({ connector: r.get("connector"), agent: r.get("agent") }));
  },
  async externalConnectors(agentId: string) {
    return runRead(q.externalConnectorsForAgent(agentId), (r: Neo4jRecord) => r.get("connector"));
  },
  async policyConflicts(agentId: string) {
    return runRead(q.policyConflictsForAgent(agentId), (r: Neo4jRecord) => ({ policyA: r.get("policyA"), policyB: r.get("policyB") }));
  },
};
