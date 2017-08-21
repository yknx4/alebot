const path = require("path");
const { writeFile, readFileSync } = require("fs");
const natural = require("natural");

const classifierDataFile = path.join(__dirname, "./classifier_data.natural");
const classificationsData = require("./classifications");

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
      else logger.info("Backing up classifier data");
    });
  }, 10000);

  const classifications = {
    [classificationsData.GITHUB_PR_PLURAL]: [
      "pull requests",
      "get pull requests",
      "show pull requests",
      "fetch pull requests",
      "load pull requests",
      "i want to see pull requests",
      "lets see the pull requests",
      "prs",
      "get prs",
      "show prs",
      "fetch prs",
      "load prs",
      "i want to see prs",
      "lets see the prs",
      "show my prs",
      "get my prs",
      "fetch my prs",
      "my prs",
      "prs that are mine",
      "load my prs",
      "show my prs",
      "get my prs",
      "fetch my prs",
      "my prs",
      "prs that are mine",
      "load my prs",
      "show my pull requests",
      "get my pull requests",
      "fetch my pull requests",
      "my pull requests",
      "pull requests that are mine",
      "load my pull requests",
      "show my pull requests",
      "get my pull requests",
      "fetch my pull requests",
      "my pull requests",
      "pull requests that are mine",
      "load my pull requests"
    ],
    [classificationsData.SHOWER]: [
      "when shower",
      "when did i took a shower?",
      "do i smell?",
      "what is that smell?",
      "tell me when i took a shower",
      "when i showered",
      "should i take a shower?",
      "maybe its time to take a shower"
    ],
    [classificationsData.TOOK_SHOWER]: [
      "i took a shower",
      "finally a shower",
      "shower time",
      "i do not smell bad anymore",
      "i just took a shower",
      "i am clean again"
    ]
  };

  // Object.keys(classifications).forEach(type => {
  //   classifications[type].forEach(text => classifier.addDocument(text, type));
  // });

  // classifier.train();
}
