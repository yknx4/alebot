const notify = robot => function notify() {};

module.exports = robot => {
  setInterval(notify(robot), 5000);
};
