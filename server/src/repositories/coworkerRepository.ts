import { runRead, runSingle } from "./run.js";
import * as q from "../queries/coworkerQueries.js";
import type { Record as Neo4jRecord } from "neo4j-driver";

export const coworkerRepository = {
  async list() {
    return runRead(q.listCoworkers(), (r: Neo4jRecord) => r.get("coworker"));
  },
  async detail(id: string) {
    return runSingle(q.getCoworkerDetail(id), (r: Neo4jRecord) => ({
      identity: r.get("identity"),
      workflows: r.get("workflows"),
      agents: r.get("agents"),
      systems: [],
      accessibleResources: r.get("accessibleResources"),
      policies: r.get("policies"),
      recentActions: r.get("recentActions"),
    }));
  },
  async sensitiveAssets(coworkerId: string) {
    return runRead(q.sensitiveAssetsForCoworker(coworkerId), (r: Neo4jRecord) => r.get("asset"));
  },
  async coworkersTouchingAsset(dataAssetId: string) {
    return runRead(q.coworkersTouchingDataAsset(dataAssetId), (r: Neo4jRecord) => r.get("coworker"));
  },
};
