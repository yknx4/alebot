module.exports = robot => {
  robot.hear(/classify (.*)/i, async res => {
    logger.info(`Matched classify`, res.match);
    const result = classifier.getClassifications(res.match[1]);
    logger.info("Classified as: ", result);
    res.send(JSON.stringify(result));
  });
};
