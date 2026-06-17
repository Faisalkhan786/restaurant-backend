const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'any.required': 'Name is required', 'string.min': 'Name must be at least 2 characters' }),
  email: Joi.string().email().lowercase().required()
    .messages({ 'any.required': 'Email is required', 'string.email': 'Valid email is required' }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional()
    .messages({ 'string.pattern.base': 'Valid phone number is required (10-15 digits)' }),
  password: Joi.string().min(6).max(128).required()
    .messages({ 'any.required': 'Password is required', 'string.min': 'Password must be at least 6 characters' }),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().required()
    .messages({ 'any.required': 'Email is required', 'string.email': 'Valid email is required' }),
  password: Joi.string().required()
    .messages({ 'any.required': 'Password is required' }),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required()
    .messages({ 'any.required': 'Refresh token is required' }),
});

const createUser = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'any.required': 'Name is required' }),
  email: Joi.string().email().lowercase().required()
    .messages({ 'any.required': 'Email is required', 'string.email': 'Valid email is required' }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional()
    .messages({ 'string.pattern.base': 'Valid phone number is required' }),
  password: Joi.string().min(6).max(128).required()
    .messages({ 'any.required': 'Password is required', 'string.min': 'Password must be at least 6 characters' }),
  role: Joi.string().valid('delivery_boy', 'admin').required()
    .messages({ 'any.required': 'Role is required', 'any.only': 'Role must be delivery_boy or admin' }),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().lowercase().required()
    .messages({ 'any.required': 'Email is required', 'string.email': 'Valid email is required' }),
});

const resetPassword = Joi.object({
  email: Joi.string().email().lowercase().required()
    .messages({ 'any.required': 'Email is required', 'string.email': 'Valid email is required' }),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    .messages({ 'any.required': 'OTP is required', 'string.length': 'OTP must be 6 digits', 'string.pattern.base': 'OTP must be numeric' }),
  newPassword: Joi.string().min(6).max(128).required()
    .messages({ 'any.required': 'New password is required', 'string.min': 'Password must be at least 6 characters' }),
});

module.exports = { register, login, refreshToken, createUser, forgotPassword, resetPassword };
