/** Clear only the ControlGraph dataset. Run from controlgraph/server: npx tsx ../scripts/reset.ts */
import { initDriver, closeDriver } from "../server/src/db/driver.js";
import { env } from "../server/src/config/env.js";

async function main() {
  const driver = initDriver(env.uri, env.username, env.password);
  const session = driver.session({ defaultAccessMode: "WRITE" });
  try {
    const result = await session.run(
      `MATCH (n) WHERE n.controlGraphDataset = true DETACH DELETE n RETURN count(n) AS deleted`
    );
    console.log(`Deleted ${result.records[0]?.get("deleted")} nodes.`);
  } finally {
    await session.close();
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Reset failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
