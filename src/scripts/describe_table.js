// backend/src/scripts/describe_table.js
require('dotenv').config();
const { sequelize } = require('../config/database');

const tableName = process.argv[2] || 'medicine_images';

(async () => {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = :table
       ORDER BY ordinal_position;`,
      { replacements: { table: tableName } }
    );
    console.log(`\nColumns in table "${tableName}":\n`);
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error describing table:', err.message || err);
    process.exit(1);
  }
})();