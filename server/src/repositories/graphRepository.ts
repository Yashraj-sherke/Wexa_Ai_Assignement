import { runRead, runSingle } from "./run.js";
import * as catalog from "../queries/catalogQueries.js";
import * as policyQueries from "../queries/policyQueries.js";
import type { Record as Neo4jRecord } from "neo4j-driver";

/** Catalog-level reads: systems, data assets, resources, permissions, meta labels. */
export const graphRepository = {
  async listSystems() {
    return runRead(catalog.listSystems(), (r: Neo4jRecord) => r.get("system"));
  },
  async listDataAssets() {
    return runRead(catalog.listDataAssets(), (r: Neo4jRecord) => r.get("asset"));
  },
  async listResources() {
    return runRead(catalog.listResources(), (r: Neo4jRecord) => r.get("resource"));
  },
  async listPermissions() {
    return runRead(policyQueries.listPermissions(), (r: Neo4jRecord) => r.get("permission"));
  },
  async listNodeTypes() {
    const rows = await runRead(catalog.listMetaNodeTypes(), (r: Neo4jRecord) => r.get("label") as string);
    return rows;
  },
  async labelCounts() {
    return runRead(catalog.countByLabel(), (r: Neo4jRecord) => ({ label: r.get("label"), count: (r.get("count") as unknown as { toNumber(): number }).toNumber?.() ?? Number(r.get("count")) }));
  },
  async getPermission(id: string) {
    return runSingle(policyQueries.permissionById(id), (r: Neo4jRecord) => r.get("permission"));
  },
};
