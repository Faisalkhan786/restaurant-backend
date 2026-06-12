const Joi = require('joi');

const updateConfig = Joi.object({
  name: Joi.string().trim().max(200).optional(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  address: Joi.string().max(500).optional(),
  opening_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
    .messages({ 'string.pattern.base': 'Opening time must be HH:MM format' }),
  closing_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
    .messages({ 'string.pattern.base': 'Closing time must be HH:MM format' }),
  min_order_amount: Joi.number().min(0).optional(),
  delivery_charge: Joi.number().min(0).optional(),
  tax_percentage: Joi.number().min(0).max(100).optional(),
  delivery_radius_km: Joi.number().min(0).optional(),
}).min(1);

module.exports = { updateConfig };
