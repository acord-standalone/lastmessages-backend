const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.connect();

module.exports = redis;