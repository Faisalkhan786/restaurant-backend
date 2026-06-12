const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM('flat', 'percent'),
    allowNull: false,
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  min_order: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  max_discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = unlimited
  },
  used_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'coupons',
});

module.exports = Coupon;
