const path = require("path");
const { writeFile, readFileSync } = require("fs");
const natural = require("natural");

const classifierDataFile = path.join(__dirname, "./classifier_data.natural");

if (global.classifier == null) {
  let classifier;
  try {
    logger.info("Loading NLP data");
    const classifierData = readFileSync(classifierDataFile, "utf8");
    classifier = natural.BayesClassifier.restore(JSON.parse(classifierData));
  } catch (err) {
    logger.error(err);
    classifier = new natural.BayesClassifier();
  }

  global.classifier = classifier;
  logger.info("NLP engine loaded");
  setInterval(() => {
    classifier.train();
    writeFile(classifierDataFile, JSON.stringify(classifier), err => {
      if (err) logger.error(err);
      else logger.trace("Backing up classifier data");
    });
  }, 5000);

  classifier.events.on("trainedWithDocument", obj => {
    logger.info("Trained: ", obj);
  });
}
