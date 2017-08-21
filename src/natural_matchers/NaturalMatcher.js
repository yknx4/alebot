const invariant = require("invariant");
const { isRegExp } = require("lodash");

class NaturalMatcher {
  constructor(res, robot) {
    invariant(res, "Should have a response");
    invariant(robot, "Should have a robot");
    this.res = res;
    this.robot = robot;
  }

  static register(matcher, tag) {
    logger.info(`Registering ${matcher.name} as ${tag}`);
    NaturalMatcher.matchers[tag] = matcher;
    const { keywords = [] } = matcher;
    keywords.forEach(keyword => {
      NaturalMatcher.index[keyword] = (NaturalMatcher.index[keyword] || [])
        .push(matcher);
    });
    if (keywords.length === 0) {
      NaturalMatcher.index.$unscoped.push(matcher);
    }
  }

  static get scoped() {
    return this.keywords.length > 0;
  }

  static matches(text) {
    if (!isRegExp(this.regex)) {
      logger.warn("NaturalMatcher should have a regexp if you want matches");
      return null;
    }
    return this.regex.exec(text);
  }

  static get hasRegex() {
    return isRegExp(this.regex);
  }
  get matches() {
    return this.constructor.matches(this.res.match.text);
  }

  // eslint-disable-next-line no-unused-vars
  execute() {
    throw new Error(`execute not implemented in ${this.constructor.name}`);
  }
}

NaturalMatcher.matchers = {};
NaturalMatcher.index = {
  $unscoped: []
};

NaturalMatcher.match = function match(text, maxScore, classifications) {
  const margin = maxScore * 0.25;
  return classifications
    .filter(c => {
      const enoughScore = c.zScore >= maxScore - margin;
      logger.info(`${c.label} ${c.value} is within range: ${enoughScore}`);
      return enoughScore;
    })
    .filter(c => {
      const matcherExists = NaturalMatcher.matchers[c.label] != null;
      logger.info(`${c.label} exists: ${matcherExists}`);
      return matcherExists;
    })
    .map(c => NaturalMatcher.matchers[c.label])
    .filter(m => {
      if (m.hasRegex) {
        const itMatches = m.matches(text) != null;
        logger.info(`${m.name} has regex and matches: ${itMatches}`);
        return itMatches;
      }
      logger.info(`${m.name} does not have a regex`);
      return true;
    });
};

module.exports = NaturalMatcher;
