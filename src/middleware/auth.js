const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../utils/errors');
const User = require('../models/User');
const redis = require('../config/redis');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`bl_${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    next(err);
  }
};

module.exports = authenticate;
