const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  menu_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  variation_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  variation_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  addons: {
    type: DataTypes.JSON, // [{name, price}]
    allowNull: true,
  },
}, {
  tableName: 'order_items',
});

module.exports = OrderItem;
