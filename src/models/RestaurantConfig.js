const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantConfig = sequelize.define('RestaurantConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  opening_time: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  closing_time: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  min_order_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  delivery_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  delivery_radius_km: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10,
  },
}, {
  tableName: 'restaurant_config',
});

module.exports = RestaurantConfig;
