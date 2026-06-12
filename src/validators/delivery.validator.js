const Joi = require('joi');

const updateDeliveryStatus = Joi.object({
  status: Joi.string().valid('out_for_delivery', 'delivered').required()
    .messages({ 'any.required': 'Status is required', 'any.only': 'Status must be out_for_delivery or delivered' }),
});

const updateLocation = Joi.object({
  lat: Joi.number().min(-90).max(90).required()
    .messages({ 'any.required': 'Latitude is required' }),
  lng: Joi.number().min(-180).max(180).required()
    .messages({ 'any.required': 'Longitude is required' }),
});

const updateProfile = Joi.object({
  vehicle_type: Joi.string().valid('bike', 'scooter', 'bicycle', 'car').required()
    .messages({ 'any.required': 'Vehicle type is required', 'any.only': 'Vehicle type must be bike, scooter, bicycle or car' }),
});

module.exports = { updateDeliveryStatus, updateLocation, updateProfile };
