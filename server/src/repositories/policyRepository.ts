import { runRead, runSingle } from "./run.js";
import * as q from "../queries/policyQueries.js";
import type { Record as Neo4jRecord } from "neo4j-driver";

export const policyRepository = {
  async list() {
    return runRead(q.listPolicies(), (r: Neo4jRecord) => r.get("policy"));
  },
  async detail(id: string) {
    return runSingle(q.getPolicy(id), (r: Neo4jRecord) => r.get("policy"));
  },
};
