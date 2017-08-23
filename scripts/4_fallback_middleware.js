const { NaturalMatcher } = require("../src/natural_matchers");

module.exports = robot =>
  robot.receiveMiddleware(async (context, next, done) => {
    const { response } = context;
    const { message } = response;
    if (message.message != null) {
      logger.info(`Got CatchAllMessage, fallback`);
      const Matcher = NaturalMatcher.findLegacyMatcher(message.message.text);
      if (Matcher == null) {
        logger.info(`No fallback matches CatchAllMessage, ignoring.`);
        return next(done);
      }
      logger.info(`Legacy matcher found: ${Matcher.name}`);
      const matcher = new Matcher(response, robot, true);
      await matcher.execute();
      return done();
    }
    return next(done);
  });
