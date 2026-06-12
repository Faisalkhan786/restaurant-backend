const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

module.exports = redis;
