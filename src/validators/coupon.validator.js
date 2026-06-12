const Joi = require('joi');

const createCoupon = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(50).required()
    .messages({ 'any.required': 'Coupon code is required' }),
  type: Joi.string().valid('flat', 'percent').required()
    .messages({ 'any.required': 'Type is required', 'any.only': 'Type must be flat or percent' }),
  value: Joi.number().positive().required()
    .messages({ 'any.required': 'Value is required', 'number.positive': 'Value must be positive' }),
  min_order: Joi.number().min(0).default(0),
  max_discount: Joi.number().positive().optional().allow(null),
  expiry_date: Joi.date().iso().min('now').required()
    .messages({ 'any.required': 'Expiry date is required', 'date.min': 'Expiry date must be in the future' }),
  is_active: Joi.boolean().default(true),
  usage_limit: Joi.number().integer().positive().optional().allow(null),
});

const updateCoupon = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(50).optional(),
  type: Joi.string().valid('flat', 'percent').optional(),
  value: Joi.number().positive().optional(),
  min_order: Joi.number().min(0).optional(),
  max_discount: Joi.number().positive().optional().allow(null),
  expiry_date: Joi.date().iso().optional(),
  is_active: Joi.boolean().optional(),
  usage_limit: Joi.number().integer().positive().optional().allow(null),
}).min(1);

const validateCode = Joi.object({
  subtotal: Joi.number().positive().required()
    .messages({ 'any.required': 'Subtotal is required to validate coupon' }),
});

module.exports = { createCoupon, updateCoupon, validateCode };
