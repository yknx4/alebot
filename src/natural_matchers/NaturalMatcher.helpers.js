const natural = require('natural');
const { max } = require('lodash');

const tokenizer = new natural.WordTokenizer();

exports.findFallback = text => m => {
  logger.info(`Testing ${text} with ${m.fallbackRegex}`);
  return m.hasFallback && m.fallbackRegex.test(text);
};

exports.addToIndex = (NaturalMatcher, Children) => keyword => {
  // eslint-disable-next-line no-param-reassign
  NaturalMatcher.index[keyword] = NaturalMatcher.index[keyword] || [];
  NaturalMatcher.index[keyword].push(Children);
};

exports.matcherExists = (NaturalMatcher, text) => classification => {
  const { label } = classification;
  const Matcher = NaturalMatcher.matchers[label];
  const matcherExistsResult = Matcher != null;
  logger.trace(`${label} exists: ${matcherExistsResult}`);
  if (matcherExistsResult && Matcher.hasRegex) {
    const itMatches = Matcher.regex.test(text);
    logger.trace(`${Matcher.name} has regex and matches '${text}': ${itMatches}`);
    return itMatches;
  }
  return matcherExistsResult;
};

exports.hasEnoughScore = (NaturalMatcher, classifications) => classification => {
  const maxScore = max(classifications.map(c => c.zScore));
  const margin = maxScore * 0.3;
  const { zScore, label, value } = classification;
  logger.trace(`${label} score: ${zScore}\nRange: ${maxScore - margin} => ${maxScore}`);
  const enoughScore = zScore >= maxScore - margin;
  logger.trace(`${label} ${value} is within range: ${enoughScore}`);
  return enoughScore;
};

exports.getMatcherClass = NaturalMatcher => ({ label }) => NaturalMatcher.matchers[label];

exports.isSimilarToKeywords = (text, minimumSimilarity = 0.85) => matcher => {
  const { scoped, keywords } = matcher;
  if (scoped) {
    const words = tokenizer.tokenize(text);
    for (let keywordPos = 0; keywordPos < keywords.length; keywordPos += 1) {
      const keyword = keywords[keywordPos];
      for (let wordPos = 0; wordPos < words.length; wordPos += 1) {
        const word = words[wordPos];
        const similarityDegree = natural.JaroWinklerDistance(keyword, word);
        logger.trace(`${word} is ${similarityDegree * 100}% similar to ${keyword}.`);
        if (similarityDegree >= minimumSimilarity) {
          return true;
        }
      }
    }
    return false;
  }
  return true;
};
