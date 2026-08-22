import type { Session } from "neo4j-driver";
import { getDriver, toDbError } from "./driver.js";

export async function withReadSession<T>(fn: (session: Session) => Promise<T>): Promise<T> {
  const session = getDriver().session({ defaultAccessMode: "READ" });
  try {
    return await fn(session);
  } catch (err) {
    throw toDbError(err);
  } finally {
    await session.close().catch(() => undefined);
  }
}

export async function withWriteSession<T>(fn: (session: Session) => Promise<T>): Promise<T> {
  const session = getDriver().session({ defaultAccessMode: "WRITE" });
  try {
    return await fn(session);
  } catch (err) {
    throw toDbError(err);
  } finally {
    await session.close().catch(() => undefined);
  }
}
