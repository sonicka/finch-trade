import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');

const readBackendFile = (path) =>
  readFile(join(backendDirectory, path), 'utf8');

test('migrations are numbered and include the current schema fixes', async () => {
  const migrations = (await readdir(join(backendDirectory, 'migrations')))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  assert.deepEqual(migrations, [
    '001_initial_schema.sql',
    '002_seed_data.sql',
    '003_prevent_duplicate_active_trades.sql',
    '004_unique_item_names.sql',
    '005_enforce_required_columns.sql',
    '006_use_timezone_aware_timestamps.sql',
    '007_remove_unused_trade_valid_until.sql',
  ]);
});

test('database adapter passes PostgreSQL queries through without rewriting', async () => {
  const source = await readBackendFile('src/models/db.js');

  assert.doesNotMatch(source, /toPostgresQuery|replace\(\/\\\\\?\//);
  assert.match(source, /executor\.query\(text, params\)/);
});

test('API aliases preserve camelCase and item creation is conflict-safe', async () => {
  const userController = await readBackendFile(
    'src/controllers/userController.js',
  );
  const itemController = await readBackendFile(
    'src/controllers/itemController.js',
  );

  assert.match(userController, /AS "birbName"/);
  assert.match(userController, /AS "friendCode"/);
  assert.match(itemController, /ON CONFLICT \(name\)/);
  assert.match(itemController, /RETURNING id/);
});

test('database migrations protect active trades and item names', async () => {
  const activeTrades = await readBackendFile(
    'migrations/003_prevent_duplicate_active_trades.sql',
  );
  const itemNames = await readBackendFile(
    'migrations/004_unique_item_names.sql',
  );
  const timestamps = await readBackendFile(
    'migrations/006_use_timezone_aware_timestamps.sql',
  );

  assert.match(activeTrades, /CREATE UNIQUE INDEX/);
  assert.match(activeTrades, /WHERE status IN \('pending', 'confirmed'\)/);
  assert.match(itemNames, /CREATE UNIQUE INDEX/);
  assert.match(timestamps, /TYPE TIMESTAMPTZ/);
});

test('unused trade valid_until column is removed without writing it', async () => {
  const migration = await readBackendFile(
    'migrations/007_remove_unused_trade_valid_until.sql',
  );
  const tradeController = await readBackendFile(
    'src/controllers/tradeController.js',
  );

  assert.match(
    migration,
    /ALTER TABLE trades\s+DROP COLUMN IF EXISTS valid_until/,
  );
  assert.doesNotMatch(tradeController, /valid_until/);
});

test('potential trade matching excludes wishlist items reserved by active trades', async () => {
  const tradeHelpers = await readBackendFile('src/helpers/tradeHelpers.js');

  assert.match(
    tradeHelpers,
    /const getWishItems = \(userId\) =>\s*queryAll\([\s\S]*?WHERE user_id = \$1\s+AND list_type = 'wishlist'\s+AND in_trade_with_user IS NULL/,
  );
});

test('seed data creates a realistic local demo pair with matching trade potential', async () => {
  const seed = await readBackendFile('migrations/002_seed_data.sql');

  assert.match(
    seed,
    /INSERT INTO users \(id, email, friend_code, username, birb_name, password\)/,
  );
  assert.match(seed, /INSERT INTO items \(name\)/);
  assert.match(
    seed,
    /INSERT INTO user_items \(user_id, item_id, color_id, list_type\)/,
  );
  assert.match(seed, /wishlist/);
  assert.match(seed, /tradelist/);
  assert.match(
    seed,
    /classic diner roller skates|classic diner sundae|classic diner visor|classic diner uniform/i,
  );
});
