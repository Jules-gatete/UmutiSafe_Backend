const { Client } = require('pg');
const fs = require('fs');

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
} catch (err) {
  console.warn('Failed to sanitize DATABASE_URL:', err.message);
}

const raw = fs.readFileSync('prod-ca-chain.crt', 'utf8');
const parts = raw
  .split(/(?=-----BEGIN CERTIFICATE-----)/g)
  .map((part) => part.trim())
  .filter(Boolean)
  .map((part) => (part.endsWith('\n') ? part : `${part}\n`));
const caBundle = parts.join('');

const { hostname } = new URL(connectionString);

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: true,
  ca: caBundle,
    servername: hostname,
  },
});

console.log('Client SSL config before connect:', client.connectionParameters.ssl);

client
  .connect()
  .then(() => client.query('SELECT version();'))
  .then((res) => {
    console.log(res.rows[0].version);
  })
  .catch((err) => {
    console.error('PG error', err);
  })
  .finally(() => client.end());
