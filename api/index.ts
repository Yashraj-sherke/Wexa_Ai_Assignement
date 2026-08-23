import { createApp } from "../server/src/app.js";
import { initDriver, registerGracefulShutdown } from "../server/src/db/driver.js";

initDriver();
registerGracefulShutdown();

const app = createApp();
export default app;
