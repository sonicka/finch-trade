CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  friend_code TEXT UNIQUE,
  username TEXT,
  birb_name TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT
);

CREATE TABLE IF NOT EXISTS colors (
  id SERIAL PRIMARY KEY,
  color TEXT UNIQUE
);

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
);

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
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
);

CREATE TABLE IF NOT EXISTS trades_history (
  id SERIAL PRIMARY KEY,
  trade_id INTEGER,
  user_id1 INTEGER,
  user_id2 INTEGER,
  status TEXT DEFAULT 'archived',
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
);