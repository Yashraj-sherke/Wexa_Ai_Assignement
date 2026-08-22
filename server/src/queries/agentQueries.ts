import { stmt, ACCESS_RELS } from "./statement.js";

export function listAgents() {
  return stmt(`
    MATCH (a:Agent)
    OPTIONAL MATCH (c:Coworker)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(a)
    OPTIONAL MATCH (a)-[:USES*1..4]->(:Connector)-[:CONNECTS_TO]->(s:System)
    WITH a, c, count(DISTINCT s) AS systemCount
    RETURN a {
      .*,
      coworker: c.name,
      coworkerId: c.id,
      systems: systemCount
    } AS agent
    ORDER BY agent.name
  `);
}

export function getAgent(id: string) {
  return stmt(
    `
    MATCH (a:Agent {id: $id})
    OPTIONAL MATCH (c:Coworker)-[:CONTAINS]->(w:Workflow)-[:HAS_STEP]->(a)
    OPTIONAL MATCH (a)-[:USES]->(sk:Skill)
    OPTIONAL MATCH (a)-[:USES]->(kb:KnowledgeBase)
    OPTIONAL MATCH (a)-[:CAN_ACCESS]->(r:Resource)
    RETURN a {.*} AS agent,
      collect(DISTINCT c) AS coworkers,
      collect(DISTINCT w) AS workflows,
      collect(DISTINCT sk) AS skills,
      collect(DISTINCT kb) AS knowledgeBases,
      collect(DISTINCT r) AS directResources
  `,
    { id }
  );
}

/** Multi-hop traversal from an agent over access relationships (parameterized, limited). */
export function reachableResources(agentId: string, limit = 300) {
  return stmt(
    `
    MATCH path = (a:Agent {id: $agentId})-[r:USES|CONNECTS_TO|PROVIDES|CAN_ACCESS|CONTAINS*1..6]->(res:Resource)
    RETURN DISTINCT res {.*} AS resource,
      [n IN nodes(path) | n.id] AS pathIds,
      [n IN nodes(path) | labels(n)[0]] AS pathLabels,
      [n IN nodes(path) | coalesce(n.name, n.title, n.id)] AS pathNames,
      [e IN relationships(path) | type(e)] AS pathRels
    LIMIT $limit
  `,
    { agentId, limit }
  );
}

export function reachableDataAssets(agentId: string, limit = 300) {
  return stmt(
    `
    MATCH path = (a:Agent {id: $agentId})-[r:USES|CONNECTS_TO|PROVIDES|CAN_ACCESS|CONTAINS*1..6]->(da:DataAsset)
    RETURN DISTINCT da {.*} AS asset,
      [n IN nodes(path) | n.id] AS pathIds,
      [n IN nodes(path) | labels(n)[0]] AS pathLabels,
      [n IN nodes(path) | coalesce(n.name, n.title, n.id)] AS pathNames,
      [n IN nodes(path) | coalesce(n.sensitivity, '')] AS pathSensitivities,
      [e IN relationships(path) | type(e)] AS pathRels
    LIMIT $limit
  `,
    { agentId, limit }
  );
}

export function reachableSystems(agentId: string) {
  return stmt(
    `
    MATCH (a:Agent {id: $agentId})-[:USES|CONNECTS_TO|PROVIDES|CAN_ACCESS|CONTAINS*1..6]->(s:System)
    RETURN DISTINCT s {.*} AS system
    LIMIT 100
  `,
    { agentId }
  );
}

export function reachableConnectors(agentId: string) {
  return stmt(
    `
    MATCH (a:Agent {id: $agentId})-[:USES*1..3]->(conn:Connector)
    RETURN DISTINCT conn {.*} AS connector
    LIMIT 100
  `,
    { agentId }
  );
}

export function workflowsForAgent(agentId: string) {
  return stmt(
    `
    MATCH (w:Workflow)-[:HAS_STEP]->(a:Agent {id: $agentId})
    RETURN DISTINCT w {.*} AS workflow
    LIMIT 50
  `,
    { agentId }
  );
}

export function policiesForAgent(agentId: string) {
  return stmt(
    `
    MATCH (a:Agent {id: $agentId})
    OPTIONAL MATCH (a)-[:GOVERNED_BY]->(p:Policy)
    RETURN DISTINCT p {.*} AS policy
    LIMIT 50
  `,
    { agentId }
  );
}

export function policiesAppliedToAgent(agentId: string) {
  return stmt(
    `
    MATCH (p:Policy)-[:APPLIES_TO]->(a:Agent {id: $agentId})
    RETURN DISTINCT p {.*} AS policy
    LIMIT 50
  `,
    { agentId }
  );
}

export function approvalGatesForAgent(agentId: string) {
  return stmt(
    `
    MATCH (a:Agent {id: $agentId})-[:GOVERNED_BY]->(:Policy)-[:REQUIRES]->(g:ApprovalGate)
    RETURN DISTINCT g {.*} AS gate
    LIMIT 50
  `,
    { agentId }
  );
}

export function destructiveActionsForAgent(agentId: string) {
  return stmt(
    `
    MATCH (a:Agent {id: $agentId})-[:CAN_PERFORM]->(act:Action)
    WHERE act.type CONTAINS 'WRITE' OR act.type CONTAINS 'DELETE'
    RETURN DISTINCT act {.*} AS action
    LIMIT 50
  `,
    { agentId }
  );
}

/** Shared-connector blast radius: other agents reaching the same connectors. */
export function sharedConnectorAgents(agentId: string) {
  return stmt(
    `
    MATCH (a:Agent {id: $agentId})-[:USES]->(:Skill)-[:USES]->(conn:Connector)<-[:USES]-(:Skill)<-[:USES]-(other:Agent)
    WHERE other.id <> $agentId
    RETURN DISTINCT conn {.*} AS connector, other {.*} AS agent
    LIMIT 100
  `,
    { agentId }
  );
}

export function externalConnectorsForAgent(agentId: string) {
  return stmt(
    `
    MATCH (a:Agent {id: $agentId})-[:USES*1..3]->(conn:Connector)
    WHERE toLower(conn.type) CONTAINS 'external'
    RETURN DISTINCT conn {.*} AS connector
    LIMIT 50
  `,
    { agentId }
  );
}

export const ACCESS_REL_LIST = ACCESS_RELS;

export { policyConflictsForAgent } from "./policyQueries.js";
