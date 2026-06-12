const { Order, OrderItem, MenuItem, User, RestaurantConfig, DeliveryBoyProfile, Coupon } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const { success } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const orderService = require('../services/order.service');

// ==================== DASHBOARD ====================

// GET /api/admin/dashboard — today's summary
exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateFilter = { created_at: { [Op.between]: [today, tomorrow] } };

    // Today's orders count by status
    const todayOrders = await Order.count({ where: dateFilter });
    const pendingOrders = await Order.count({ where: { ...dateFilter, status: 'placed' } });
    const activeOrders = await Order.count({
      where: { ...dateFilter, status: { [Op.in]: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] } },
    });
    const deliveredOrders = await Order.count({ where: { ...dateFilter, status: 'delivered' } });
    const cancelledOrders = await Order.count({ where: { ...dateFilter, status: 'cancelled' } });

    // Today's revenue
    const revenueResult = await Order.sum('total', {
      where: { ...dateFilter, status: 'delivered' },
    });
    const todayRevenue = revenueResult || 0;

    // Total customers
    const totalCustomers = await User.count({ where: { role: 'customer' } });

    // Online delivery boys
    const onlineRiders = await DeliveryBoyProfile.count({ where: { is_available: true } });

    return success(res, {
      today: {
        total_orders: todayOrders,
        pending_orders: pendingOrders,
        active_orders: activeOrders,
        delivered_orders: deliveredOrders,
        cancelled_orders: cancelledOrders,
        revenue: parseFloat(todayRevenue).toFixed(2),
      },
      total_customers: totalCustomers,
      online_riders: onlineRiders,
    }, 'Dashboard summary');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports — sales reports
exports.getReports = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query; // week, month, year
    let days;
    switch (period) {
      case 'month': days = 30; break;
      case 'year': days = 365; break;
      default: days = 7;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Revenue by day
    const dailyRevenue = await Order.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'orders'],
        [fn('SUM', col('total')), 'revenue'],
      ],
      where: {
        created_at: { [Op.gte]: startDate },
        status: 'delivered',
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    // Total revenue in period
    const totalRevenue = await Order.sum('total', {
      where: { created_at: { [Op.gte]: startDate }, status: 'delivered' },
    }) || 0;

    // Total orders in period
    const totalOrders = await Order.count({
      where: { created_at: { [Op.gte]: startDate } },
    });

    return success(res, {
      period,
      total_revenue: parseFloat(totalRevenue).toFixed(2),
      total_orders: totalOrders,
      daily: dailyRevenue,
    }, 'Sales report');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/top-items — top selling items
exports.getTopItems = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const topItems = await OrderItem.findAll({
      attributes: [
        'menu_item_id',
        [fn('SUM', col('quantity')), 'total_sold'],
        [fn('SUM', col('OrderItem.subtotal')), 'total_revenue'],
      ],
      include: [{
        model: MenuItem,
        as: 'menuItem',
        attributes: ['id', 'name', 'price', 'image_url'],
      }],
      group: ['menu_item_id', 'menuItem.id'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: parseInt(limit),
      raw: false,
    });

    return success(res, topItems, 'Top selling items');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/delivery-boys — delivery boys with performance
exports.getDeliveryBoys = async (req, res, next) => {
  try {
    const deliveryBoys = await User.findAll({
      where: { role: 'delivery_boy', is_active: true },
      attributes: ['id', 'name', 'phone', 'email'],
      include: [{
        model: DeliveryBoyProfile,
        as: 'deliveryProfile',
        attributes: ['vehicle_type', 'is_available', 'current_lat', 'current_lng'],
      }],
    });

    // Get delivery counts for each
    const result = [];
    for (const boy of deliveryBoys) {
      const totalDeliveries = await Order.count({
        where: { delivery_boy_id: boy.id, status: 'delivered' },
      });
      const activeOrders = await Order.count({
        where: {
          delivery_boy_id: boy.id,
          status: { [Op.in]: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] },
        },
      });

      result.push({
        ...boy.toJSON(),
        total_deliveries: totalDeliveries,
        active_orders: activeOrders,
      });
    }

    return success(res, result, 'Delivery boys');
  } catch (err) {
    next(err);
  }
};

// ==================== RESTAURANT CONFIG ====================

// GET /api/admin/config
exports.getConfig = async (req, res, next) => {
  try {
    let config = await RestaurantConfig.findOne();
    if (!config) {
      config = await RestaurantConfig.create({ name: 'My Restaurant' });
    }
    return success(res, config, 'Restaurant config');
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/config
exports.updateConfig = async (req, res, next) => {
  try {
    let config = await RestaurantConfig.findOne();
    if (!config) {
      config = await RestaurantConfig.create({ name: 'My Restaurant', ...req.body });
    } else {
      await config.update(req.body);
    }

    // Clear Redis cache
    await orderService.clearConfigCache();

    return success(res, config, 'Config updated');
  } catch (err) {
    next(err);
  }
};
