import neo4j, { type Driver } from "neo4j-driver";
import { env } from "../config/env.js";

let driver: Driver | null = null;

/** Distinguishable marker for connectivity/driver failures. */
export class DbUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DbUnavailableError";
  }
}

export function initDriver(uri = env.uri, username = env.username, password = env.password): Driver {
  if (!driver) {
    const d = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 50,
    });
    driver = d;
  }
  return driver;
}

export function getDriver(): Driver {
  if (!driver) initDriver();
  return driver as Driver;
}

export async function verifyConnectivity(): Promise<void> {
  await getDriver().verifyConnectivity();
}

export async function checkHealth(): Promise<"connected" | "unavailable"> {
  try {
    await getDriver().getServerInfo();
    return "connected";
  } catch {
    return "unavailable";
  }
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export function registerGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`[controlgraph] received ${signal}, closing driver...`);
    await closeDriver();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

/** Wrap driver/session errors into a sanitized DbUnavailableError. */
export function toDbError(err: unknown): DbUnavailableError {
  const detail = err instanceof Error ? err.message : String(err);
  // Never leak credentials/urls in messages.
  const sanitized = detail
    .replace(/bolt:\/\/[^\s]+/gi, "bolt://***")
    .replace(/neo4j:\/\/[^\s]+/gi, "neo4j://***")
    .replace(/password[^\s]*/gi, "password=***");
  return new DbUnavailableError(sanitized.slice(0, 300));
}
