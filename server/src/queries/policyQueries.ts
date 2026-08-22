import { stmt } from "./statement.js";

export function listPolicies() {
  return stmt(`
    MATCH (p:Policy)
    OPTIONAL MATCH (p)-[:GRANTS]->(perm:Permission)
    OPTIONAL MATCH (p)-[:REQUIRES]->(g:ApprovalGate)
    OPTIONAL MATCH (p)-[:APPLIES_TO]->(a:Agent)
    WITH p, collect(DISTINCT perm) AS permissions,
      collect(DISTINCT g) AS approvalGates,
      collect(DISTINCT a) AS appliedAgents
    RETURN p {
      .*,
      status: coalesce(p.status, 'ACTIVE'),
      permissions: permissions,
      approvalGates: approvalGates,
      agents: [x IN appliedAgents | x {id: x.id, name: x.name}]
    } AS policy
    ORDER BY p.priority DESC
  `);
}

export function getPolicy(id: string) {
  return stmt(
    `
    MATCH (p:Policy {id: $id})
    OPTIONAL MATCH (p)-[:GRANTS]->(perm:Permission)
    OPTIONAL MATCH (p)-[:REQUIRES]->(g:ApprovalGate)
    OPTIONAL MATCH (p)-[:APPLIES_TO]->(a:Agent)
    WITH p, collect(DISTINCT perm) AS permissions,
      collect(DISTINCT g) AS approvalGates,
      collect(DISTINCT a) AS appliedAgents
    RETURN p {
      .*,
      status: coalesce(p.status, 'ACTIVE'),
      permissions: permissions,
      approvalGates: approvalGates,
      agents: [x IN appliedAgents | x {id: x.id, name: x.name}]
    } AS policy
  `,
    { id }
  );
}

export function listPermissions() {
  return stmt(`
    MATCH (perm:Permission)
    OPTIONAL MATCH (p:Policy)-[:GRANTS]->(perm)
    WITH perm, collect(DISTINCT p {id: p.id, name: p.name}) AS policies
    RETURN perm {
      .*,
      policies: policies
    } AS permission
    ORDER BY permission.action
  `);
}

export function permissionById(id: string) {
  return stmt(
    `
    MATCH (perm:Permission {id: $id})
    OPTIONAL MATCH (p:Policy)-[:GRANTS]->(perm)
    WITH perm, collect(DISTINCT p {id: p.id, name: p.name}) AS policies
    RETURN perm {.*, policies: policies} AS permission
  `,
    { id }
  );
}

/** Policy conflict detection: two policies with opposite effects governing one agent. */
export function policyConflictsForAgent(agentId: string) {
  return stmt(
    `
    MATCH (a:Agent {id: $agentId})-[:GOVERNED_BY]->(p1:Policy), (a)-[:GOVERNED_BY]->(p2:Policy)
    WHERE p1.effect <> p2.effect AND p1.id < p2.id
    RETURN p1 {.*} AS policyA, p2 {.*} AS policyB
    LIMIT 10
  `,
    { agentId }
  );
}
