const bcrypt = require('bcryptjs');
const { sequelize, User, Category, MenuItem, Variation, Addon, RestaurantConfig } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true });
    console.log('Models synced');

    // 1. Admin User
    const existingAdmin = await User.findOne({ where: { email: 'admin@restaurant.com' } });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: 'admin@restaurant.com',
        phone: '9876543210',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Admin user created (admin@restaurant.com / admin123)');
    } else {
      console.log('Admin user already exists');
    }

    // 2. Restaurant Config
    const existingConfig = await RestaurantConfig.findOne();
    if (!existingConfig) {
      await RestaurantConfig.create({
        name: 'My Restaurant',
        phone: '9876543210',
        address: 'Main Street, City',
        opening_time: '10:00',
        closing_time: '23:00',
        min_order_amount: 200,
        delivery_charge: 50,
        tax_percentage: 5,
        delivery_radius_km: 15,
      });
      console.log('Restaurant config created');
    } else {
      console.log('Restaurant config already exists');
    }

    // 3. Categories
    const categories = [
      { name: 'Biryani', sort_order: 1 },
      { name: 'BBQ', sort_order: 2 },
      { name: 'Karahi', sort_order: 3 },
      { name: 'Rolls & Wraps', sort_order: 4 },
      { name: 'Drinks', sort_order: 5 },
      { name: 'Desserts', sort_order: 6 },
    ];

    for (const cat of categories) {
      const [category] = await Category.findOrCreate({
        where: { name: cat.name },
        defaults: cat,
      });
    }
    console.log('Categories seeded');

    // 4. Menu Items with Variations & Addons
    const biryani = await Category.findOne({ where: { name: 'Biryani' } });
    const bbq = await Category.findOne({ where: { name: 'BBQ' } });
    const drinks = await Category.findOne({ where: { name: 'Drinks' } });

    const menuItems = [
      {
        category_id: biryani.id,
        name: 'Chicken Biryani',
        description: 'Aromatic basmati rice with tender chicken pieces',
        price: 350,
        is_featured: true,
        prep_time: 30,
        variations: [{ name: 'Half', price: 200 }, { name: 'Full', price: 350 }],
        addons: [{ name: 'Extra Raita', price: 30 }, { name: 'Salad', price: 20 }],
      },
      {
        category_id: biryani.id,
        name: 'Mutton Biryani',
        description: 'Premium mutton biryani with special spices',
        price: 500,
        is_featured: true,
        prep_time: 40,
        variations: [{ name: 'Half', price: 300 }, { name: 'Full', price: 500 }],
        addons: [{ name: 'Extra Raita', price: 30 }],
      },
      {
        category_id: bbq.id,
        name: 'Chicken Tikka',
        description: 'Juicy boneless chicken tikka',
        price: 280,
        prep_time: 20,
        variations: [{ name: 'Half', price: 150 }, { name: 'Full', price: 280 }],
        addons: [{ name: 'Naan', price: 40 }, { name: 'Chutney', price: 15 }],
      },
      {
        category_id: bbq.id,
        name: 'Seekh Kebab',
        description: 'Minced meat seekh kebab grilled to perfection',
        price: 320,
        prep_time: 25,
        variations: [],
        addons: [{ name: 'Naan', price: 40 }, { name: 'Raita', price: 30 }],
      },
      {
        category_id: drinks.id,
        name: 'Lassi',
        description: 'Fresh sweet or salty lassi',
        price: 80,
        prep_time: 5,
        variations: [{ name: 'Sweet', price: 80 }, { name: 'Salty', price: 80 }, { name: 'Mango', price: 120 }],
        addons: [],
      },
    ];

    for (const item of menuItems) {
      const existing = await MenuItem.findOne({
        where: { name: item.name, category_id: item.category_id },
      });
      if (existing) continue;

      const { variations, addons, ...itemData } = item;
      const created = await MenuItem.create(itemData);

      for (const v of variations) {
        await Variation.create({ menu_item_id: created.id, ...v });
      }
      for (const a of addons) {
        await Addon.create({ menu_item_id: created.id, ...a });
      }
    }
    console.log('Menu items seeded');

    console.log('\nSeeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
