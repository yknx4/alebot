const Mustache = require("mustache");
const NaturalMatcher = require("./NaturalMatcher");
const { GITHUB_PR_PLURAL } = require("../classifications");
const { github, loadAll } = require("../helpers/github.helpers");
const {
  onlyMineRegex,
  filterByUser
} = require("./GithubPullRequestsMatcher.helpers");

const user = process.env.GITHUB_USER;

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
        prs: prs.filter(filterByUser(user, onlyMine)).map(p => {
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
{{#prs}}\t- {{#notme}}_{{user.login}}_{{/notme}} *#{{number}}* [{{{title}}}]({{{url}}}).{{#hasReviewers}} Reviewers: {{reviewers}}{{/hasReviewers}}\n{{/prs}}`;

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
