const node_ssh = require("node-ssh");
const { readFileSync } = require("fs");
const ssh = new node_ssh();
const path = require("path");

const rootCommand = (command = "") =>
  `echo "${process.env.ROOT_PASS}" | sudo -kS ${command}`;
module.exports = async robot => {
  const key = readFileSync(path.join(__dirname, "../.bot_key"), "utf8");
  await ssh.connect({
    host: "telmexwillbe.verymad.net",
    username: "yknx4",
    privateKey: key
  });

  robot.hear(/restart this shit/i, async res => {
    res.reply("Restarting mopidy");
    const uptime = await ssh.execCommand(rootCommand("service mopidy restart"));
    res.send("Done!");
  });

  robot.hear(/uptime/i, async res => {
    const uptime = await ssh.execCommand(rootCommand("uptime"));
    res.send(uptime.stdout || uptime.stderr);
  });
};
