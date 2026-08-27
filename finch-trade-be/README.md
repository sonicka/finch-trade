Finch-trade backend

Quickstart:

1. cp .env.example .env && fill values
2. npm install
3. npm run migrate
4. npm run dev

`npm run migrate` applies pending files from `migrations/` and records them in
the `schema_migrations` table. It uses `DATABASE_URL_UNPOOLED` when configured,
falling back to `DATABASE_URL` for local setups. Run migrations explicitly
before starting the server; application startup does not create or modify the
database schema.

Use `npm run migrate:status` to see which migration files are applied or
pending. Both commands use the direct database URL when it is configured.

Notes:
- Server entry: src/server.js
- Database migrations: migrations/
- Add tests in the src/tests folder
