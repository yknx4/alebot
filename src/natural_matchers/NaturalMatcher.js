const invariant = require("invariant");
const { isRegExp, values, isEmpty } = require("lodash");
const {
  findFallback,
  addToIndex,
  matcherExists,
  hasEnoughScore,
  getMatcherClass,
  matchesRegex,
  isSimilarToKeywords
} = require("./NaturalMatcher.helpers");

class NaturalMatcher {
  constructor(res, robot, fallback = false) {
    invariant(res, "Should have a response");
    invariant(robot, "Should have a robot");
    this.res = res;
    this.robot = robot;
    this.fallback = fallback;
  }

  static register(matcher, tag) {
    logger.info(`Registering ${matcher.name} as ${tag}`);
    NaturalMatcher.matchers[tag] = matcher;
    // eslint-disable-next-line no-param-reassign
    matcher.tag = tag;
    const { keywords = [] } = matcher;
    keywords.forEach(addToIndex(NaturalMatcher, matcher));
    if (isEmpty(keywords)) {
      NaturalMatcher.index.$unscoped.push(matcher);
    }
  }

  static get scoped() {
    return this.keywords.length > 0;
  }

  static matches(text) {
    if (!this.hasRegex) {
      logger.warn("NaturalMatcher should have a regexp if you want matches");
      return null;
    }
    return this.regex.exec(text);
  }

  static fallbackMatches(text) {
    if (!this.hasFallback) {
      logger.warn(
        "NaturalMatcher should have a fallback regexp if you want matches"
      );
      return null;
    }
    return this.regex.exec(text);
  }

  static get hasRegex() {
    return isRegExp(this.regex);
  }

  static get hasFallback() {
    return isRegExp(this.fallbackRegex);
  }

  get message() {
    const { fallback, res: { message } } = this;
    return fallback ? message.message : message;
  }

  get text() {
    const { message } = this;
    return message.text.replace(this.robot.name, "").trim();
  }

  get matches() {
    const { fallback, constructor, text } = this;
    const matcherFn = fallback
      ? constructor.fallbackMatches
      : constructor.matches;
    return matcherFn.call(constructor, text);
  }

  // eslint-disable-next-line no-unused-vars
  async execute() {
    throw new Error(`execute not implemented in ${this.constructor.name}`);
  }
}

NaturalMatcher.matchers = {};
NaturalMatcher.index = {
  $unscoped: []
};
NaturalMatcher.keywords = [];
NaturalMatcher.description = "Missing Description";

NaturalMatcher.findLegacyMatcher = function findLegacyMatcher(text) {
  logger.info(`Finding legacy matcher for ${text}`);
  const matchers = values(NaturalMatcher.matchers);
  return matchers.find(findFallback(text));
};

NaturalMatcher.match = function match(text, maxScore, classifications) {
  return classifications
    .filter(matcherExists(NaturalMatcher))
    .filter(hasEnoughScore(NaturalMatcher, maxScore))
    .map(getMatcherClass(NaturalMatcher))
    .filter(matchesRegex(text))
    .filter(isSimilarToKeywords(text, this.minimumSimilarity));
};

module.exports = NaturalMatcher;
