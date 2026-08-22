import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initDriver, registerGracefulShutdown } from "./db/driver.js";

initDriver();
registerGracefulShutdown();

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`[controlgraph] API listening on http://localhost:${env.port}`);
});

process.on("SIGINT", () => server.close());
process.on("SIGTERM", () => server.close());

export default app;
