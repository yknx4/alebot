const bunyan = require('bunyan');

function setupLogger() {
  global.logger = bunyan.createLogger({
    name: 'AleBot',
    src: process.env.NODE_ENV !== 'production',
    streams: [
      {
        level: 'trace',
        stream: process.stdout,
      },
      {
        level: 'error',
        path: './error.log',
      },
      {
        level: 'trace',
        path: './trace.log',
      },
    ],
  });
}
if (global.logger == null) {
  setupLogger();
  global.logger.info('logger initialized');
  process.on('unhandledRejection', error => {
    global.logger.error(error);
  });
}
