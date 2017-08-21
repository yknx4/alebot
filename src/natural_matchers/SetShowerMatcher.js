const NaturalMatcher = require("./NaturalMatcher");
const { TOOK_SHOWER } = require("../classifications");

const SHOWERED_ANSWERS = [
  "Registered!",
  "Gotcha!",
  "You needed some water already..."
];

class SetShowerMatcher extends NaturalMatcher {
  execute() {
    const { res, robot } = this;
    res.reply(res.random(SHOWERED_ANSWERS));
    robot.brain.set("lastShower", new Date().toISOString());
  }
}

SetShowerMatcher.keywords = ["shower"];
SetShowerMatcher.regex = /.*[^\?]$/i;

NaturalMatcher.register(SetShowerMatcher, TOOK_SHOWER);

module.exports = SetShowerMatcher;
