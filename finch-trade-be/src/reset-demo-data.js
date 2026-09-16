import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
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

const resetDemoData = async () => {
  await client.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `TRUNCATE TABLE user_items, trades_history, trades, users, items, colors RESTART IDENTITY CASCADE;`,
    );

    await client.query(`
      INSERT INTO colors (color)
      VALUES
        ('any'),
        ('black'),
        ('brown'),
        ('white'),
        ('gray'),
        ('yellow'),
        ('orange'),
        ('red'),
        ('pink'),
        ('purple'),
        ('blue'),
        ('green')
      ON CONFLICT (color) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO items (name)
      VALUES
        ('Blueberry'),
        ('Sunflower'),
        ('Pinecone'),
        ('Acorn'),
        ('Moss'),
        ('Fern'),
        ('Clover'),
        ('Feather'),
        ('Dandelion')
      ON CONFLICT (name) DO NOTHING;
    `);

    await client.query(
      `INSERT INTO users (email, friend_code, username, birb_name, password)
       VALUES
         ('demo1@finchtrade.local', 'DEMO1A7Q2', 'Maya', 'Pip', '$2a$10$XXhWp63Rlbvwt3mv0Aa15.djP44wTVKuceVb9.TWWkdYXO3HD8qhS'),
         ('demo2@finchtrade.local', 'DEMO2P9R5', 'Noah', 'Juniper', '$2a$10$XXhWp63Rlbvwt3mv0Aa15.djP44wTVKuceVb9.TWWkdYXO3HD8qhS');`,
    );

    await client.query(
      `INSERT INTO user_items (user_id, item_id, color_id, list_type)
       VALUES
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Blueberry'), 1, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Fern'), 1, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Acorn'), 11, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Sunflower'), 6, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Pinecone'), 3, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Clover'), 11, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Sunflower'), 6, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Clover'), 11, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Moss'), 1, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Blueberry'), 1, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Acorn'), 11, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Feather'), 1, 'tradelist');`,
    );

    await client.query('COMMIT');
    console.log('DB wiped and demo data restored.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
};

resetDemoData().catch((error) => {
  console.error('Failed to wipe and reseed demo data:', error.message);
  process.exit(1);
});
