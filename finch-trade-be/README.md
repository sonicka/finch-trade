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

Local demo data:
- After running `npm run migrate`, the app seeds two demo users so the trade matcher is immediately usable in a local fork.
- Demo account 1: `demo1@finchtrade.local` / `demo123`
- Demo account 2: `demo2@finchtrade.local` / `demo123`
- Their lists are intentionally built to overlap: `Maya` wants `Blueberry` and offers `Sunflower`; `Noah` wants `Sunflower` and offers `Blueberry`, creating a clear potential trade.
