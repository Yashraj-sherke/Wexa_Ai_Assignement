import { stmt } from "./statement.js";

export function listActions(limit: number, offset: number, status?: string) {
  const statusFilter = status ? "WHERE act.status = $status" : "";
  return {
    cypher: `
      MATCH (act:Action)
      ${statusFilter}
      OPTIONAL MATCH (a:Agent)-[:CAN_PERFORM]->(act)
      RETURN act {.*, agent: a.name, agentId: a.id, timestamp: toString(act.timestamp)} AS action
      ORDER BY action.timestamp DESC
      SKIP $offset LIMIT $limit
    `,
    countCypher: `
      MATCH (act:Action) ${statusFilter} RETURN count(act) AS total
    `,
    params: { limit, offset, ...(status ? { status } : {}) },
  };
}

export function getAction(id: string) {
  return stmt(
    `
    MATCH (act:Action {id: $id})
    OPTIONAL MATCH (a:Agent)-[:CAN_PERFORM]->(act)
    RETURN act {.*, agent: a.name, agentId: a.id, timestamp: toString(act.timestamp)} AS action
  `,
    { id }
  );
}

/** Decision trace: Action -[:EXECUTED_BY|AUTHORIZED_BY|ACCESSED*1..5]-> target. */
export function actionTrace(id: string) {
  return stmt(
    `
    MATCH (act:Action {id: $id})
    OPTIONAL MATCH path = (act)-[:EXECUTED_BY|AUTHORIZED_BY|ACCESSED*1..5]->(target)
    RETURN act {.*, timestamp: toString(act.timestamp)} AS action,
      [n IN nodes(path) | n {id: n.id, type: labels(n)[0], name: coalesce(n.name, n.title, n.id), properties: properties(n)}] AS pathNodes,
      [e IN relationships(path) | {source: startNode(e).id, target: endNode(e).id, type: type(e)}] AS pathEdges
    LIMIT 50
  `,
    { id }
  );
}

export function resourcesAccessedByAction(id: string) {
  return stmt(
    `
    MATCH (act:Action {id: $id})-[:ACCESSED]->(r)
    RETURN r {.*, type: labels(r)[0]} AS target
    LIMIT 50
  `,
    { id }
  );
}
