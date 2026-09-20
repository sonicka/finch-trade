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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users) THEN
    INSERT INTO users (id, email, friend_code, username, birb_name, password)
    VALUES
      (1, 'demo1@finchtrade.local', 'DEMO1A7Q2', 'Maya', 'Pip', '$2a$10$XXhWp63Rlbvwt3mv0Aa15.djP44wTVKuceVb9.TWWkdYXO3HD8qhS'),
      (2, 'demo2@finchtrade.local', 'DEMO2P9R5', 'Noah', 'Juniper', '$2a$10$XXhWp63Rlbvwt3mv0Aa15.djP44wTVKuceVb9.TWWkdYXO3HD8qhS');

    INSERT INTO user_items (user_id, item_id, color_id, list_type)
    VALUES
      (1, (SELECT id FROM items WHERE name = 'Blueberry'), 1, 'wishlist'),
      (1, (SELECT id FROM items WHERE name = 'Fern'), 1, 'wishlist'),
      (1, (SELECT id FROM items WHERE name = 'Acorn'), 11, 'wishlist'),
      (1, (SELECT id FROM items WHERE name = 'Sunflower'), 6, 'tradelist'),
      (1, (SELECT id FROM items WHERE name = 'Pinecone'), 3, 'tradelist'),
      (1, (SELECT id FROM items WHERE name = 'Clover'), 11, 'tradelist'),
      (2, (SELECT id FROM items WHERE name = 'Sunflower'), 6, 'wishlist'),
      (2, (SELECT id FROM items WHERE name = 'Clover'), 11, 'wishlist'),
      (2, (SELECT id FROM items WHERE name = 'Moss'), 1, 'wishlist'),
      (2, (SELECT id FROM items WHERE name = 'Blueberry'), 11, 'tradelist'),
      (2, (SELECT id FROM items WHERE name = 'Acorn'), 11, 'tradelist'),
      (2, (SELECT id FROM items WHERE name = 'Feather'), 4, 'tradelist');

    PERFORM setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
  END IF;
END $$;