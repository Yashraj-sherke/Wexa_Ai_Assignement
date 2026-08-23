import { createApp } from "./app.js";
import { initDriver, registerGracefulShutdown } from "./db/driver.js";

initDriver();
registerGracefulShutdown();

const app = createApp();
export default app;
