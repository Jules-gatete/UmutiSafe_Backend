const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// If a single DATABASE_URL is provided (common on hosting platforms like Render,
// Heroku, etc.), use it. Otherwise fall back to individual DB_* environment
// variables for local development.
let sequelize;

if (process.env.DATABASE_URL) {
  // Production/hosted database configuration
  const dbUrl = process.env.DATABASE_URL;
  let inferredHost = '';
  let urlSslMode;

  try {
    const parsed = new URL(dbUrl);
    inferredHost = parsed.hostname || '';
    urlSslMode = parsed.searchParams.get('sslmode');
  } catch (err) {
    // Leave host empty if URL parsing fails; logging handled below.
  }

  const explicitSsl = process.env.DB_SSL ? process.env.DB_SSL === 'true' : undefined;
  const hostRequiresSsl = inferredHost && !/^(localhost|127\.0\.0\.1)$/i.test(inferredHost);
  const urlRequestsSsl = urlSslMode && urlSslMode !== 'disable';

  const useSsl =
    explicitSsl !== undefined
      ? explicitSsl
      : Boolean(isProduction || hostRequiresSsl || urlRequestsSsl);

  let sslOptions;
  if (useSsl) {
    sslOptions = {
      require: true,
      rejectUnauthorized: false
    };

    // Support providing a CA certificate either as plain text or base64 encoded string.
    // This allows platforms like Render to inject the Supabase CA via env vars without
    // writing files to disk.
    const caEnv = process.env.DB_SSL_CA || process.env.DB_SSL_CERT;
    const caFile = process.env.DB_SSL_CA_FILE || process.env.DB_SSL_CERT_FILE;

    try {
      if (!caEnv && caFile) {
        const fs = require('fs');
        if (fs.existsSync(caFile)) {
          sslOptions.ca = fs.readFileSync(caFile, 'utf8');
        }
      } else if (caEnv) {
        const trimmed = caEnv.trim();
        sslOptions.ca = trimmed.includes('-----BEGIN CERTIFICATE-----')
          ? trimmed
          : Buffer.from(trimmed, 'base64').toString('utf8');
        // A trusted CA is available, so strict verification can be enabled safely.
        sslOptions.rejectUnauthorized = true;
      }
    } catch (err) {
      console.warn('⚠️ Failed to load DB SSL CA certificate from environment:', err.message);
    }
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: !isProduction ? console.log : false,
    dialectOptions: useSsl ? { ssl: sslOptions } : {},
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
  
  console.log(`📡 Using DATABASE_URL for connection${useSsl ? ' with SSL enabled' : ''}`);
  if (useSsl && sslOptions && sslOptions.ca) {
    const strict = sslOptions.rejectUnauthorized !== false;
    console.log(`🔐 Custom CA certificate loaded for database connection${strict ? ' (strict verification enabled)' : ''}.`);
  }
  if (!useSsl) {
    console.warn('⚠️ SSL is disabled for DATABASE_URL connections. Set DB_SSL=true to enable certificate handling.');
  }
} else {
  // Local development configuration
  sequelize = new Sequelize(
    process.env.DB_NAME || 'umutisafe_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log,
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
  
  console.log('📡 Using local database configuration');
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:');
    console.error(error);
    return false;
  }
};

// Wait for the DB to be ready with retries and exponential backoff
const waitForConnection = async (opts = {}) => {
  const maxAttempts = opts.maxAttempts || Number(process.env.DB_CONNECT_MAX_ATTEMPTS) || 8;
  const initialDelay = opts.initialDelayMs || 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log(`✅ Database connection established (attempt ${attempt}).`);
      return true;
    } catch (err) {
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`⚠️ Database connect attempt ${attempt}/${maxAttempts} failed. Retrying in ${Math.round(delay)}ms...`);
      console.warn(err.message || err);
      
      if (attempt === maxAttempts) {
        console.error('❌ All attempts to connect to the database have failed.');
        return false;
      }
      
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  return false;
};

// Sync all models with database. Accepts either a boolean (treated as `force`)
// or an options object with { force, alter, logging } for finer control.
const syncDatabase = async (options = {}) => {
  const opts =
    typeof options === 'boolean'
      ? { force: options }
      : options || {};
  const {
    force = false,
    alter = false,
    logging = false
  } = opts;

  try {
    // Note: Sequelize's `alter: true` can emit complex ALTER statements for Postgres
    // that may include `USING` after COMMENT statements in some versions and edge-cases
    // (seen as "syntax error at or near \"USING\""). To avoid generating
    // invalid SQL during automatic alters, only attempt an alter when it is
    // explicitly requested. Otherwise fall back to creating missing tables.
    if (force) {
      await sequelize.sync({ force: true, logging });
      console.log('✅ Database synchronized successfully. (Force mode - all tables recreated)');
    } else if (alter) {
      await sequelize.sync({ alter: true, logging });
      console.log('✅ Database synchronized successfully. (Alter mode - attempting non-destructive changes)');
    } else {
      // For non-force runs, use plain sync() which creates missing tables but does
      // not attempt to alter existing columns/types. This avoids the Postgres enum
      // ALTER ordering bug while keeping non-destructive behaviour.
      await sequelize.sync({ logging });
      console.log('✅ Database synchronized successfully. (Safe sync - create missing tables only)');
    }
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