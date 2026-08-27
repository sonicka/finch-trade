import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const migrationsDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'migrations',
);
const connectionString = (
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
)?.replace(/([?&]sslmode=)require\b/, '$1verify-full');

if (!connectionString) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be configured');
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: true },
});

const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => extname(file) === '.sql')
  .sort();

await client.connect();

try {
  await client.query('SELECT pg_advisory_lock(843271)');
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows: appliedMigrations } = await client.query(
    'SELECT version, applied_at FROM schema_migrations ORDER BY version',
  );
  const appliedVersions = new Set(
    appliedMigrations.map((migration) => migration.version),
  );

  if (process.argv.includes('--status')) {
    for (const file of migrationFiles) {
      const version = basename(file, '.sql');
      console.log(
        `${appliedVersions.has(version) ? 'applied' : 'pending'} ${version}`,
      );
    }
  } else {
    let appliedCount = 0;
    for (const file of migrationFiles) {
      const version = basename(file, '.sql');

      if (appliedVersions.has(version)) continue;

      const sql = await readFile(join(migrationsDirectory, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version],
        );
        await client.query('COMMIT');
        appliedCount += 1;
        console.log(`Applied migration ${version}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    if (appliedCount === 0) console.log('No pending migrations');
  }
} finally {
  await client.query('SELECT pg_advisory_unlock(843271)');
  await client.end();
}
