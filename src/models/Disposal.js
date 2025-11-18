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
  medicineName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Normalized medicine name returned by the ML model'
  },
  inputGenericName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Original generic name interpreted by the model'
  },
  predictedCategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  predictedCategoryConfidence: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    }
  },
  riskLevel: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: true,
    defaultValue: null
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 4),
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
  handlingMethod: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Primary recommended handling method from ML model'
  },
  disposalRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categoryCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  categoryLabel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  similarGenericName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  similarityDistance: {
    type: DataTypes.DECIMAL(6, 4),
    allowNull: true
  },
  predictionInputType: {
    type: DataTypes.ENUM('text', 'image', 'manual'),
    allowNull: true,
    defaultValue: null
  },
  predictionSource: {
    type: DataTypes.STRING,
    allowNull: true
  },
  modelVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  analysis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  disposalMethods: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  dosageForms: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  manufacturers: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  messages: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  errors: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  predictionDetails: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Structured predictions payload straight from the ML model'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional data returned by the ML service (e.g., full raw response)'
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
    { fields: ['prediction_input_type'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Disposal;

