import { stmt } from "./statement.js";

export function listCoworkers() {
  return stmt(`
    MATCH (c:Coworker)
    OPTIONAL MATCH (c)-[:CONTAINS]->(w:Workflow)
    OPTIONAL MATCH (c)-[:CONTAINS]->(w2:Workflow)-[:HAS_STEP]->(a:Agent)
    OPTIONAL MATCH (a2:Agent)-[:USES*1..3]->()-[:CONNECTS_TO]->(s:System)
      WHERE (c)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(a2)
    WITH c,
      count(DISTINCT w) AS workflows,
      count(DISTINCT a) AS agents,
      collect(DISTINCT s) AS systems
    OPTIONAL MATCH (c)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(ag:Agent)
    OPTIONAL MATCH (ag)-[:USES*1..8]->(da:DataAsset)
      WHERE da.sensitivity IN ['HIGH','CRITICAL']
    WITH c, workflows, agents, systems, collect(DISTINCT da) AS sensitiveAssets
    OPTIONAL MATCH (c)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(ag2:Agent)-[:CAN_PERFORM]->(act:Action)
      WHERE act.type CONTAINS 'WRITE' OR act.type CONTAINS 'DELETE'
    OPTIONAL MATCH (c)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(ag3:Agent)-[:USES]->(:Skill)-[:USES]->(sharedConnector:Connector)
      WHERE (sharedConnector)<-[:USES]-(:Skill)<-[:USES]-(:Agent) AND ()-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(:Agent)-[:USES]->(:Skill)-[:USES]->(sharedConnector)
    WITH c, workflows, agents, size(systems) AS systemsCount,
      size(sensitiveAssets) AS sensitiveCount,
      count(DISTINCT act) > 0 AS hasDestructive,
      count(DISTINCT sharedConnector) > 0 AS hasSharedConnector
    RETURN c {
      .*,
      workflows: workflows,
      agents: agents,
      systems: systemsCount,
      sensitiveAssets: sensitiveCount,
      hasDestructive: hasDestructive,
      hasSharedConnector: hasSharedConnector,
      owner: coalesce(c.owner, 'Unassigned')
    } AS coworker
    ORDER BY coworker.name
  `);
}

export function getCoworkerDetail(id: string) {
  return stmt(
    `
    MATCH (c:Coworker {id: $id})
    OPTIONAL MATCH (c)-[:CONTAINS]->(w:Workflow)
    OPTIONAL MATCH (c)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(a:Agent)
    OPTIONAL MATCH (ag:Agent)-[:USES*1..6]->(res:Resource)
      WHERE (c)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(ag)
    OPTIONAL MATCH (agp:Agent)-[:GOVERNED_BY]->(p:Policy)
      WHERE (c)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(agp)
    OPTIONAL MATCH (aga:Agent)-[:CAN_PERFORM]->(act:Action)
      WHERE (c)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(aga)
    RETURN c {
      .*,
      owner: coalesce(c.owner, 'Unassigned')
    } AS identity,
    collect(DISTINCT w) AS workflows,
    collect(DISTINCT a) AS agents,
    collect(DISTINCT res) AS accessibleResources,
    collect(DISTINCT p) AS policies,
    [x IN collect(DISTINCT act) | x {.*, timestamp: toString(x.timestamp)}] AS recentActions
  `,
    { id }
  );
}

export function coworkersTouchingDataAsset(dataAssetId: string) {
  return stmt(
    `
    MATCH (c:Coworker)-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(:Agent)-[:USES*1..8]->(da:DataAsset {id: $dataAssetId})
    RETURN DISTINCT c {.*} AS coworker
    LIMIT 100
  `,
    { dataAssetId }
  );
}

export function sensitiveAssetsForCoworker(coworkerId: string) {
  return stmt(
    `
    MATCH (c:Coworker {id: $coworkerId})-[:CONTAINS]->(:Workflow)-[:HAS_STEP]->(:Agent)-[:USES*1..8]->(da:DataAsset)
    WHERE da.sensitivity IN ['HIGH','CRITICAL']
    RETURN DISTINCT da {.*} AS asset
    LIMIT 200
  `,
    { coworkerId }
  );
}
