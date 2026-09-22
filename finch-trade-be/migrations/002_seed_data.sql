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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users) THEN
    INSERT INTO users (id, email, friend_code, username, birb_name, password)
    VALUES
      (1, 'demo1@finchtrade.local', 'DEMO1A7Q2', 'Maya', 'Pip', '$2a$10$XXhWp63Rlbvwt3mv0Aa15.djP44wTVKuceVb9.TWWkdYXO3HD8qhS'),
      (2, 'demo2@finchtrade.local', 'DEMO2P9R5', 'Noah', 'Juniper', '$2a$10$XXhWp63Rlbvwt3mv0Aa15.djP44wTVKuceVb9.TWWkdYXO3HD8qhS');

    INSERT INTO user_items (user_id, item_id, color_id, list_type)
    VALUES
      (1, (SELECT id FROM items WHERE name = 'Classic Diner Roller Skates'), 1, 'wishlist'),
      (1, (SELECT id FROM items WHERE name = 'Preppy Vintage Eyeglasses'), 1, 'wishlist'),
      (1, (SELECT id FROM items WHERE name = 'Classic Diner Visor'), 11, 'wishlist'),
      (1, (SELECT id FROM items WHERE name = 'Classic Diner Sundae'), 6, 'tradelist'),
      (1, (SELECT id FROM items WHERE name = 'Classic Diner Uniform'), 3, 'tradelist'),
      (1, (SELECT id FROM items WHERE name = 'Preppy Vintage Headband'), 11, 'tradelist'),
      (2, (SELECT id FROM items WHERE name = 'Classic Diner Sundae'), 6, 'wishlist'),
      (2, (SELECT id FROM items WHERE name = 'Preppy Vintage Headband'), 11, 'wishlist'),
      (2, (SELECT id FROM items WHERE name = 'Preppy Vintage Dress'), 1, 'wishlist'),
      (2, (SELECT id FROM items WHERE name = 'Classic Diner Roller Skates'), 11, 'tradelist'),
      (2, (SELECT id FROM items WHERE name = 'Classic Diner Visor'), 11, 'tradelist'),
      (2, (SELECT id FROM items WHERE name = 'Preppy Vintage Heels'), 4, 'tradelist');

    PERFORM setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
  END IF;
END $$;