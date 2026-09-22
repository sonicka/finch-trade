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
        ('Classic Diner Roller Skates'),
        ('Classic Diner Sundae'),
        ('Classic Diner Uniform'),
        ('Classic Diner Visor'),
        ('Preppy Vintage Dress'),
        ('Preppy Vintage Eyeglasses'),
        ('Preppy Vintage Headband'),
        ('Preppy Vintage Heels'),
        ('Preppy Vintage Neck Ribbon'),
        ('Quirky Vintage Pants'),
        ('Quirky Vintage Polo'),
        ('Vintage Drive-in Bed'),
        ('Vintage Drive-in Clock'),
        ('Vintage Drive-in Counter'),
        ('Vintage Drive-in Doormat'),
        ('Vintage Drive-in Door'),
        ('Vintage Drive-in Gumball Machine'),
        ('Vintage Drive-in Lamp'),
        ('Vintage Drive-in Milkshake Maker'),
        ('Vintage Drive-in Rug'),
        ('Vintage Drive-in Sign'),
        ('Vintage Drive-in Ticket Machine'),
        ('Vintage Drive-in Wall'),
        ('Vintage Drive-in Window'),
        ('Vintage Movie Ticket'),
        ('Vintage Saddle Shoes'),
        ('Vintage Soda')
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
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Classic Diner Roller Skates'), 1, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Preppy Vintage Eyeglasses'), 1, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Classic Diner Visor'), 11, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Classic Diner Sundae'), 6, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Classic Diner Uniform'), 3, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo1@finchtrade.local'), (SELECT id FROM items WHERE name = 'Preppy Vintage Headband'), 11, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Classic Diner Sundae'), 6, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Preppy Vintage Headband'), 11, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Preppy Vintage Dress'), 1, 'wishlist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Classic Diner Roller Skates'), 11, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Classic Diner Visor'), 11, 'tradelist'),
         ((SELECT id FROM users WHERE email = 'demo2@finchtrade.local'), (SELECT id FROM items WHERE name = 'Preppy Vintage Heels'), 4, 'tradelist');`,
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
