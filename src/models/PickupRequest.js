const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PickupRequest = sequelize.define('PickupRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  chwId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  medicineName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  disposalGuidance: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'expired, no_longer_needed, completed_treatment, adverse_reaction, other'
  },
  pickupLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  preferredTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'scheduled', 'collected', 'completed', 'cancelled', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  consentGiven: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  chwNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes added by CHW'
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'pickup_requests',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['chw_id'] },
    { fields: ['status'] },
    { fields: ['preferred_time'] },
    { fields: ['created_at'] }
  ]
});

module.exports = PickupRequest;

