import express from "express";
import cors from "cors";
import neo4j from "neo4j-driver";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { env } from "./config/env.js";

export function createApp() {
  const app = express();
  // neo4j-driver represents every Cypher integer as a 64-bit Integer object.
  // Convert it at the HTTP boundary so clients never receive `{low, high}`.
  app.set("json replacer", (_key: string, value: unknown) => {
    if (!neo4j.isInt(value)) return value;
    return value.inSafeRange() ? value.toNumber() : value.toString();
  });
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
