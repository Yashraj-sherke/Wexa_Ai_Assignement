import { runSingle } from "./run.js";
import * as q from "../queries/actionQueries.js";
import { withReadSession } from "../db/session.js";
import type { Paginated } from "../types/index.js";

export const actionRepository = {
  async list(limit: number, offset: number, status?: string): Promise<Paginated<unknown>> {
    const s = q.listActions(limit, offset, status);
    return withReadSession(async (session) => {
      const items = (await session.run(s.cypher, s.params)).records.map((r) => r.get("action"));
      const countRes = await session.run(s.countCypher, s.params);
      const total = Number(countRes.records[0]?.get("total") ?? 0);
      return { items, total, limit, offset };
    });
  },
  async detail(id: string) {
    return runSingle(q.getAction(id), (r) => r.get("action"));
  },
  async trace(id: string) {
    return runSingle(q.actionTrace(id), (r) => ({
      action: r.get("action"),
      nodes: r.get("pathNodes"),
      edges: r.get("pathEdges"),
    }));
  },
};
