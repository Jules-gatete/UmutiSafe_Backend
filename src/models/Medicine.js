const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Medicine = sequelize.define('Medicine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  genericName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  brandName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dosageForm: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g., Tablet, Capsule, Syrup, Injection'
  },
  strength: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g., 500mg, 250mg'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g., Analgesic, Antibiotic, Controlled Substance'
  },
  riskLevel: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: false,
    defaultValue: 'LOW'
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fdaApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  disposalInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'medicines',
  indexes: [
    { fields: ['generic_name'] },
    { fields: ['brand_name'] },
    { fields: ['category'] },
    { fields: ['risk_level'] }
  ]
});

module.exports = Medicine;

