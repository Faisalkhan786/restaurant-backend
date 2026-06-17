const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const env = require('../config/env');
const User = require('../models/User');
const redisService = require('../services/redis.service');
const { success, error } = require('../utils/response');
const { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } = require('../utils/errors');
const emailService = require('../services/email.service');

// Generate tokens
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expire,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpire,
  });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Only allow customer registration publicly, admin creates other roles
    const allowedRole = role === 'delivery_boy' || role === 'admin' ? 'customer' : 'customer';

    // Check existing user
    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictError('User with this email or phone already exists');
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: allowedRole,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await redisService.storeRefreshToken(user.id, refreshToken);

    return success(res, {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await redisService.storeRefreshToken(user.id, refreshToken);

    return success(res, {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh-token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);

    // Check if refresh token matches stored one
    const storedToken = await redisService.getRefreshToken(decoded.id);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await redisService.storeRefreshToken(user.id, newRefreshToken);

    return success(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed');
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired refresh token'));
    }
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    return success(res, { user: req.user.toJSON() }, 'User profile');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    // Blacklist current access token
    if (token) {
      await redisService.blacklistToken(token);
    }

    // Delete refresh token
    await redisService.deleteRefreshToken(req.user.id);

    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('No account found with this email');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis (10 min expiry)
    await redisService.storeOTP(email, otp);

    // In development, skip email and return OTP in response
    if (env.nodeEnv === 'development') {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
      return success(res, { otp }, 'OTP sent (dev mode — OTP in response)');
    }

    // In production, send OTP via email
    await emailService.sendOTP(email, otp);

    return success(res, null, 'OTP sent to your email');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Verify OTP from Redis
    const storedOTP = await redisService.getOTP(email);
    if (!storedOTP) {
      throw new BadRequestError('OTP expired. Please request a new one');
    }

    if (storedOTP !== otp) {
      throw new BadRequestError('Invalid OTP');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update password (beforeUpdate hook will hash it)
    user.password = newPassword;
    await user.save();

    // Delete OTP from Redis
    await redisService.deleteOTP(email);

    // Invalidate existing refresh token so user has to login fresh
    await redisService.deleteRefreshToken(user.id);

    return success(res, null, 'Password reset successful. Please login with your new password');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/create-user (Admin only — create delivery boy or admin)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!['delivery_boy', 'admin'].includes(role)) {
      throw new BadRequestError('Invalid role. Use register for customer accounts');
    }

    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictError('User with this email or phone already exists');
    }

    const user = await User.create({ name, email, phone, password, role });

    return success(res, { user: user.toJSON() }, `${role} created successfully`, 201);
  } catch (err) {
    next(err);
  }
};
