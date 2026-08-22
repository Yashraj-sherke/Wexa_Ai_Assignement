import { stmt } from "./statement.js";

export function listSystems() {
  return stmt(`
    MATCH (s:System)
    OPTIONAL MATCH (s)-[:PROVIDES]->(r:Resource)
    WITH s, count(DISTINCT r) AS resourceCount
    RETURN s {.*, resources: resourceCount} AS system
    ORDER BY system.name
  `);
}

export function listDataAssets() {
  return stmt(`
    MATCH (da:DataAsset)
    OPTIONAL MATCH (r:Resource)-[:CONTAINS]->(da)
    RETURN da {.*, resource: r {id: r.id, name: r.name}} AS asset
    ORDER BY da.sensitivity DESC, da.name
  `);
}

export function listResources() {
  return stmt(`
    MATCH (r:Resource)
    OPTIONAL MATCH (r)-[:CONTAINS]->(da:DataAsset)
    WITH r, collect(DISTINCT da {id: da.id, name: da.name, sensitivity: da.sensitivity}) AS dataAssets
    RETURN r {.*, dataAssets: dataAssets} AS resource
    ORDER BY r.name
  `);
}

export function listMetaNodeTypes() {
  return stmt(`
    CALL db.labels() YIELD label
    RETURN label
    ORDER BY label
  `);
}

export function countByLabel() {
  return stmt(`
    MATCH (n)
    WITH labels(n) AS ls
    UNWIND ls AS l
    RETURN l AS label, count(*) AS count
    ORDER BY count DESC
  `);
}
