const invariant = require('invariant');
const { isRegExp } = require('lodash');
const natural = require('natural');

const tokenizer = new natural.WordTokenizer();

class NaturalMatcher {
  constructor(res, robot) {
    invariant(res, 'Should have a response');
    invariant(robot, 'Should have a robot');
    this.res = res;
    this.robot = robot;
  }

  static register(matcher, tag) {
    logger.info(`Registering ${matcher.name} as ${tag}`);
    NaturalMatcher.matchers[tag] = matcher;
    matcher.tag = tag;
    const { keywords = [] } = matcher;
    keywords.forEach(keyword => {
      NaturalMatcher.index[keyword] = (NaturalMatcher.index[keyword] || []).push(matcher);
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
      logger.warn('NaturalMatcher should have a regexp if you want matches');
      return null;
    }
    return this.regex.exec(text);
  }

  static get hasRegex() {
    return isRegExp(this.regex);
  }

  get text() {
    return this.res.message.text;
  }

  get matches() {
    return this.constructor.matches(this.text);
  }

  // eslint-disable-next-line no-unused-vars
  async execute() {
    throw new Error(`execute not implemented in ${this.constructor.name}`);
  }
}

NaturalMatcher.matchers = {};
NaturalMatcher.index = {
  $unscoped: [],
};
NaturalMatcher.keywords = [];
NaturalMatcher.description = 'Missing Description';

NaturalMatcher.match = function match(text, maxScore, classifications) {
  const margin = maxScore * 0.25;
  const keywordSimilarity = this.keywordSimilarityMargin || 0.7;
  return classifications
    .filter(c => {
      const matcherExists = NaturalMatcher.matchers[c.label] != null;
      logger.trace(`${c.label} exists: ${matcherExists}`);
      return matcherExists;
    })
    .filter(c => {
      const enoughScore = c.zScore >= maxScore - margin;
      logger.trace(`${c.label} ${c.value} is within range: ${enoughScore}`);
      return enoughScore;
    })
    .map(c => NaturalMatcher.matchers[c.label])
    .filter(m => {
      if (m.hasRegex) {
        const itMatches = m.matches(text) != null;
        logger.trace(`${m.name} has regex and matches: ${itMatches}`);
        return itMatches;
      }
      logger.trace(`${m.name} does not have a regex`);
      return true;
    })
    .filter(m => {
      if (m.scoped) {
        const keywords = m.keywords;
        const words = tokenizer.tokenize(text);
        for (let keywordPos = 0; keywordPos < keywords.length; keywordPos++) {
          const keyword = keywords[keywordPos];
          for (let wordPos = 0; wordPos < words.length; wordPos++) {
            const word = words[wordPos];
            const similarityDegree = natural.JaroWinklerDistance(keyword, word);
            logger.trace(`${word} is ${similarityDegree * 100}% similar to ${keyword}.`);
            if (similarityDegree >= keywordSimilarity) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    });
};

module.exports = NaturalMatcher;
