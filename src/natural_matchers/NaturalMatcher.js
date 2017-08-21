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

  matches() {
    invariant(
      isRegExp(this.regex),
      "NaturalMatcher should have a regexp if you want matches"
    );
    return this.regex.exec(this.res.match.text);
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
  return classifications.filter(c => c.zScore >= maxScore - margin);
};

module.exports = NaturalMatcher;
