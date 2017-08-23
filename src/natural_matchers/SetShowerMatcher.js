const NaturalMatcher = require('./NaturalMatcher');
const { TOOK_SHOWER } = require('../classifications');

const SHOWERED_ANSWERS = ['Registered!', 'Gotcha!', 'You needed some water already...'];

class SetShowerMatcher extends NaturalMatcher {
  async execute() {
    const { res, robot } = this;
    res.reply(res.random(SHOWERED_ANSWERS));
    robot.brain.set('lastShower', new Date().toISOString());
  }
}

SetShowerMatcher.keywords = ['shower', 'bath', 'clean'];
SetShowerMatcher.regex = /^((?!\?).)*$/i;
SetShowerMatcher.fallbackRegex = /took(.*)shower?[^\?]$/i;
SetShowerMatcher.description = 'Update last time you took a shower.';

NaturalMatcher.register(SetShowerMatcher, TOOK_SHOWER);

module.exports = SetShowerMatcher;
