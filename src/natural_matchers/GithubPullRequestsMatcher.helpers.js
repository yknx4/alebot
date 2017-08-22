exports.onlyMineRegex = /\s(my|mine)\s/i;
exports.filterByUser = (user, onlyMine) =>
  onlyMine ? pr => pr.user.login === user : () => true;
