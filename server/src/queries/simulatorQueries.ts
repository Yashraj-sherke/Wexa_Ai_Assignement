import { stmt } from "./statement.js";

/**
 * Permission scope conventions (set by seed data):
 *   "resource:<resourceId>" -> a single resource
 *   "system:<systemId>"     -> all resources provided by a system
 *   "resource:*" / "*"      -> every resource (broad scope)
 */
export function permissionScopeResources(scope: string, limit = 300) {
  return stmt(
    `
    MATCH (r:Resource)
    WHERE
      ($scope = 'resource:*' OR $scope = '*') OR
      ($scope STARTS WITH 'resource:' AND r.id = substring($scope, 9)) OR
      ($scope STARTS WITH 'system:' AND EXISTS {
        MATCH (:System {id: substring($scope, 7)})-[:PROVIDES]->(r)
      })
    RETURN DISTINCT r {.*} AS resource
    LIMIT $limit
  `,
    { scope, limit }
  );
}

/** Hypothetical paths (no mutation): how would the agent reach granted resources. */
export function hypotheticalPaths(agentId: string, limit = 100) {
  return stmt(
    `
    MATCH path = (a:Agent {id: $agentId})-[r:USES|CONNECTS_TO|PROVIDES|CONTAINS*1..6]->(res:Resource)
    RETURN DISTINCT res {.*} AS resource,
      [n IN nodes(path) | n {id: n.id, type: labels(n)[0], name: coalesce(n.name, n.title, n.id)}] AS nodes,
      [e IN relationships(path) | {source: startNode(e).id, target: endNode(e).id, type: type(e)}] AS edges
    LIMIT $limit
  `,
    { agentId, limit }
  );
}

/** Data assets contained in the given resources (for after-state computation). */
export function dataAssetsInResources() {
  return stmt(`
    MATCH (r:Resource)-[:CONTAINS]->(da:DataAsset)
    RETURN r.id AS resourceId, da {.*} AS asset
  `);
}

/** Systems providing the given resources. */
export function systemsProvidingResources() {
  return stmt(`
    MATCH (s:System)-[:PROVIDES]->(r:Resource)
    RETURN r.id AS resourceId, s {.*} AS system
  `);
}
