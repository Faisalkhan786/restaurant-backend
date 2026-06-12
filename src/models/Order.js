const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  delivery_boy_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'),
    defaultValue: 'placed',
  },
  delivery_address_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  delivery_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  delivery_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('COD', 'online'),
    defaultValue: 'COD',
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
  },
  estimated_delivery_time: {
    type: DataTypes.INTEGER, // minutes
    allowNull: true,
  },
  cancel_reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'orders',
});

module.exports = Order;
