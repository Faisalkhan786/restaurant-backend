const { MenuItem, Variation, Addon, RestaurantConfig } = require('../models');
const redis = require('../config/redis');
const { BadRequestError } = require('../utils/errors');

const orderService = {
  // Generate unique order number
  generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  },

  // Calculate order totals
  async calculateOrder(items) {
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menu_item_id, {
        include: [
          { model: Variation, as: 'variations' },
          { model: Addon, as: 'addons' },
        ],
      });

      if (!menuItem) throw new BadRequestError(`Menu item ${item.menu_item_id} not found`);
      if (!menuItem.is_available) throw new BadRequestError(`${menuItem.name} is currently unavailable`);

      let unitPrice = parseFloat(menuItem.price);
      let variationName = null;
      let variationPrice = null;

      // Apply variation if selected
      if (item.variation_id) {
        const variation = menuItem.variations.find(v => v.id === item.variation_id);
        if (!variation) throw new BadRequestError(`Invalid variation for ${menuItem.name}`);
        unitPrice = parseFloat(variation.price);
        variationName = variation.name;
        variationPrice = parseFloat(variation.price);
      }

      // Calculate addons total
      let addonsData = [];
      let addonsTotal = 0;
      if (item.addon_ids && item.addon_ids.length > 0) {
        for (const addonId of item.addon_ids) {
          const addon = menuItem.addons.find(a => a.id === addonId);
          if (!addon) throw new BadRequestError(`Invalid addon for ${menuItem.name}`);
          addonsData.push({ name: addon.name, price: parseFloat(addon.price) });
          addonsTotal += parseFloat(addon.price);
        }
      }

      const itemSubtotal = (unitPrice + addonsTotal) * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        menu_item_id: menuItem.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: itemSubtotal,
        variation_name: variationName,
        variation_price: variationPrice,
        addons: addonsData.length > 0 ? addonsData : null,
      });
    }

    // Get restaurant config for charges
    let config = await this.getRestaurantConfig();
    const deliveryCharge = parseFloat(config?.delivery_charge || 0);
    const taxPercentage = parseFloat(config?.tax_percentage || 0);
    const tax = (subtotal * taxPercentage) / 100;
    const total = subtotal + deliveryCharge + tax;

    return {
      orderItems,
      subtotal: subtotal.toFixed(2),
      delivery_charge: deliveryCharge.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
    };
  },

  // Get restaurant config (cached in Redis)
  async getRestaurantConfig() {
    const cacheKey = 'restaurant_config';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const config = await RestaurantConfig.findOne();
    if (config) {
      await redis.set(cacheKey, JSON.stringify(config), 'EX', 3600); // cache 1 hour
    }
    return config;
  },

  // Clear restaurant config cache
  async clearConfigCache() {
    await redis.del('restaurant_config');
  },

  // Cache live orders count
  async cacheLiveOrdersCount(count) {
    await redis.set('live_orders_count', count, 'EX', 60);
  },

  async getLiveOrdersCount() {
    return redis.get('live_orders_count');
  },
};

module.exports = orderService;
