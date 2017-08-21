const cbMap = {};
const timeoutMap = {};

const waitingKey = userId => `${userId}waitingForResponse`;

module.exports = function useNaturals(robot) {
  robot.on('expectResponse', (userId, callback, { ttl = 10000, timeout = () => {} } = {}) => {
    robot.brain.set(waitingKey(userId), true);
    cbMap[userId] = callback;
    if (ttl > 0) {
      timeoutMap[userId] = setTimeout(() => {
        if (robot.brain.get(waitingKey(userId)) === true) {
          robot.brain.set(waitingKey(userId), false);
          robot.messageRoom(userId, 'nevermind');
          timeout(robot, userId);
          delete cbMap[userId];
        }
      }, ttl);
    }
  });
  return robot.receiveMiddleware((context, next, done) => {
    const { response } = context;
    const { message } = response;
    if (message.message != null) {
      logger.info(`Ignoring CatchAllMessage`);
      return next(done);
    }
    const { user } = message;
    if (robot.brain.get(waitingKey(user.id)) === true) {
      clearTimeout(user.id);
      cbMap[user.id](response, robot);
      robot.brain.set(waitingKey(user.id), false);
      delete cbMap[user.id];
      return done();
    }
    return next(done);
  });
};
