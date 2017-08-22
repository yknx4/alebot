const { isEmpty } = require('lodash');

exports.onlyMineRegex = /\s(my|mine)\s/i;
exports.filterByUser = (user, onlyMine) => (onlyMine ? pr => pr.user.login === user : () => true);
exports.addReviewerData = pr => {
  const { requested_reviewers } = pr;
  pr.hasReviewers = !isEmpty(requested_reviewers);
  pr.reviewers = requested_reviewers.map(r => `_${r.login}_`).join(', ');
  return pr;
};
exports.pullRequestsTemplate = `These are {{noun}} open *Pull Requests* on {{owner}}/{{repo}}
{{#prs}}\t- {{#notme}}_{{user.login}}_{{/notme}} *#{{number}}* [{{{title}}}]({{{url}}}).{{#hasReviewers}} Reviewers: {{reviewers}}{{/hasReviewers}}\n{{/prs}}`;
