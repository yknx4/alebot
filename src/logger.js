const bunyan = require("bunyan");
const bunyanDebugStream = require("bunyan-debug-stream");
const path = require("path");

const config = {
  name: "AleBot",
  src: process.env.NODE_ENV !== "production",
  streams: [
    {
      level: "error",
      path: "./error.log"
    },
    {
      level: "trace",
      path: "./trace.log"
    }
  ]
};

if (process.env.NODE_ENV !== "production") {
  config.streams.push({
    level: "info",
    type: "raw",
    stream: bunyanDebugStream({
      basepath: path.join(__dirname, "../"), // this should be the root folder of your project.
      forceColor: true
    })
  });
  config.serializers = bunyanDebugStream.serializers;
}

function setupLogger() {
  global.logger = bunyan.createLogger(config);
}
if (global.logger == null) {
  setupLogger();
  global.logger.info("logger initialized");
  process.on("unhandledRejection", error => {
    global.logger.error(error);
  });
}
