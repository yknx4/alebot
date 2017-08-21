const { inspect } = require('util');
const request = require('request-promise');

module.exports = robot => {
  robot.catchAll(async res => {
    res.reply(`I didn't understand...`);
    const gifSearch = await request(
      `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(
        res.message.text.replace(robot.name, '').trim(),
      )}&limit=1&api_key=${process.env.GIPHY_KEY}`,
      { json: true },
    );
    if (robot.adapterName === 'telegram') {
      res.send("Sorry, I couldn't understand you :(");
      res.send('But here is a gif ~');
      const images = gifSearch.data[0].images;
      const video = images.original.url;
      robot.emit(
        'telegram:invoke',
        'sendVideo',
        { chat_id: res.message.user.room, video },
        (error, response) => {
          logger.error(error);
          logger.info(response);
        },
      );
    } else {
      res.send(`Here is a random result for: ${inspect(res.message)}`);
    }
  });
};