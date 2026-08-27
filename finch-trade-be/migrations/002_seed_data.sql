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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users) THEN
    INSERT INTO users (id, email, friend_code, username, birb_name, password)
    VALUES
      (1, 'sonkuss@gmail.com', '4YSCKFS7BP', 'Sonička', 'Jimothy', '$2a$10$zP8ixKGeapa/1Hs4JA9CGe96C2mlpmmrpL2NHFL3KveUF0FITUZf6'),
      (2, 'sonkuss2@gmail.com', 'S4MPL3C0D3', 'John', 'Birber', '$2a$10$zP8ixKGeapa/1Hs4JA9CGe96C2mlpmmrpL2NHFL3KveUF0FITUZf6');

    PERFORM setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
  END IF;
END $$;