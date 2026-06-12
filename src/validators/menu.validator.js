const Joi = require('joi');

const createCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'any.required': 'Category name is required' }),
  sort_order: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
});

const updateCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  sort_order: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

const createItem = Joi.object({
  category_id: Joi.number().integer().required()
    .messages({ 'any.required': 'Category ID is required' }),
  name: Joi.string().trim().min(2).max(150).required()
    .messages({ 'any.required': 'Item name is required' }),
  description: Joi.string().max(1000).optional().allow(''),
  price: Joi.number().positive().required()
    .messages({ 'any.required': 'Price is required', 'number.positive': 'Price must be positive' }),
  is_available: Joi.boolean().optional(),
  is_featured: Joi.boolean().optional(),
  prep_time: Joi.number().integer().min(1).optional(),
  variations: Joi.string().optional(), // JSON string from form-data
  addons: Joi.string().optional(), // JSON string from form-data
});

const updateItem = Joi.object({
  category_id: Joi.number().integer().optional(),
  name: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  price: Joi.number().positive().optional(),
  is_available: Joi.boolean().optional(),
  is_featured: Joi.boolean().optional(),
  prep_time: Joi.number().integer().min(1).optional(),
  variations: Joi.string().optional(),
  addons: Joi.string().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

module.exports = { createCategory, updateCategory, createItem, updateItem };
