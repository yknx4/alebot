const NaturalMatcher = require("./NaturalMatcher");
const { SHOWER } = require("../classifications");
const { distanceInWordsToNow, parse } = require("date-fns");

const NO_SHOWER_ANSWERS = [
  "You haven't take a shower yet... Smelly...",
  "What do you mean... like with water?",
  "You took a shower first time we met",
  "hahahahaha... Don't you smell the answer?"
];

class ShowerMatcher extends NaturalMatcher {
  async execute() {
    const { res, robot } = this;
    const lastShower = robot.brain.get("lastShower");
    if (lastShower == null) {
      return res.send(res.random(NO_SHOWER_ANSWERS));
    }
    const lastShowerTime = parse(lastShower);
    const timeSinceShower = distanceInWordsToNow(lastShowerTime, {
      addSuffix: true,
      includeSeconds: true
    });
    return res.send(`You took a shower ${timeSinceShower}.`);
  }
}

ShowerMatcher.keywords = ["Shower"];
ShowerMatcher.description = "Get last time you took a shower.";
ShowerMatcher.fallbackRegex = /last(.*)shower/i;

NaturalMatcher.register(ShowerMatcher, SHOWER);

module.exports = ShowerMatcher;
