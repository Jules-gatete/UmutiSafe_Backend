const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EducationTip = sequelize.define('EducationTip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Icon name for frontend display'
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g., safety, storage, disposal, general'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'education_tips',
  indexes: [
    { fields: ['category'] },
    { fields: ['is_active'] },
    { fields: ['display_order'] }
  ]
});

module.exports = EducationTip;

