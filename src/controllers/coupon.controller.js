const { Coupon } = require('../models');
const { Op } = require('sequelize');
const { success } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// ==================== ADMIN ====================

// POST /api/admin/coupons
exports.createCoupon = async (req, res, next) => {
  try {
    const existing = await Coupon.findOne({ where: { code: req.body.code } });
    if (existing) throw new BadRequestError('Coupon code already exists');

    const coupon = await Coupon.create(req.body);
    return success(res, coupon, 'Coupon created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/coupons
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.findAll({ order: [['created_at', 'DESC']] });
    return success(res, coupons, 'All coupons');
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/coupons/:id
exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) throw new NotFoundError('Coupon not found');

    await coupon.update(req.body);
    return success(res, coupon, 'Coupon updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/coupons/:id
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) throw new NotFoundError('Coupon not found');

    await coupon.destroy();
    return success(res, null, 'Coupon deleted');
  } catch (err) {
    next(err);
  }
};

// ==================== CUSTOMER ====================

// GET /api/coupons/validate/:code
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { subtotal } = req.query;

    if (!subtotal) throw new BadRequestError('Subtotal is required to validate coupon');

    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase(), is_active: true },
    });

    if (!coupon) throw new NotFoundError('Invalid coupon code');

    // Check expiry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(coupon.expiry_date);
    if (expiry < today) {
      throw new BadRequestError('Coupon has expired');
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      throw new BadRequestError('Coupon usage limit reached');
    }

    // Check min order
    const orderSubtotal = parseFloat(subtotal);
    if (orderSubtotal < parseFloat(coupon.min_order)) {
      throw new BadRequestError(`Minimum order of Rs. ${coupon.min_order} required for this coupon`);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'flat') {
      discount = parseFloat(coupon.value);
    } else {
      discount = (orderSubtotal * parseFloat(coupon.value)) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, parseFloat(coupon.max_discount));
      }
    }

    return success(res, {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: discount.toFixed(2),
      message: `You save Rs. ${discount.toFixed(2)}`,
    }, 'Coupon is valid');
  } catch (err) {
    next(err);
  }
};
