const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const tableName = 'registered_medicines';

const columns = [
  {
    name: 'registration_number',
    options: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Regulatory registration number'
    }
  },
  {
    name: 'pack_size',
    options: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    name: 'packaging_type',
    options: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    name: 'shelf_life',
    options: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Shelf life duration'
    }
  },
  {
    name: 'manufacturer_address',
    options: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    name: 'manufacturer_country',
    options: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    name: 'marketing_authorization_holder',
    options: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    name: 'local_technical_representative',
    options: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    name: 'registration_date',
    options: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    name: 'expiry_date',
    options: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }
];

const indexes = [
  { name: 'registered_medicines_generic_name', fields: ['generic_name'] },
  { name: 'registered_medicines_brand_name', fields: ['brand_name'] },
  { name: 'registered_medicines_registration_number', fields: ['registration_number'] },
  { name: 'registered_medicines_category', fields: ['category'] },
  { name: 'registered_medicines_risk_level', fields: ['risk_level'] }
];

(async () => {
  const qi = sequelize.getQueryInterface();

  try {
    const definition = await qi.describeTable(tableName);

    for (const column of columns) {
      if (!definition[column.name]) {
        console.log(`➕ Adding column ${column.name}`);
        await qi.addColumn(tableName, column.name, column.options);
      } else {
        console.log(`✔️  Column ${column.name} already exists`);
      }
    }

    const existingIndexes = await qi.showIndex(tableName);
    const existingIndexNames = new Set(existingIndexes.map((idx) => idx.name));

    for (const index of indexes) {
      if (!existingIndexNames.has(index.name)) {
        console.log(`➕ Creating index ${index.name}`);
        await qi.addIndex(tableName, {
          name: index.name,
          fields: index.fields
        });
      } else {
        console.log(`✔️  Index ${index.name} already exists`);
      }
    }

    console.log('\n✅ Medicine table patch completed successfully');
  } catch (error) {
    console.error('\n❌ Failed to patch medicines table');
    console.error(error);
  } finally {
    await sequelize.close();
  }
})();
