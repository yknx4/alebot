const FallbackMatcher = require("./FallbackMatcher");

class ClassifyMatcher extends FallbackMatcher {
  get classifiableText() {
    return this.matches[1];
  }
  execute() {
    const { res, classifiableText } = this;
    const result = classifier.getClassifications(classifiableText);
    logger.info(`Classified ${classifiableText} as: `, result);
    res.send(JSON.stringify(result, null, 2));
  }
}

ClassifyMatcher.fallbackRegex = /classify (.*)/i;
FallbackMatcher.register(ClassifyMatcher);

module.exports = ClassifyMatcher;
