const FallbackMatcher = require("./FallbackMatcher");
const classifications = require("../classifier_seed_data");

class TrainMatcher extends FallbackMatcher {
  execute() {
    const { res } = this;
    Object.keys(classifications).forEach(type => {
      classifications[type].forEach(text => classifier.addDocument(text, type));
    });
    classifier.train();
    res.reply("Done!");
  }
}

TrainMatcher.fallbackRegex = /retrain natural language/i;
FallbackMatcher.register(TrainMatcher);

module.exports = TrainMatcher;
