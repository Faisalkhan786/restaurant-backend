const redis = require('../config/redis');

const redisService = {
  // Store refresh token
  async storeRefreshToken(userId, token, expireSeconds = 7 * 24 * 60 * 60) {
    await redis.set(`refresh_${userId}`, token, 'EX', expireSeconds);
  },

  // Get refresh token
  async getRefreshToken(userId) {
    return redis.get(`refresh_${userId}`);
  },

  // Delete refresh token (logout)
  async deleteRefreshToken(userId) {
    await redis.del(`refresh_${userId}`);
  },

  // Blacklist access token (logout)
  async blacklistToken(token, expireSeconds = 900) {
    await redis.set(`bl_${token}`, 'true', 'EX', expireSeconds);
  },
};

module.exports = redisService;
