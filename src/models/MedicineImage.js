const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MedicineImage = sequelize.define('MedicineImage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  disposalId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'disposals',
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'medicine_images',
  indexes: [
    { fields: ['disposal_id'] }
  ]
});

module.exports = MedicineImage;
