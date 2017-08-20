require("dotenv").config();
const GitHubApi = require("github");
const githubParser = require("parse-github-url");
const { reduce, range, flatten } = require("lodash");
const Mustache = require("mustache");

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
  if (!meta.link) return 1;
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

async function loadAll(fn, opts) {
  const args = Object.assign({}, opts, { page: 1 });
  const firstResult = await fn(args);
  const lastPage = getLastPage(firstResult.meta);
  if (lastPage === 1) return firstResult.data;

  let results = range(2, lastPage + 1);
  results = results.map(async page => fn(Object.assign({}, opts, { page })));

  results = await Promise.all(results);
  return flatten([firstResult.data, ...results.map(r => r.data)]);
}

module.exports = jade => {
  jade.hear(
    /(my)? ?(prs?|pull requests?) (for|in) (\w*\/\w*|\w*)/i,
    async res => {
      const fullRepo = res.match[4].split("/");
      const my = res.match[1];
      const repo = fullRepo[1] || fullRepo[0];
      const owner = fullRepo[0] !== repo ? fullRepo[0] : user;
      if (repo == null) return;
      let page = 1;

      const userFilter = my ? pr => pr.user.login === user : () => true;

      res.send(
        `Loading ${my ? "your " : ""}*Pull Requests* for ${owner}/${repo}`
      );

      try {
        const prs = await loadAll(github.pullRequests.getAll, {
          owner,
          per_page: 100,
          repo,
          page
        });

        const view = {
          noun: my ? "your" : "the",
          repo,
          owner,
          notme: my == null,
          prs: prs.filter(userFilter).map(p => {
            p.hasReviewers = p.requested_reviewers.length > 0;
            p.reviewers = p.requested_reviewers
              .map(r => `_${r.login}_`)
              .join(", ");
            return p;
          })
        };

        if (view.prs.length === 0) {
          return res.send(
            `There are no open *Pull Requests* on ${owner}/${repo}`
          );
        }

        const prTemplate = `These are {{noun}} open *Pull Requests* on {{owner}}/{{repo}}
\t{{#prs}}- {{#notme}}_{{user.login}}_{{/notme}} *#{{number}}* [{{{title}}}]({{{url}}}).{{#hasReviewers}} Reviewers: {{reviewers}}{{/hasReviewers}}\n{{/prs}}`;

        console.log(Mustache.render(prTemplate, view));
        res.send(Mustache.render(prTemplate, view));
      } catch (error) {
        console.log(error);
        res.send(`Cannot get pull requests for ${owner}/${repo}`);
      }
    }
  );
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
