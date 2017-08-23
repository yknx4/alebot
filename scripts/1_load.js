require('../src/logger');
require('../src/classifier');

module.exports = robot => {
  robot.logger = global.logger;
  robot.logger.warning = robot.logger.warn;
};
