const { inspect } = require("util");
const request = require("request-promise");

module.exports = robot => {
  robot.catchAll(async res => {
    res.send("Sorry, I couldn't understand you :(");
    const gifSearch = await request(
      `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(
        res.message.text.replace(robot.name, "").trim()
      )}&limit=1&api_key=${process.env.GIPHY_KEY}`,
      { json: true }
    );
    if (robot.adapterName === "telegram") {
      res.send("But here is a gif ~");
      const images = gifSearch.data[0].images;
      const video = images.original.url;
      robot.emit(
        "telegram:invoke",
        "sendVideo",
        { chat_id: res.message.user.room, video },
        error => {
          if (error) logger.error(error);
        }
      );
    } else {
      res.send(`Here is a random result for: ${inspect(res.message)}`);
    }
  });
};
