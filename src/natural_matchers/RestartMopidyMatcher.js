const NaturalMatcher = require("./NaturalMatcher");
const { MOPIDY } = require("../classifications");
const NodeSSH = require("node-ssh");
const { readFileSync } = require("fs");

const ssh = new NodeSSH();
const path = require("path");

const rootCommand = (command = "") =>
  `echo "${process.env.ROOT_PASS}" | sudo -kS ${command}`;

const DONE_ANSWERS = [
  "Sorry abou that, it happens.",
  "It's being done ~",
  "gosh, again?"
];

class RestartMopidyMatcher extends NaturalMatcher {
  async execute() {
    const { res } = this;
    const key = readFileSync(path.join(__dirname, "../../.bot_key"), "utf8");
    await ssh.connect({
      host: "telmexwillbe.verymad.net",
      username: "yknx4",
      privateKey: key
    });
    res.reply("Restarting mopidy");
    await ssh.execCommand(rootCommand("service mopidy restart"));
    res.send(res.random(DONE_ANSWERS));
  }
}

RestartMopidyMatcher.description = "Restart home's mopidy server.";
RestartMopidyMatcher.fallbackRegex = /restart this shit/i;

NaturalMatcher.register(RestartMopidyMatcher, MOPIDY);

module.exports = RestartMopidyMatcher;
