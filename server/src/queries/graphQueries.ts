import { stmt } from "./statement.js";

/** Focused subgraph around a node, capped (default depth 2, max 300 nodes). */
export function subgraphAround(nodeType: string, nodeId: string, depth: number, limit = 300) {
  return stmt(
    `
    MATCH (center)
    WHERE labels(center)[0] = $nodeType AND center.id = $nodeId
    CALL {
      WITH center
      MATCH path = (center)-[r]-(other)
      WHERE size([n IN nodes(path) | 1]) <= $depth + 1
      RETURN path
      LIMIT $limit
    }
    WITH collect(path) AS paths
    UNWIND paths AS p
    UNWIND nodes(p) AS n
    WITH collect(DISTINCT n) AS ns, paths
    UNWIND paths AS p2
    UNWIND relationships(p2) AS rel
    RETURN ns,
      [x IN ns | x {id: x.id, type: labels(x)[0], label: coalesce(x.name, x.title, x.id), properties: properties(x)}] AS nodes,
      collect(DISTINCT {source: startNode(rel).id, target: endNode(rel).id, type: type(rel)}) AS edges
  `,
    { nodeType, nodeId, depth, limit }
  );
}
