const GitHubApi = require("github");
const { reduce, range, flatten } = require("lodash");

exports.github = new GitHubApi({
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

const getPageFromLinkRegex = /<.*page=(\d)>; rel="(.*)"/i;

exports.getLastPage = function getLastPage(meta) {
  if (!meta.link) return 1;
  let links = meta.link.split(",").map(l => {
    const match = getPageFromLinkRegex.exec(l) || [];
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
};

exports.loadAll = async function loadAll(fn, opts) {
  const args = Object.assign({}, opts, { page: 1 });
  const firstResult = await fn(args);
  const lastPage = exports.getLastPage(firstResult.meta);
  if (lastPage === 1) return firstResult.data;

  let results = range(2, lastPage + 1);
  results = results.map(async page => fn(Object.assign({}, opts, { page })));

  results = await Promise.all(results);
  return flatten([firstResult.data, ...results.map(r => r.data)]);
};
