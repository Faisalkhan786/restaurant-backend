const { Order, OrderItem, MenuItem, Address, User, DeliveryBoyProfile } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// GET /api/delivery/orders — my assigned orders
exports.getMyAssignedOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { delivery_boy_id: req.user.id };

    if (status) {
      where.status = status;
    } else {
      // By default show active orders (not delivered/cancelled)
      where.status = ['confirmed', 'preparing', 'ready', 'out_for_delivery'];
    }

    const orders = await Order.findAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'phone'] },
        { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem', attributes: ['id', 'name'] }] },
        { model: Address, as: 'deliveryAddress' },
      ],
      order: [['created_at', 'DESC']],
    });

    return success(res, orders, 'My assigned orders');
  } catch (err) {
    next(err);
  }
};

// GET /api/delivery/orders/:id — single order detail
exports.getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, delivery_boy_id: req.user.id },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'phone', 'email'] },
        { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] },
        { model: Address, as: 'deliveryAddress' },
      ],
    });

    if (!order) throw new NotFoundError('Order not found or not assigned to you');

    return success(res, order, 'Order detail');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/delivery/orders/:id — update delivery status
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, delivery_boy_id: req.user.id },
    });

    if (!order) throw new NotFoundError('Order not found or not assigned to you');

    const { status } = req.body;

    // Delivery boy can only update: ready -> out_for_delivery -> delivered
    const allowedFlow = {
      ready: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
    };

    const allowed = allowedFlow[order.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestError(`Cannot change status from ${order.status} to ${status}`);
    }

    order.status = status;
    if (status === 'delivered') {
      order.payment_status = 'paid';
    }
    await order.save();

    return success(res, order, `Order status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/delivery/toggle — online/offline toggle
exports.toggleAvailability = async (req, res, next) => {
  try {
    let profile = await DeliveryBoyProfile.findOne({
      where: { user_id: req.user.id },
    });

    // Auto-create profile if not exists
    if (!profile) {
      profile = await DeliveryBoyProfile.create({
        user_id: req.user.id,
        is_available: true,
      });
    } else {
      profile.is_available = !profile.is_available;
      await profile.save();
    }

    return success(res, {
      is_available: profile.is_available,
    }, `You are now ${profile.is_available ? 'online' : 'offline'}`);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/delivery/location — update current location
exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    let profile = await DeliveryBoyProfile.findOne({
      where: { user_id: req.user.id },
    });

    if (!profile) {
      profile = await DeliveryBoyProfile.create({
        user_id: req.user.id,
        current_lat: lat,
        current_lng: lng,
      });
    } else {
      profile.current_lat = lat;
      profile.current_lng = lng;
      await profile.save();
    }

    return success(res, { lat: profile.current_lat, lng: profile.current_lng }, 'Location updated');
  } catch (err) {
    next(err);
  }
};

// GET /api/delivery/profile — delivery boy profile
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await DeliveryBoyProfile.findOne({
      where: { user_id: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'avatar_url'] }],
    });

    if (!profile) {
      // Return user info with default profile
      return success(res, {
        user: req.user.toJSON(),
        is_available: false,
        vehicle_type: null,
        current_lat: null,
        current_lng: null,
      }, 'Delivery profile');
    }

    return success(res, profile, 'Delivery profile');
  } catch (err) {
    next(err);
  }
};

// PUT /api/delivery/profile — update vehicle type etc.
exports.updateProfile = async (req, res, next) => {
  try {
    const { vehicle_type } = req.body;

    let profile = await DeliveryBoyProfile.findOne({
      where: { user_id: req.user.id },
    });

    if (!profile) {
      profile = await DeliveryBoyProfile.create({
        user_id: req.user.id,
        vehicle_type,
      });
    } else {
      if (vehicle_type !== undefined) profile.vehicle_type = vehicle_type;
      await profile.save();
    }

    return success(res, profile, 'Profile updated');
  } catch (err) {
    next(err);
  }
};
