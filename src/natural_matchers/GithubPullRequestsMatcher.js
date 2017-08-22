const NaturalMatcher = require("./NaturalMatcher");
const { GITHUB_PR_PLURAL } = require("../classifications");
const GitHubApi = require("github");
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
    const [input, link, rel] = match; // eslint-disable-line no-unused-vars
    return [rel, link];
  });
  links = reduce(
    links,
    (a, e) => {
      const [key, value] = e || [];
      a[key] = value; // eslint-disable-line no-param-reassign
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

const onlyMineRegex = /\s(my|mine)\s/i;

class GithubPullRequestsMatcher extends NaturalMatcher {
  get fullRepo() {
    const { fallback, matches } = this;
    const repoMatchPosition = fallback ? 4 : 2;
    return matches[repoMatchPosition].split("/");
  }

  get repoName() {
    return this.fullRepo[1] || this.fullRepo[0];
  }

  get repoOwner() {
    const { fullRepo, repoName } = this;
    return fullRepo[0] !== repoName ? fullRepo[0] : user;
  }

  get onlyMine() {
    const { text } = this;
    return onlyMineRegex.test(text);
  }

  get hasRepoName() {
    return this.repoName != null;
  }

  async execute() {
    const {
      res,
      repoName: repo,
      repoOwner: owner,
      hasRepoName,
      onlyMine,
      legacy,
      text
    } = this;
    if (!hasRepoName) return null;
    if (legacy) {
      classifier.addDocument(text, GITHUB_PR_PLURAL);
    }

    const userFilter = onlyMine ? pr => pr.user.login === user : () => true;

    res.send(
      `Loading ${onlyMine ? "your " : ""}*Pull Requests* for ${owner}/${repo}`
    );

    try {
      const prs = await loadAll(github.pullRequests.getAll, {
        owner,
        per_page: 100,
        repo
      });

      const view = {
        noun: onlyMine ? "your" : "the",
        repo,
        owner,
        notme: onlyMine === false,
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

      return res.send(Mustache.render(prTemplate, view));
    } catch (error) {
      logger.error(error);
      return res.send(`Cannot get pull requests for ${owner}/${repo}`);
    }
  }
}

GithubPullRequestsMatcher.keywords = [
  "pull requests",
  "pull request",
  "prs",
  "pr"
];

GithubPullRequestsMatcher.regex = /\s(for|in) (\w*\/\w*|\w*)\s*/i;
GithubPullRequestsMatcher.fallbackRegex = /(my)? ?(prs?|pull requests?) (for|in) (\w*\/\w*|\w*)/i;

NaturalMatcher.register(GithubPullRequestsMatcher, GITHUB_PR_PLURAL);

module.exports = GithubPullRequestsMatcher;
