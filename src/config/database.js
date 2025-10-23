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
  syncDatabase
};

