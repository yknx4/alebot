module.exports = robot => {
  robot.hear(/listen to me/i, res => {
    res.reply(`Sure, what is it?`);
    robot.emit("expectResponse", res.message.user.id, nestedRes => {
      nestedRes.send(`echo ${nestedRes.message.text}`);
    });
  });
};
