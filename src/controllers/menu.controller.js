const { Category, MenuItem, Variation, Addon } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const s3Service = require('../services/s3.service');

// ==================== PUBLIC ====================

// GET /api/menu — full menu with categories and items
exports.getFullMenu = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      include: [{
        model: MenuItem,
        as: 'items',
        where: { is_available: true },
        required: false,
        include: [
          { model: Variation, as: 'variations' },
          { model: Addon, as: 'addons' },
        ],
      }],
    });

    return success(res, categories, 'Full menu');
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/:categoryId — items by category
exports.getByCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.categoryId, {
      include: [{
        model: MenuItem,
        as: 'items',
        where: { is_available: true },
        required: false,
        include: [
          { model: Variation, as: 'variations' },
          { model: Addon, as: 'addons' },
        ],
      }],
    });

    if (!category) throw new NotFoundError('Category not found');

    return success(res, category, 'Category items');
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/item/:id — single item detail
exports.getItemDetail = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Variation, as: 'variations' },
        { model: Addon, as: 'addons' },
      ],
    });

    if (!item) throw new NotFoundError('Menu item not found');

    return success(res, item, 'Item detail');
  } catch (err) {
    next(err);
  }
};

// ==================== ADMIN: CATEGORIES ====================

// POST /api/admin/categories
exports.createCategory = async (req, res, next) => {
  try {
    const { name, sort_order, is_active } = req.body;

    let image_url = null;
    if (req.file) {
      const uploaded = await s3Service.uploadFile(req.file);
      image_url = uploaded.url;
    }

    const category = await Category.create({ name, image_url, sort_order, is_active });

    return success(res, category, 'Category created', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) throw new NotFoundError('Category not found');

    const { name, sort_order, is_active } = req.body;

    if (req.file) {
      const uploaded = await s3Service.uploadFile(req.file);
      category.image_url = uploaded.url;
    }

    if (name !== undefined) category.name = name;
    if (sort_order !== undefined) category.sort_order = sort_order;
    if (is_active !== undefined) category.is_active = is_active;

    await category.save();

    return success(res, category, 'Category updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) throw new NotFoundError('Category not found');

    await category.destroy();

    return success(res, null, 'Category deleted');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/categories — all categories (including inactive)
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
    });

    return success(res, categories, 'All categories');
  } catch (err) {
    next(err);
  }
};

// ==================== ADMIN: MENU ITEMS ====================

// POST /api/admin/items
exports.createItem = async (req, res, next) => {
  try {
    const { category_id, name, description, price, is_available, is_featured, prep_time, variations, addons } = req.body;

    const category = await Category.findByPk(category_id);
    if (!category) throw new BadRequestError('Invalid category_id');

    let image_url = null;
    if (req.file) {
      const uploaded = await s3Service.uploadFile(req.file);
      image_url = uploaded.url;
    }

    const item = await MenuItem.create({
      category_id, name, description, price, image_url,
      is_available, is_featured, prep_time,
    });

    // Create variations if provided
    if (variations && Array.isArray(JSON.parse(variations || '[]'))) {
      const parsedVariations = JSON.parse(variations);
      for (const v of parsedVariations) {
        await Variation.create({ menu_item_id: item.id, name: v.name, price: v.price });
      }
    }

    // Create addons if provided
    if (addons && Array.isArray(JSON.parse(addons || '[]'))) {
      const parsedAddons = JSON.parse(addons);
      for (const a of parsedAddons) {
        await Addon.create({ menu_item_id: item.id, name: a.name, price: a.price });
      }
    }

    // Fetch complete item with relations
    const fullItem = await MenuItem.findByPk(item.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Variation, as: 'variations' },
        { model: Addon, as: 'addons' },
      ],
    });

    return success(res, fullItem, 'Menu item created', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/items/:id
exports.updateItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) throw new NotFoundError('Menu item not found');

    const { category_id, name, description, price, is_available, is_featured, prep_time, variations, addons } = req.body;

    if (req.file) {
      const uploaded = await s3Service.uploadFile(req.file);
      item.image_url = uploaded.url;
    }

    if (category_id !== undefined) item.category_id = category_id;
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = price;
    if (is_available !== undefined) item.is_available = is_available;
    if (is_featured !== undefined) item.is_featured = is_featured;
    if (prep_time !== undefined) item.prep_time = prep_time;

    await item.save();

    // Update variations if provided
    if (variations) {
      await Variation.destroy({ where: { menu_item_id: item.id } });
      const parsedVariations = JSON.parse(variations);
      for (const v of parsedVariations) {
        await Variation.create({ menu_item_id: item.id, name: v.name, price: v.price });
      }
    }

    // Update addons if provided
    if (addons) {
      await Addon.destroy({ where: { menu_item_id: item.id } });
      const parsedAddons = JSON.parse(addons);
      for (const a of parsedAddons) {
        await Addon.create({ menu_item_id: item.id, name: a.name, price: a.price });
      }
    }

    const fullItem = await MenuItem.findByPk(item.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Variation, as: 'variations' },
        { model: Addon, as: 'addons' },
      ],
    });

    return success(res, fullItem, 'Menu item updated');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/items/:id/toggle — availability toggle
exports.toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) throw new NotFoundError('Menu item not found');

    item.is_available = !item.is_available;
    await item.save();

    return success(res, item, `Item ${item.is_available ? 'available' : 'unavailable'}`);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/items/:id
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) throw new NotFoundError('Menu item not found');

    // Delete related variations and addons
    await Variation.destroy({ where: { menu_item_id: item.id } });
    await Addon.destroy({ where: { menu_item_id: item.id } });
    await item.destroy();

    return success(res, null, 'Menu item deleted');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/items — all items (including unavailable)
exports.getAllItems = async (req, res, next) => {
  try {
    const { category_id, search } = req.query;
    const where = {};

    if (category_id) where.category_id = category_id;

    const items = await MenuItem.findAll({
      where,
      include: [
        { model: Category, as: 'category' },
        { model: Variation, as: 'variations' },
        { model: Addon, as: 'addons' },
      ],
      order: [['created_at', 'DESC']],
    });

    return success(res, items, 'All items');
  } catch (err) {
    next(err);
  }
};
