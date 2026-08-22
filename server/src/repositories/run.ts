import type { Statement } from "../queries/statement.js";
import type { Record as Neo4jRecord } from "neo4j-driver";
import { withReadSession } from "../db/session.js";

export async function runRead<T = unknown>(statement: Statement, extractor: (rec: Neo4jRecord) => T): Promise<T[]> {
  return withReadSession(async (session) => {
    const result = await session.run(statement.cypher, statement.params);
    // Some Bolt-compatible graph engines return one aggregate row with a null
    // projection when the leading MATCH has no results. A list endpoint should
    // expose that as an empty list, never `[null]`.
    return result.records
      .map(extractor)
      .filter((value): value is NonNullable<T> => value !== null && value !== undefined);
  });
}

export async function runSingle<T>(statement: Statement, extractor: (rec: Neo4jRecord) => T): Promise<T | null> {
  const rows = await runRead(statement, extractor);
  return rows.length > 0 ? rows[0] : null;
}
