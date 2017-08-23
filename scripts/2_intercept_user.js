module.exports = robot =>
  robot.receiveMiddleware(async (context, next, done) => {
    const { response } = context;
    const { message } = response;

    const { user } = message;
    if (user.id !== 169915916 && robot.adapterName !== 'shell') {
      response.reply('Who are you?');
      return done();
    }
    return next(done);
  });
