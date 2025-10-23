const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Disposal = sequelize.define('Disposal', {
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
  genericName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brandName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dosageForm: {
    type: DataTypes.STRING,
    allowNull: true
  },
  packagingType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g., Blister Pack, Bottle, Tube'
  },
  predictedCategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  riskLevel: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: false
  },
  confidence: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    },
    comment: 'ML model confidence score (0-1)'
  },
  status: {
    type: DataTypes.ENUM('pending_review', 'pickup_requested', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending_review'
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Reason for disposal: expired, no_longer_needed, etc.'
  },
  disposalGuidance: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to uploaded medicine image'
  },
  pickupRequestId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'pickup_requests',
      key: 'id'
    }
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'disposals',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['risk_level'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Disposal;

