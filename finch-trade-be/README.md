Finch-trade backend

Quickstart:

1. Use Node.js 22.13+ or 24+ (`nvm use` from the repository root).
2. cp .env.example .env && fill values
3. npm install
4. npm run migrate
5. npm run dev

`npm run migrate` applies pending files from `migrations/` and records them in
the `schema_migrations` table. It uses `DATABASE_URL_UNPOOLED` when configured,
falling back to `DATABASE_URL` for local setups. Run migrations explicitly
before starting the server; application startup does not create or modify the
database schema.

Use `npm run migrate:status` to see which migration files are applied or
pending. Both commands use the direct database URL when it is configured.

The API limits JSON request bodies to 100 KB, and applies separate per-IP
limits to login (10 requests per 15 minutes) and signup (5 requests per
15 minutes). Configure `CORS_ORIGIN` as a comma-separated origin allowlist.
When running behind a reverse proxy, set `TRUST_PROXY_HOPS` to the number of
trusted proxy hops so rate limits use the client IP safely.

Notes:

- Server entry: src/server.js
- Database migrations: migrations/
- Add tests in the src/tests folder

Local demo data:

- After running `npm run migrate`, the app seeds two demo users so the trade matcher is immediately usable in a local fork.
- Demo account 1: `demo1@finchtrade.local` / `demo123`
- Demo account 2: `demo2@finchtrade.local` / `demo123`
- Their lists are intentionally built to overlap: `Maya` wants `Classic Diner Roller Skates` and offers `Classic Diner Sundae`; `Noah` wants `Classic Diner Sundae` and offers `Classic Diner Roller Skates`, creating a clear potential trade.
