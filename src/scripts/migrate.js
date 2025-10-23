const { testConnection, syncDatabase } = require('../config/database');
// Import all models to ensure they are registered with Sequelize
const models = require('../models');
require('dotenv').config();

const migrate = async () => {
  try {
    console.log('🔄 Running database migrations...\n');

    // Test connection
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    console.log('📦 Models loaded:', Object.keys(models).join(', '));
    console.log('');

    // Sync database (creates/updates tables)
    // Using force=true to drop and recreate all tables cleanly
    await syncDatabase(true);

    console.log('\n✅ Database migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
};

migrate();

