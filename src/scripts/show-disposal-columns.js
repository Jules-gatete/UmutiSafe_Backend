const { sequelize } = require('../config/database');
require('dotenv').config();

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    const [rows] = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'disposals'
      ORDER BY ordinal_position;
    `);
    console.table(rows);
  } catch (err) {
    console.error('❌ Error fetching columns:', err.message);
    console.error(err);
  } finally {
    await sequelize.close().catch(() => {});
  }
})();
