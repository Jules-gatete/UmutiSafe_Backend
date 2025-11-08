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
    // Brand names can be lengthy; use TEXT to avoid 255-char overflow from CSVs
    type: DataTypes.TEXT,
    allowNull: true
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Regulatory registration number'
  },
  dosageForm: {
    // Some sources include very descriptive dosage forms; allow TEXT
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'e.g., Tablet, Capsule, Syrup, Injection'
  },
  strength: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'e.g., 500mg, 250mg'
  },
  packSize: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  packagingType: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shelfLife: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Shelf life duration'
  },
  category: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'e.g., Analgesic, Antibiotic, Controlled Substance'
  },
  riskLevel: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: false,
    defaultValue: 'LOW'
  },
  manufacturer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  manufacturerAddress: {
    // Addresses routinely exceed 255 chars; store as TEXT
    type: DataTypes.TEXT,
    allowNull: true
  },
  manufacturerCountry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  marketingAuthorizationHolder: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  localTechnicalRepresentative: {
    type: DataTypes.TEXT,
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
  registrationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'registered_medicines',
  indexes: [
    { fields: ['generic_name'] },
    { fields: ['brand_name'] },
    { fields: ['registration_number'] },
    { fields: ['category'] },
    { fields: ['risk_level'] }
  ]
});

module.exports = Medicine;

