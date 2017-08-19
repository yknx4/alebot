const { distanceInWordsToNow, parse } = require("date-fns");

module.exports = robot => {
  robot.hear(/last(.*)shower/i, res => {
    const lastShower = robot.brain.get("lastShower");
    if (lastShower == null) {
      return res.send("You haven't take a shower yet... Smelly...");
    }
    const lastShowerTime = parse(lastShower);
    const timeSinceShower = distanceInWordsToNow(lastShowerTime, {
      addSuffix: true,
      includeSeconds: true
    });
    res.send(`You took a shower ${timeSinceShower}.`);
  });

  robot.hear(/took shower/i, res => {
    res.reply("Gotcha!");
    robot.brain.set("lastShower", new Date().toISOString());
  });
};
