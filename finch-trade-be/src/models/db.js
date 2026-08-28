import pg from 'pg';
import 'dotenv/config';
import { runTransaction } from './transaction.js';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL?.replace(
  /([?&]sslmode=)require\b/,
  '$1verify-full',
);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: true },
  max: Number.parseInt(process.env.DB_POOL_MAX, 10) || 10,
  idleTimeoutMillis:
    Number.parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10) || 30000,
  connectionTimeoutMillis:
    Number.parseInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10) || 10000,
});

pool.on('error', (error) => {
  console.error('Unexpected idle database client error:', error);
});

const ready = pool.query('SELECT 1').then(() => {
  console.log('Database connected to Neon');
});
const query = (text, params = [], executor = pool) =>
  ready.then(() => executor.query(text, params));

const db = {
  get(text, params, callback, executor = pool) {
    query(text, params, executor)
      .then((result) => callback(null, result.rows[0]))
      .catch((error) => callback(error));
  },
  all(text, params, callback, executor = pool) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    query(text, params, executor)
      .then((result) => callback(null, result.rows))
      .catch((error) => callback(error));
  },
  run(text, params, callback, executor = pool) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    query(text, params, executor)
      .then((result) =>
        callback?.call(
          {
            lastID: result.rows[0]?.id,
            changes: result.rowCount,
          },
          null,
        ),
      )
      .catch((error) => callback?.call({}, error));
  },
  transaction(callback) {
    return runTransaction(pool, callback, ready);
  },
  waitUntilReady() {
    return ready;
  },
  close() {
    return pool.end();
  },
};

export default db;
