const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  label: {
    type: DataTypes.ENUM('Home', 'Office', 'Other'),
    defaultValue: 'Home',
  },
  full_address: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  area: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'addresses',
});

module.exports = Address;
