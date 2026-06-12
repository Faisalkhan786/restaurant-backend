const sequelize = require('../config/database');
const User = require('./User');
const Address = require('./Address');
const Category = require('./Category');
const MenuItem = require('./MenuItem');
const Variation = require('./Variation');
const Addon = require('./Addon');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const RestaurantConfig = require('./RestaurantConfig');
const DeliveryBoyProfile = require('./DeliveryBoy');
const Coupon = require('./Coupon');

// User <-> Address
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id' });

// Category <-> MenuItem
Category.hasMany(MenuItem, { foreignKey: 'category_id', as: 'items' });
MenuItem.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// MenuItem <-> Variation
MenuItem.hasMany(Variation, { foreignKey: 'menu_item_id', as: 'variations' });
Variation.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });

// MenuItem <-> Addon
MenuItem.hasMany(Addon, { foreignKey: 'menu_item_id', as: 'addons' });
Addon.belongsTo(MenuItem, { foreignKey: 'menu_item_id' });

// User (customer) <-> Order
User.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

// User (delivery boy) <-> Order
Order.belongsTo(User, { foreignKey: 'delivery_boy_id', as: 'deliveryBoy' });

// Order <-> Address
Order.belongsTo(Address, { foreignKey: 'delivery_address_id', as: 'deliveryAddress' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

// OrderItem <-> MenuItem
OrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem' });

// User <-> DeliveryBoyProfile
User.hasOne(DeliveryBoyProfile, { foreignKey: 'user_id', as: 'deliveryProfile' });
DeliveryBoyProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const db = {
  sequelize,
  User,
  Address,
  Category,
  MenuItem,
  Variation,
  Addon,
  Order,
  OrderItem,
  RestaurantConfig,
  DeliveryBoyProfile,
  Coupon,
};

module.exports = db;
