const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliveryBoyProfile = sequelize.define('DeliveryBoyProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  vehicle_type: {
    type: DataTypes.ENUM('bike', 'scooter', 'bicycle', 'car'),
    defaultValue: 'bike',
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  current_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  current_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
}, {
  tableName: 'delivery_boy_profiles',
});

module.exports = DeliveryBoyProfile;
