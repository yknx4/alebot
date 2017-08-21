const bunyan = require("bunyan");

function setupLogger() {
  global.logger = bunyan.createLogger({
    name: "AleBot",
    src: process.env.NODE_ENV !== "production",
    streams: [
      {
        level: "info",
        stream: process.stdout
      },
      {
        level: "error",
        path: "./error.log"
      }
    ]
  });
}
if (global.logger == null) {
  setupLogger();
  global.logger.info("logger initialized");
}
