import sqlite3 from "sqlite3";

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
db.serialize(() => {
  db.run("DROP TABLE IF EXISTS users");
  db.run("DROP TABLE IF EXISTS items");
  db.run("DROP TABLE IF EXISTS userItems");
  db.run("DROP TABLE IF EXISTS trades");

  db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    friendCode TEXT UNIQUE,
    username TEXT,
    birbName TEXT,
    password TEXT
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    color TEXT
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS userItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    itemId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (itemId) REFERENCES items(id)
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId1 INTEGER,
    userId2 INTEGER,
    itemId1 INTEGER,
    itemId2 INTEGER,
    status TEXT,
    FOREIGN KEY (userId1) REFERENCES users(id),
    FOREIGN KEY (userId2) REFERENCES users(id)
    FOREIGN KEY (itemId1) REFERENCES items(id),
    FOREIGN KEY (itemId2) REFERENCES items(id)
  )
`);
});

export default db;
