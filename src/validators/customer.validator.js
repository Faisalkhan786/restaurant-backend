const Joi = require('joi');

const updateProfile = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional()
    .messages({ 'string.pattern.base': 'Valid phone number is required' }),
  avatar_url: Joi.string().uri().optional().allow(''),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

const addAddress = Joi.object({
  label: Joi.string().valid('Home', 'Office', 'Other').default('Home'),
  full_address: Joi.string().trim().min(5).max(500).required()
    .messages({ 'any.required': 'Full address is required' }),
  area: Joi.string().max(100).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  is_default: Joi.boolean().optional(),
});

const updateAddress = Joi.object({
  label: Joi.string().valid('Home', 'Office', 'Other').optional(),
  full_address: Joi.string().trim().min(5).max(500).optional(),
  area: Joi.string().max(100).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  is_default: Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

module.exports = { updateProfile, addAddress, updateAddress };
