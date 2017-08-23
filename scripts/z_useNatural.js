const { standardDeviation, mean, zScore } = require("simple-statistics");
const { max, isEmpty } = require("lodash");

const { NaturalMatcher } = require("../src/natural_matchers");

module.exports = function useNaturals(robot) {
  return robot.receiveMiddleware(async (context, next, done) => {
    const { response } = context;
    const { message } = response;
    logger.warn(message);
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
    const { user } = message;
    if (user.id !== 169915916 && robot.adapterName !== "shell") {
      response.reply("Who are you?");
      return done();
    }

    const { text: baseText } = message;
    const text = baseText.replace(robot.name, "").trim();
    const classifications = classifier.getClassifications(text);
    const numericValues = classifications.map(c => c.value);
    if (isEmpty(numericValues)) {
      logger.warn(`No training available, skipping.`);
      return next(done);
    }
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
      await matcher.execute();
      return done();
    }
    if (matches.length > 0) {
      // response.send(`Possible matches: ${JSON.stringify(matches.map(m => m.name))}`);
      const messageTitle = `Your message is a bit ambigous.\n Did you mean to...\n`;
      if (robot.adapterName === "telegram") {
        response.envelope.telegram = {
          reply_markup: {
            keyboard: [matches.map(m => m.description)],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        };
        response.send(messageTitle);
      } else {
        const messageTemplate = `toBeDefined`;
        response.send(messageTitle + messageTemplate);
      }
      robot.emit(
        "expectResponse",
        response.message.user.id,
        nestedRes => {
          const { envelope } = nestedRes;
          envelope.telegram = {
            reply_markup: { remove_keyboard: true }
          };
          const cleanText = nestedRes.message.text
            .replace(robot.name, "")
            .trim();
          const SelectedOption = matches.find(m => m.description === cleanText);
          if (SelectedOption) {
            const matcher = new SelectedOption(nestedRes, robot);
            classifier.addDocument(cleanText, matcher.tag);
            classifier.addDocument(text, matcher.tag);
            classifier.train();
            matcher.execute();
          } else {
            nestedRes.send("so, any of those.... sorry.");
          }
          logger.info(
            `expected response: ${cleanText}: ${SelectedOption != null}`
          );
        },
        { ttl: 0 }
      );
      return done();
    }

    return next(done);
  });
};
