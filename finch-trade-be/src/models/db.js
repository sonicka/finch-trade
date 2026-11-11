import pg from 'pg';
import { runTransaction } from './transaction.js';
import { config, getDatabaseConnectionString } from '../config/env.js';

const { Pool } = pg;
const connectionString = getDatabaseConnectionString();

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: true },
  max: config.databasePoolMax,
  idleTimeoutMillis: config.databaseIdleTimeoutMs,
  connectionTimeoutMillis: config.databaseConnectionTimeoutMs,
});

pool.on('error', (error) => {
  console.error('Unexpected idle database client error:', error);
});

const ready = pool.query('SELECT 1').then(() => {
  console.log('Database connected');
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
