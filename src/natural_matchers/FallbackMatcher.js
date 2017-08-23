const { isRegExp } = require('lodash');
const invariant = require('invariant');
const NaturalMatcher = require('./NaturalMatcher');

class FallbackMatcher extends NaturalMatcher {
  constructor(res, robot) {
    super(res, robot, true);
  }
  static get hasRegex() {
    invariant(this.regex == null, 'A fallback matcher never has regex');
    return false;
  }

  static get hasFallback() {
    invariant(isRegExp(this.fallbackRegex), 'A fallback matcher always haves a fallback regex');
    return true;
  }

  static register(matcher) {
    logger.info(`Registering ${matcher.name} as fallback matcher.`);
    NaturalMatcher.matchers[matcher.name] = matcher;
    // eslint-disable-next-line no-param-reassign
    matcher.tag = matcher.name;
  }
}

module.exports = FallbackMatcher;
