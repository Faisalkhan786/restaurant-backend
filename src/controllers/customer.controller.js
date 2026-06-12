const { User, Address } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// GET /api/customer/profile
exports.getProfile = async (req, res, next) => {
  try {
    return success(res, { user: req.user.toJSON() }, 'Customer profile');
  } catch (err) {
    next(err);
  }
};

// PUT /api/customer/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar_url } = req.body;

    if (name !== undefined) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    if (avatar_url !== undefined) req.user.avatar_url = avatar_url;

    await req.user.save();

    return success(res, { user: req.user.toJSON() }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// POST /api/customer/addresses
exports.addAddress = async (req, res, next) => {
  try {
    const { label, full_address, area, city, lat, lng, is_default } = req.body;

    if (!full_address) throw new BadRequestError('Full address is required');

    // If setting as default, unset other defaults
    if (is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }

    const address = await Address.create({
      user_id: req.user.id,
      label, full_address, area, city, lat, lng, is_default: is_default || false,
    });

    return success(res, address, 'Address added', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/customer/addresses
exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({
      where: { user_id: req.user.id },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']],
    });

    return success(res, addresses, 'Addresses list');
  } catch (err) {
    next(err);
  }
};

// PUT /api/customer/addresses/:id
exports.updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!address) throw new NotFoundError('Address not found');

    const { label, full_address, area, city, lat, lng, is_default } = req.body;

    if (is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }

    if (label !== undefined) address.label = label;
    if (full_address !== undefined) address.full_address = full_address;
    if (area !== undefined) address.area = area;
    if (city !== undefined) address.city = city;
    if (lat !== undefined) address.lat = lat;
    if (lng !== undefined) address.lng = lng;
    if (is_default !== undefined) address.is_default = is_default;

    await address.save();

    return success(res, address, 'Address updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/customer/addresses/:id
exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!address) throw new NotFoundError('Address not found');

    await address.destroy();

    return success(res, null, 'Address deleted');
  } catch (err) {
    next(err);
  }
};
