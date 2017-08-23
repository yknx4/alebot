const natural = require("natural");
const invariant = require("invariant");

const tokenizer = new natural.WordTokenizer();

exports.findFallback = text => m => {
  logger.info(`Testing ${text} with ${m.fallbackRegex}`);
  return m.hasFallback && m.fallbackRegex.test(text);
};

exports.addToIndex = (NaturalMatcher, Children) => keyword => {
  // eslint-disable-next-line no-param-reassign
  NaturalMatcher.index[keyword] = (NaturalMatcher.index[keyword] || [])
    .push(Children);
};

exports.matcherExists = NaturalMatcher => classification => {
  const { label } = classification;
  const matcherExistsResult = NaturalMatcher.matchers[label] != null;
  logger.trace(`${label} exists: ${matcherExistsResult}`);
  return matcherExistsResult;
};

exports.hasEnoughScore = (NaturalMatcher, maxScore) => classification => {
  const margin = maxScore * 0.25;
  const { zScore, label, value } = classification;
  const enoughScore = zScore >= maxScore - margin;
  logger.trace(`${label} ${value} is within range: ${enoughScore}`);
  return enoughScore;
};

exports.getMatcherClass = NaturalMatcher => ({ label }) =>
  NaturalMatcher.matchers[label];

exports.matchesRegex = text => matcher => {
  invariant(matcher, "Matcher should be defined");
  logger.info(matcher.name);
  const { hasRegex, matches, name } = matcher;
  if (hasRegex) {
    const itMatches = matches.bind(matcher)(text) != null;
    logger.trace(`${name} has regex and matches: ${itMatches}`);
    return itMatches;
  }
  logger.trace(`${name} does not have a regex`);
  return true;
};

exports.isSimilarToKeywords = (text, minimumSimilarity = 0.7) => matcher => {
  const { scoped, keywords } = matcher;
  if (scoped) {
    const words = tokenizer.tokenize(text);
    for (let keywordPos = 0; keywordPos < keywords.length; keywordPos += 1) {
      const keyword = keywords[keywordPos];
      for (let wordPos = 0; wordPos < words.length; wordPos += 1) {
        const word = words[wordPos];
        const similarityDegree = natural.JaroWinklerDistance(keyword, word);
        logger.trace(
          `${word} is ${similarityDegree * 100}% similar to ${keyword}.`
        );
        if (similarityDegree >= minimumSimilarity) {
          return true;
        }
      }
    }
    return false;
  }
  return true;
};
