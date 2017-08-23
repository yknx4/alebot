const { NaturalMatcher } = require('../src/natural_matchers');

module.exports = robot =>
  robot.receiveMiddleware(async (context, next, done) => {
    logger.warn(`FallbackMiddleware working ~`);
    const { response } = context;
    const { message } = response;
    const isCatchAll = message.message != null;
    const text = isCatchAll ? message.message.text : message.text;
    logger.info(`Finding fallback matcher`);
    const Matcher = NaturalMatcher.findLegacyMatcher(text);
    if (Matcher == null) {
      logger.info(`No fallback matches CatchAllMessage, ignoring.`);
      return next(done);
    }
    logger.info(`Legacy matcher found: ${Matcher.name}`);
    const matcher = new Matcher(response, robot, true);
    await matcher.execute();
    return done();
  });
