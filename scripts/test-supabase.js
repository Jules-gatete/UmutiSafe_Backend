const { Pool } = require('pg');
const { URL } = require('url');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

let connectionString = dbUrl;
try {
  const parsed = new URL(dbUrl);
  if (parsed.searchParams.has('sslmode')) {
    const originalMode = parsed.searchParams.get('sslmode');
    parsed.searchParams.delete('sslmode');
    connectionString = parsed.toString();
    console.log(`Removed sslmode=${originalMode} from connection string for custom TLS handling.`);
  }
  if (parsed.searchParams.has('options')) {
    console.log('Connection string options param:', parsed.searchParams.get('options'));
  }
  if (parsed.searchParams.has('pgbouncer')) {
    console.log('Connection string pgbouncer param:', parsed.searchParams.get('pgbouncer'));
  }
} catch (err) {
  console.warn('Failed to sanitize DATABASE_URL:', err.message);
}

const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
let sslOptions;

if (useSsl) {
  sslOptions = {
    require: true,
    rejectUnauthorized: true,
  };

  const caEnv = process.env.DB_SSL_CA || process.env.DB_SSL_CERT;
  const caFile = process.env.DB_SSL_CA_FILE || process.env.DB_SSL_CERT_FILE;
  if (caEnv || caFile) {
    try {
      let pem = '';
      if (caEnv) {
        const trimmed = caEnv.trim();
        pem = trimmed.includes('-----BEGIN CERTIFICATE-----')
          ? trimmed
          : Buffer.from(trimmed, 'base64').toString('utf8');
      }
      if (!pem && caFile) {
        const fs = require('fs');
        const path = require('path');
        const resolved = path.resolve(caFile);
        pem = fs.readFileSync(resolved, 'utf8');
      }

      const parts = pem.split(/(?=-----BEGIN CERTIFICATE-----)/g)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => (part.endsWith('\n') ? part : `${part}\n`));

      sslOptions.ca = parts;
      console.log(`Loaded ${parts.length} CA cert(s).`);
      // Also provide Buffer variants for stricter TLS contexts
      sslOptions._caBuffers = parts.map((part) => Buffer.from(part));
    } catch (err) {
      console.error('Failed to load DB SSL CA data:', err.message);
      process.exit(1);
    }
  }
}

const tlsOptions = { ...sslOptions };
if (tlsOptions && tlsOptions._caBuffers) {
  tlsOptions.ca = tlsOptions._caBuffers;
  delete tlsOptions._caBuffers;
}
if (tlsOptions) {
  try {
    const { hostname } = new URL(connectionString);
    tlsOptions.servername = hostname;
  } catch (err) {
    console.warn('Failed to derive servername from DATABASE_URL:', err.message);
  }
}

if (useSsl) {
  console.log('TLS options prepared:', {
    rejectUnauthorized: tlsOptions.rejectUnauthorized,
    require: tlsOptions.require,
    caCount: Array.isArray(tlsOptions.ca) ? tlsOptions.ca.length : (tlsOptions.ca ? 1 : 0),
    hasServername: Boolean(tlsOptions.servername)
  });
}

const pool = new Pool({
  connectionString,
  ssl: useSsl ? tlsOptions : undefined,
});

pool.query('SELECT version();')
  .then((res) => {
    console.log('Connected successfully. PostgreSQL version:', res.rows[0].version);
  })
  .catch((err) => {
    console.error('Connection error:', err);
  })
  .finally(() => pool.end());
