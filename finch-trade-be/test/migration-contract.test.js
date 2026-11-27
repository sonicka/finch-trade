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
    '008_index_trade_history_pagination.sql',
    '009_item_colors.sql',
    '010_import_item_catalog.sql',
    '011_remove_item_name_asterisks.sql',
  ]);
});

test('item catalog migrations load per-item colors from versioned JSON data', async () => {
  const itemColors = await readBackendFile('migrations/009_item_colors.sql');
  const itemCatalog = await readBackendFile(
    'migrations/010_import_item_catalog.sql',
  );
  const itemCatalogJson = await readBackendFile(
    'migrations/010_import_item_catalog.json',
  );
  const cleanItemNames = await readBackendFile(
    'migrations/011_remove_item_name_asterisks.sql',
  );
  const migrationRunner = await readBackendFile('src/migrate.js');

  assert.match(itemColors, /CREATE TABLE IF NOT EXISTS item_colors/);
  assert.match(itemColors, /CROSS JOIN colors/);
  assert.match(itemCatalog, /INSERT INTO colors \(color\)/);
  assert.match(itemCatalog, /INSERT INTO items \(name\)/);
  assert.match(itemCatalog, /INSERT INTO item_colors \(item_id, color_id\)/);
  assert.match(itemCatalog, /ON CONFLICT \(item_id, color_id\) DO NOTHING/);
  assert.match(itemCatalog, /colors\.color = 'any'/);
  assert.match(cleanItemNames, /REGEXP_REPLACE/);
  assert.match(cleanItemNames, /cleaned item name already exists/);
  assert.match(itemCatalog, /__ITEM_CATALOG_JSON__/);
  assert.match(migrationRunner, /JSON\.parse\(catalogJson\)/);
  assert.match(migrationRunner, /replaceAll\("'\", \"''\"\)/);

  const catalog = JSON.parse(itemCatalogJson);
  assert.equal(catalog.length, 638);
  assert.equal(new Set(catalog.map((item) => item.name)).size, catalog.length);
  assert.ok(catalog.every((item) => item.name && item.colors.length > 0));
  assert.ok(catalog.every((item) => !/\*+\s*$/.test(item.name)));
});

test('database adapter passes PostgreSQL queries through without rewriting', async () => {
  const source = await readBackendFile('src/models/db.js');

  assert.doesNotMatch(source, /toPostgresQuery|replace\(\/\\\\\?\//);
  assert.match(source, /executor\.query\(text, params\)/);
});

test('server security and error middleware are configured before routes', async () => {
  const server = await readBackendFile('src/server.js');
  const routes = await readBackendFile('src/routes/userRoutes.js');

  assert.match(server, /app\.use\(helmet\(\)\)/);
  assert.match(server, /json\(\{ limit: config\.jsonBodyLimit \}\)/);
  assert.match(server, /await db\.waitUntilReady\(\)/);
  assert.match(server, /app\.use\(errorHandler\)/);
  assert.match(routes, /router\.post\('\/signup', signUpRateLimit, signUp\)/);
  assert.match(routes, /router\.post\('\/login', loginRateLimit, login\)/);
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

test('trade-history cursor queries have participant indexes', async () => {
  const migration = await readBackendFile(
    'migrations/008_index_trade_history_pagination.sql',
  );

  assert.match(
    migration,
    /ON trades_history \(user_id1, archived_at DESC, id DESC\)/,
  );
  assert.match(
    migration,
    /ON trades_history \(user_id2, archived_at DESC, id DESC\)/,
  );
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

test('item color associations backfill existing catalog items and constrain any-color matches', async () => {
  const migration = await readBackendFile('migrations/009_item_colors.sql');
  const itemController = await readBackendFile(
    'src/controllers/itemController.js',
  );
  const tradeHelpers = await readBackendFile('src/helpers/tradeHelpers.js');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS item_colors/);
  assert.match(migration, /CROSS JOIN colors/);
  assert.match(itemController, /FROM item_colors/);
  assert.match(itemController, /This color is not available for this item/);
  assert.match(tradeHelpers, /colorsByItem\.get\(item\.item_id\)/);
});

test('item colors have a dedicated catalog endpoint', async () => {
  const routes = await readBackendFile('src/routes/itemRoutes.js');
  const controller = await readBackendFile('src/controllers/itemController.js');

  assert.match(
    routes,
    /router\.get\('\/item\/:itemId\/colors', getItemColorsFromDB\)/,
  );
  assert.match(controller, /export const getItemColorsFromDB/);
});
