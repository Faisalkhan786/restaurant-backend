const { Order, OrderItem, MenuItem, Address, User, Category, Coupon } = require('../models');
const orderService = require('../services/order.service');
const { success, paginated } = require('../utils/response');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { Op } = require('sequelize');

// ==================== CUSTOMER ====================

// POST /api/orders — place order
exports.placeOrder = async (req, res, next) => {
  try {
    const { delivery_address_id, items, payment_method, delivery_notes, coupon_code } = req.body;

    if (!items || !items.length) throw new BadRequestError('Order must have at least one item');
    if (!delivery_address_id) throw new BadRequestError('Delivery address is required');

    // Verify address belongs to customer
    const address = await Address.findOne({
      where: { id: delivery_address_id, user_id: req.user.id },
    });
    if (!address) throw new BadRequestError('Invalid delivery address');

    // Check min order amount
    const config = await orderService.getRestaurantConfig();
    const minOrder = parseFloat(config?.min_order_amount || 0);

    // Calculate order
    const calculated = await orderService.calculateOrder(items);

    if (minOrder > 0 && parseFloat(calculated.subtotal) < minOrder) {
      throw new BadRequestError(`Minimum order amount is Rs. ${minOrder}`);
    }

    // Apply coupon if provided
    let discount = 0;
    if (coupon_code) {
      const coupon = await Coupon.findOne({
        where: { code: coupon_code.toUpperCase(), is_active: true },
      });

      if (!coupon) throw new BadRequestError('Invalid coupon code');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(coupon.expiry_date) < today) throw new BadRequestError('Coupon has expired');
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) throw new BadRequestError('Coupon usage limit reached');
      if (parseFloat(calculated.subtotal) < parseFloat(coupon.min_order)) {
        throw new BadRequestError(`Minimum order of Rs. ${coupon.min_order} required for this coupon`);
      }

      if (coupon.type === 'flat') {
        discount = parseFloat(coupon.value);
      } else {
        discount = (parseFloat(calculated.subtotal) * parseFloat(coupon.value)) / 100;
        if (coupon.max_discount) discount = Math.min(discount, parseFloat(coupon.max_discount));
      }

      // Increment usage
      coupon.used_count += 1;
      await coupon.save();
    }

    const total = (parseFloat(calculated.subtotal) + parseFloat(calculated.delivery_charge) + parseFloat(calculated.tax) - discount);

    // Create order
    const order = await Order.create({
      order_number: orderService.generateOrderNumber(),
      customer_id: req.user.id,
      status: 'placed',
      delivery_address_id,
      delivery_notes,
      subtotal: calculated.subtotal,
      delivery_charge: calculated.delivery_charge,
      tax: calculated.tax,
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      payment_method: payment_method || 'COD',
      payment_status: payment_method === 'online' ? 'pending' : 'pending',
      estimated_delivery_time: 45, // default 45 mins
    });

    // Create order items
    for (const item of calculated.orderItems) {
      await OrderItem.create({ order_id: order.id, ...item });
    }

    // Fetch complete order
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] },
        { model: Address, as: 'deliveryAddress' },
      ],
    });

    return success(res, fullOrder, 'Order placed successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders — my order history
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const where = { customer_id: req.user.id };
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] },
        { model: Address, as: 'deliveryAddress' },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return paginated(res, rows, page, limit, count, 'My orders');
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id — order detail
exports.getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, customer_id: req.user.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] },
        { model: Address, as: 'deliveryAddress' },
        { model: User, as: 'deliveryBoy', attributes: ['id', 'name', 'phone'] },
      ],
    });

    if (!order) throw new NotFoundError('Order not found');

    return success(res, order, 'Order detail');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, customer_id: req.user.id },
    });

    if (!order) throw new NotFoundError('Order not found');

    // Can only cancel if placed or confirmed
    if (!['placed', 'confirmed'].includes(order.status)) {
      throw new BadRequestError('Order cannot be cancelled at this stage');
    }

    order.status = 'cancelled';
    order.cancel_reason = req.body.reason || 'Cancelled by customer';
    await order.save();

    return success(res, order, 'Order cancelled');
  } catch (err) {
    next(err);
  }
};

// ==================== ADMIN ====================

// GET /api/admin/orders — all orders with filters
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, date, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.created_at = { [Op.between]: [startOfDay, endOfDay] };
    }
    if (search) {
      where.order_number = { [Op.like]: `%${search}%` };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'phone', 'email'] },
        { model: User, as: 'deliveryBoy', attributes: ['id', 'name', 'phone'] },
        { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] },
        { model: Address, as: 'deliveryAddress' },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return paginated(res, rows, page, limit, count, 'All orders');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/orders/:id/status — update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) throw new NotFoundError('Order not found');

    const { status } = req.body;
    const validFlow = {
      placed: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered', 'cancelled'],
    };

    const allowed = validFlow[order.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestError(`Cannot change status from ${order.status} to ${status}`);
    }

    order.status = status;
    if (status === 'cancelled') {
      order.cancel_reason = req.body.reason || 'Cancelled by admin';
    }
    if (status === 'delivered') {
      order.payment_status = 'paid';
    }

    await order.save();

    return success(res, order, `Order status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/orders/:id/assign — assign delivery boy
exports.assignDeliveryBoy = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) throw new NotFoundError('Order not found');

    const { delivery_boy_id } = req.body;
    if (!delivery_boy_id) throw new BadRequestError('Delivery boy ID is required');

    const deliveryBoy = await User.findOne({
      where: { id: delivery_boy_id, role: 'delivery_boy', is_active: true },
    });
    if (!deliveryBoy) throw new BadRequestError('Invalid or inactive delivery boy');

    order.delivery_boy_id = delivery_boy_id;
    await order.save();

    return success(res, order, `Order assigned to ${deliveryBoy.name}`);
  } catch (err) {
    next(err);
  }
};
