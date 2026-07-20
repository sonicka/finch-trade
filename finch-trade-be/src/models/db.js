import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { DEFAULT_COLORS, TEST_USERS } from '../config/constants.js';

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../db/finch-trade.db');

const dropTablesFlag = process.argv.includes('--drop-tables');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log(`Database connected: ${dbPath}`);
  }
});

if (dropTablesFlag) {
  console.log('Tables dropped');

  db.serialize(() => {
    db.run('DROP TABLE IF EXISTS users');
    db.run('DROP TABLE IF EXISTS items');
    db.run('DROP TABLE IF EXISTS user_items');
    db.run('DROP TABLE IF EXISTS colors');
    db.run('DROP TABLE IF EXISTS trades');
    db.run('DROP TABLE IF EXISTS trades_history');
  });
} else {
  console.log('Skipping table drop');
}

db.serialize(() => {
  db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    friend_code TEXT UNIQUE,
    username TEXT,
    birb_name TEXT,
    password TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    color TEXT UNIQUE
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS user_items (
    user_id INTEGER,
    item_id INTEGER,
    color_id INTEGER,
    list_type TEXT CHECK(list_type IN ('wishlist', 'tradelist')),
    in_trade_with_user INTEGER NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (color_id) REFERENCES colors(id),
    PRIMARY KEY (user_id, item_id, color_id, list_type)
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id1 INTEGER,
    user_id2 INTEGER,
    status TEXT DEFAULT 'new',
    requested_by TEXT NOT NULL DEFAULT '[]',
    finished_by TEXT NOT NULL DEFAULT '[]',
    valid_until TIMESTAMP,
    item_id1 INTEGER,
    item_id2 INTEGER,
    color_id1 INTEGER,
    color_id2 INTEGER,
    FOREIGN KEY (user_id1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id2) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id1) REFERENCES items(id),
    FOREIGN KEY (item_id2) REFERENCES items(id),
    FOREIGN KEY (color_id1) REFERENCES colors(id),
    FOREIGN KEY (color_id2) REFERENCES colors(id)
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS trades_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id INTEGER,
    user_id1 INTEGER,
    user_id2 INTEGER,
    status TEXT DEFAULT 'archived',
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    item_id1 INTEGER,
    item_id2 INTEGER,
    color_id1 INTEGER,
    color_id2 INTEGER,
    FOREIGN KEY (user_id1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id2) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id1) REFERENCES items(id),
    FOREIGN KEY (item_id2) REFERENCES items(id),
    FOREIGN KEY (color_id1) REFERENCES colors(id),
    FOREIGN KEY (color_id2) REFERENCES colors(id)
  )
`);

  if (dropTablesFlag) {
    DEFAULT_COLORS.forEach((color) => {
      db.run(
        `INSERT OR IGNORE INTO colors (color) VALUES (?)`,
        [color],
        (err) => {
          if (err) {
            console.error('Error inserting color:', err.message);
          }
        },
      );
    });
    TEST_USERS.forEach((user) => {
      db.run(
        `INSERT OR IGNORE INTO users (id, email, friend_code, username, birb_name, password) VALUES (?, ?, ?, ?, ?, ?)`,
        user,
        (err) => {
          if (err) {
            console.error('Error inserting user:', err.message);
          }
        },
      );
    });
  }
});

export default db;
