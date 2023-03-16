require("dotenv").config();

const express = require("express");
const redis = require("./redis/index.js");
const aaq = require("async-and-quick");
const logUpdate = require("log-update");
const app = express();

const exchangeToken = require("./utils/exchangeToken.js");

app.options("*", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "x-acord-token, Content-Type");
  res.sendStatus(200);
});

app.use(express.json());

const stats = {
  mps: 0,
  _mps: 0
};

setInterval(() => {
  stats.mps = stats._mps;
  stats._mps = 0;
}, 1000);

app.get("/:userId", async (req, res) => {
  const token = req.header("x-acord-token");
  const id = await exchangeToken(token);
  if (!id) return res.sendStatus(401);

  const lastMessages = ((await redis.json.get(`LastMessages:${req.params.userId}`, "$.messages")) || []).filter(i => i);
  res.send(lastMessages);

  stats._mps++;
});

app.post("/", async (req, res) => {
  const token = req.header("x-acord-token");
  const id = await exchangeToken(token);
  if (!id) return res.sendStatus(401);

  stats._mps++;

  const entries = Object.entries(req.body);
  await aaq.quickForEach(entries, async ([userId, i]) => {
    const messages = ((await redis.json.get(`LastMessages:${userId}`, "$.messages")) || []);

    const oldIndex = messages.findIndex(i => i[1] === i[1]);
    if (oldIndex !== -1) messages.splice(oldIndex, 1);

    messages.unshift(i);
    if (messages.length > 5) messages = messages.slice(0, 5);
    await redis.json.set(`LastMessages:${userId}`, "$", { messages });
    await redis.expire(`LastMessages:${userId}`, 60 * 60 * 24 * 2);
  }, 20);
});

setInterval(() => {
  let text = `[${new Date().toLocaleTimeString()}] LastMessages Backend (*:2025)\n\n`;
  text += `Messages Per Second: ${stats.mps}`;
  logUpdate(text);
}, 1000);

console.clear();
app.listen(2025);