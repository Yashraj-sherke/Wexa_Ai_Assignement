import { describe, it, expect, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import { closeDriver, initDriver } from "../src/db/driver.js";

// supertest is not a dependency; fall back to raw http listener.
import http from "node:http";

const app = createApp();

function listen(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function get(server: http.Server, path: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as import("node:net").AddressInfo;
    http
      .get({ host: "127.0.0.1", port: addr.port, path }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data });
          }
        });
      })
      .on("error", reject);
  });
}

describe("GET /api/health", () => {
  it("returns ok and never throws, even without a live database", async () => {
    initDriver(); // no live DB required; health must degrade gracefully
    const server = await listen();
    try {
      const res = await get(server, "/api/health");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ok");
      expect(["connected", "unavailable"]).toContain(res.body.data.database);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
      await closeDriver();
    }
  });

  it("returns 404 envelope for unknown routes", async () => {
    const server = await listen();
    try {
      const res = await get(server, "/api/does-not-exist");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});
