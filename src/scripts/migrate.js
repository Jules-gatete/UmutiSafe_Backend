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
    // Use FORCE_MIGRATE=true to drop & recreate all tables (destructive).
    // Default behavior is non-destructive (alter/update tables).
    const force = process.env.FORCE_MIGRATE === 'true';
    if (force && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  FORCE_MIGRATE is true in production — this will DROP and RECREATE all tables.');
    }

    await syncDatabase(force);

    console.log('\n✅ Database migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
};

migrate();

