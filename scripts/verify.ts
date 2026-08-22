/** Verify seeded graph integrity: node counts, key chains, shared connectors, policy conflicts. Run from controlgraph/server: npx tsx ../scripts/verify.ts */
import { initDriver, closeDriver } from "../server/src/db/driver.js";
import { env } from "../server/src/config/env.js";

async function main() {
  const driver = initDriver(env.uri, env.username, env.password);
  const session = driver.session({ defaultAccessMode: "READ" });
  let failures = 0;
  const check = (name: string, actual: unknown, min: number) => {
    const ok = Number(actual) >= min;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}: ${actual} (expected >= ${min})`);
  };
  try {
    const counts = await session.run(
      `UNWIND $labels AS label MATCH (n) WHERE n.controlGraphDataset = true AND label IN labels(n) RETURN label, count(n) AS count`,
      { labels: ["Coworker", "Workflow", "Agent", "Skill", "Connector", "System", "Resource", "DataAsset", "Policy", "Permission", "ApprovalGate", "Action", "KnowledgeBase", "Document", "User"] }
    );
    const mins: Record<string, number> = {
      Coworker: 5, Workflow: 10, Agent: 15, Skill: 15, Connector: 10, System: 10, Resource: 20,
      DataAsset: 20, Policy: 12, Permission: 20, ApprovalGate: 8, Action: 50, KnowledgeBase: 5, Document: 30, User: 8,
    };
    for (const rec of counts.records) {
      check(`count ${rec.get("label")}`, rec.get("count"), mins[String(rec.get("label"))] ?? 1);
    }

    // ag_triage reaches DataAssets through the graph (triage -> skill -> connector -> system -> resource -> data asset)
    const reach = await session.run(
      `MATCH (:Agent {id:'ag_triage'})-[:USES|CONNECTS_TO|PROVIDES|CAN_ACCESS|CONTAINS*1..6]->(da:DataAsset) RETURN count(DISTINCT da) AS assets`
    );
    check("ag_triage reachable DataAssets", reach.records[0]?.get("assets"), 1);

    // Shared connector (Salesforce used by 3 agents)
    const shared = await session.run(
      `MATCH (c:Connector {id:'conn_salesforce'})<-[:USES]-(:Skill)<-[:USES]-(a:Agent) RETURN count(DISTINCT a) AS agents`
    );
    check("agents sharing Salesforce connector", shared.records[0]?.get("agents"), 3);

    // Policy conflict
    const conflict = await session.run(
      `MATCH (a:Agent {id:'ag_financial_analyst'})-[:GOVERNED_BY]->(p1:Policy), (a)-[:GOVERNED_BY]->(p2:Policy) WHERE p1.effect <> p2.effect AND p1.id < p2.id RETURN count(*) AS conflicts`
    );
    check("policy conflicts on ag_financial_analyst", conflict.records[0]?.get("conflicts"), 1);

    // Excessive permissions agent
    const excessive = await session.run(
      `MATCH (:Agent {id:'ag_refund_agent'})-[:CAN_ACCESS]->(r:Resource) RETURN count(r) AS n`
    );
    check("ag_refund_agent direct CAN_ACCESS resources", excessive.records[0]?.get("n"), 3);

    console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
    if (failures > 0) process.exitCode = 1;
  } finally {
    await session.close();
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Verify failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
