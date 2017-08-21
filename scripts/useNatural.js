const { standardDeviation, mean, zScore } = require("simple-statistics");
const { max } = require("lodash");

const { NaturalMatcher } = require("../src/natural_matchers");

module.exports = function useNaturals(robot) {
  return robot.receiveMiddleware((context, next, done) => {
    // logger.info("kha", context);
    const { response } = context;
    const { message } = response;
    if (message.message != null) {
      logger.info(`Ignoring CatchAllMessage`);
      return next(done);
    }
    const { user } = message;
    if (user.id !== 169915916 && robot.adapterName !== "shell") {
      response.reply("Who are you?");
      return done();
    }

    const { text } = message;

    const classifications = classifier.getClassifications(text);
    const numericValues = classifications.map(c => c.value);
    const deviation = standardDeviation(numericValues);
    const meanResult = mean(numericValues);
    classifications.forEach(element => {
      // eslint-disable-next-line no-param-reassign
      element.zScore = zScore(element.value, meanResult, deviation);
    }, this);
    const topScore = max(classifications.map(c => c.zScore));

    const matches = NaturalMatcher.match(text, topScore, classifications);
    if (matches.length === 1) {
      const [Matcher] = matches;
      logger.info(`${text} matched to: `, Matcher.name);
      const matcher = new Matcher(response, robot);
      matcher.execute();
      return done();
    }
    response.send(
      `Possible matches: ${JSON.stringify(matches.map(m => m.name))}`
    );
    return next(done);
  });
};
