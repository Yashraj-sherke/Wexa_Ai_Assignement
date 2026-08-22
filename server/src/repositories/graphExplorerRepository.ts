import { runSingle } from "./run.js";
import { subgraphAround } from "../queries/graphQueries.js";
import type { GraphEdge, GraphNode } from "../types/index.js";

export const graphExplorerRepository = {
  /** Focused subgraph around a node (depth-limited, capped). */
  async subgraph(nodeType: string, nodeId: string, depth: number): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const row = await runSingle(subgraphAround(nodeType, nodeId, depth), (r) => ({
      nodes: r.get("nodes") as GraphNode[],
      edges: r.get("edges") as GraphEdge[],
    }));
    if (!row) return { nodes: [], edges: [] };
    // Deduplicate nodes/edges and cap.
    const nodeMap = new Map<string, GraphNode>();
    for (const n of row.nodes) nodeMap.set(n.id, n);
    const edgeMap = new Map<string, GraphEdge>();
    for (const e of row.edges) edgeMap.set(`${e.source}|${e.target}|${e.type}`, e);
    const nodes = [...nodeMap.values()].slice(0, 300);
    const ids = new Set(nodes.map((n) => n.id));
    const edges = [...edgeMap.values()].filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes, edges };
  },
};
