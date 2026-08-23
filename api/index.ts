let app: any;

try {
  const { createApp } = require("../server/src/app.js");
  const { initDriver, registerGracefulShutdown } = require("../server/src/db/driver.js");

  initDriver();
  registerGracefulShutdown();
  app = createApp();
} catch (err: any) {
  const express = require("express");
  app = express();
  app.all("*", (req: any, res: any) => {
    res.json({
      success: false,
      error: {
        code: "INIT_FAILED",
        message: err.message,
        stack: err.stack
      }
    });
  });
}

export default app;
module.exports = app;
