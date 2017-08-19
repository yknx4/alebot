require("dotenv").config();
const GitHubApi = require("github");
const githubParser = require("parse-github-url");
const { reduce, range } = require("lodash");

const user = process.env.GITHUB_USER;

const github = new GitHubApi({
  // optional
  debug: false,
  protocol: "https",
  host: "api.github.com", // should be api.github.com for GitHub
  pathPrefix: "", // for some GHEs; none for GitHub
  headers: {
    "user-agent": "AleBot", // GitHub is happy with a unique user agent
    Authorization: `token ${process.env.GITHUB_TOKEN}`
  },
  family: 6,
  followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
  timeout: 5000
});

const linkParser = /<.*page=(\d)>; rel="(.*)"/i;

function getLastPage(meta) {
  let links = meta.link.split(",").map(l => {
    const match = linkParser.exec(l) || [];
    const [input, link, rel] = match;
    return [rel, link];
  });
  links = reduce(
    links,
    (a, e) => {
      const [key, value] = e || [];
      a[key] = value;
      return a;
    },
    {}
  );
  return parseInt(links.last, 10) || 1;
}

module.exports = jade => {
  jade.hear(/(prs?|pull requests?) (for|in) (\w*\/\w*|\w*)/i, async res => {
    const fullRepo = res.match[3].split("/");
    const repo = fullRepo[1] || fullRepo[0];
    const owner = fullRepo[0] !== repo ? fullRepo[0] : user;
    if (repo == null) return;
    let page = 1;

    res.send(`Loading *Pull Requests* for ${owner}/${repo}`);
    try {
      const prs = await github.pullRequests.getAll({
        owner,
        per_page: 100,
        repo,
        page
      });

      const template = pr =>
        `- _${pr.user.login}_ *#${pr.number}* [${pr.title}](${pr.url}). ${pr
          .requested_reviewers.length > 0
          ? "Reviewers: " +
            pr.requested_reviewers.map(u => `_${u.login}_`).join(", ")
          : ""}`;

      let message = prs.data.map(template);
      message = `These are the open *Pull Requests* on ${repo}\n${message.join(
        "\n"
      )}`;

      res.send(message);
    } catch (error) {
      res.send(`Cannot get pull requests for ${owner}/${repo}`);
    }
  });
  // robot.heardd /badger/i, (res) ->
  //   res.send "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS"
  //
  // robot.respond /open the (.*) doors/i, (res) ->
  //   doorType = res.match[1]
  //   if doorType is "pod bay"
  //     res.reply "I'm afraid I can't let you do that."
  //   else
  //     res.reply "Opening //{doorType} doors"
  //
  // robot.hear /I like pie/i, (res) ->
  //   res.emote "makes a freshly baked pie"
  //
  // lulz = ['lol', 'rofl', 'lmao']
  //
  // robot.respond /lulz/i, (res) ->
  //   res.send res.random lulz
  //
  // robot.topic (res) ->
  //   res.send "//{res.message.text}? That's a Paddlin'"
  //
  //
  // enterReplies = ['Hi', 'Target Acquired', 'Firing', 'Hello friend.', 'Gotcha', 'I see you']
  // leaveReplies = ['Are you still there?', 'Target lost', 'Searching']
  //
  // robot.enter (res) ->
  //   res.send res.random enterReplies
  // robot.leave (res) ->
  //   res.send res.random leaveReplies
  //
  // answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING
  //
  // robot.respond /what is the answer to the ultimate question of life/, (res) ->
  //   unless answer?
  //     res.send "Missing HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING in environment: please set and try again"
  //     return
  //   res.send "//{answer}, but what is the question?"
  //
  // robot.respond /you are a little slow/, (res) ->
  //   setTimeout () ->
  //     res.send "Who you calling 'slow'?"
  //   , 60 * 1000
  //
  // annoyIntervalId = null
  //
  // robot.respond /annoy me/, (res) ->
  //   if annoyIntervalId
  //     res.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
  //     return
  //
  //   res.send "Hey, want to hear the most annoying sound in the world?"
  //   annoyIntervalId = setInterval () ->
  //     res.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
  //   , 1000
  //
  // robot.respond /unannoy me/, (res) ->
  //   if annoyIntervalId
  //     res.send "GUYS, GUYS, GUYS!"
  //     clearInterval(annoyIntervalId)
  //     annoyIntervalId = null
  //   else
  //     res.send "Not annoying you right now, am I?"
  //
  //
  // robot.router.post '/hubot/chatsecrets/:room', (req, res) ->
  //   room   = req.params.room
  //   data   = JSON.parse req.body.payload
  //   secret = data.secret
  //
  //   robot.messageRoom room, "I have a secret: //{secret}"
  //
  //   res.send 'OK'
  //
  // robot.error (err, res) ->
  //   robot.logger.error "DOES NOT COMPUTE"
  //
  //   if res?
  //     res.reply "DOES NOT COMPUTE"
  //
  // robot.respond /have a soda/i, (res) ->
  //   // Get number of sodas had (coerced to a number).
  //   sodasHad = robot.brain.get('totalSodas') * 1 or 0
  //
  //   if sodasHad > 4
  //     res.reply "I'm too fizzy.."
  //
  //   else
  //     res.reply 'Sure!'
  //
  //     robot.brain.set 'totalSodas', sodasHad+1
  //
  // robot.respond /sleep it off/i, (res) ->
  //   robot.brain.set 'totalSodas', 0
  //   res.reply 'zzzzz'
};
