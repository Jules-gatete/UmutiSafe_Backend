const { testConnection, syncDatabase } = require('../config/database');
// Import all models to ensure they are registered with Sequelize
const models = require('../models');
require('dotenv').config();

const argv = new Set(process.argv.slice(2));
const force = argv.has('--force') || argv.has('--fresh') || argv.has('--reset');
const alter = !force && (argv.has('--alter') || argv.has('--safe-alter'));
const logSql = argv.has('--log-sql') || argv.has('--verbose');

if (force && alter) {
  console.warn('⚠️  Both --force and --alter were supplied. Force takes precedence and will drop/recreate all tables.');
}

const migrate = async () => {
  try {
    console.log('🔄 Running database migrations...\n');
    console.log(`   • Mode: ${force ? 'force (drop & recreate)' : alter ? 'alter (non-destructive)' : 'safe (create missing tables)'}${logSql ? ' + SQL logging' : ''}`);

    // Test connection
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    console.log('📦 Models loaded:', Object.keys(models).join(', '));
    console.log('');

    // Sync database (creates/updates tables) using the requested strategy
    await syncDatabase({
      force,
      alter,
      logging: logSql ? console.log : false
    });

    console.log('\n✅ Database migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
};

migrate();

