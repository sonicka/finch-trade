import sqlite3 from "sqlite3";
import { DEFAULT_COLORS, DEFAULT_USER } from "../constants.js";

const dropTablesFlag = process.argv.includes("--drop-tables");

const db = new sqlite3.Database(
  "./finch-trade.db",
  sqlite3.verbose(),
  (err) => {
    if (err) {
      console.error("Error opening database:", err);
    } else {
      console.log("Database connected");
    }
  }
);

if (dropTablesFlag) {
  console.log("Tables dropped");

  db.serialize(() => {
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS items");
    db.run("DROP TABLE IF EXISTS user_items");
    db.run("DROP TABLE IF EXISTS trades");
  });
} else {
  console.log("Skipping table drop");
}

db.serialize(() => {
  db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    friend_code TEXT UNIQUE,
    username TEXT,
    birb_name TEXT,
    password TEXT
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
    list_type TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
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
    item_color_id1 INTEGER,
    item_color_id2 INTEGER,
    status TEXT,
    FOREIGN KEY (user_id1) REFERENCES users(id),
    FOREIGN KEY (user_id2) REFERENCES users(id),
    FOREIGN KEY (item_color_id1) REFERENCES item_colors(id),
    FOREIGN KEY (item_color_id2) REFERENCES item_colors(id)
  )
`);

  if (dropTablesFlag) {
    DEFAULT_COLORS.forEach((color) => {
      db.run(
        `INSERT OR IGNORE INTO colors (color) VALUES (?)`,
        [color],
        (err) => {
          if (err) {
            console.error("Error inserting color:", err.message);
          }
        }
      );
    });
    db.run(
      `INSERT OR IGNORE INTO users (id, email, friend_code, username, birb_name, password) VALUES (?, ?, ?, ?, ?, ?)`,
      DEFAULT_USER,
      (err) => {
        if (err) {
          console.error("Error inserting user:", err.message);
        }
      }
    );
  }
});

export default db;
