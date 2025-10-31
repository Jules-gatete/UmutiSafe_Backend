const { Sequelize } = require('sequelize');
require('dotenv').config();

// If a single DATABASE_URL is provided (common on hosting platforms like Render,
// Heroku, etc.), use it. Otherwise fall back to individual DB_* environment
// variables for local development.
let sequelize;
if (process.env.DATABASE_URL) {
  // Provide sensible defaults for hosted DBs. Some hosts require SSL; allow an
  // opt-in via DB_SSL=true (or default to true in production).
  const useSsl = process.env.DB_SSL ? process.env.DB_SSL === 'true' : (process.env.NODE_ENV === 'production');

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'umutisafe_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    }
  );
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    // Print the full error object to make hosted-deploy logs more useful.
    console.error('❌ Unable to connect to the database:');
    console.error(error);
    return false;
  }
};

// Wait for the DB to be ready with retries and exponential backoff. This is
// useful on hosted platforms where the app may start before the managed
// database is fully available. Exported so server startup can await it.
const waitForConnection = async (opts = {}) => {
  const maxAttempts = opts.maxAttempts || Number(process.env.DB_CONNECT_MAX_ATTEMPTS) || 8;
  const initialDelay = opts.initialDelayMs || 1000; // 1s

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log(`✅ Database connection established (attempt ${attempt}).`);
      return true;
    } catch (err) {
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`⚠️ Database connect attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`);
      console.warn(err.message || err);
      // On last attempt, rethrow so caller can handle exit
      if (attempt === maxAttempts) {
        console.error('❌ All attempts to connect to the database have failed.');
        return false;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  return false;
};

// Sync all models with database (creates tables automatically)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log(`✅ Database synchronized successfully. ${force ? '(Force mode - all tables recreated)' : '(Alter mode - tables updated)'}`);
  } catch (error) {
    console.error('❌ Error synchronizing database:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  waitForConnection,
  syncDatabase
};

