DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM users
    WHERE email IS NULL OR username IS NULL OR birb_name IS NULL
      OR friend_code IS NULL OR password IS NULL
      OR btrim(email) = '' OR btrim(username) = ''
      OR btrim(birb_name) = '' OR btrim(friend_code) = ''
      OR btrim(password) = ''
  ) THEN
    RAISE EXCEPTION 'Cannot apply migration 005: users contains incomplete rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM items
    WHERE name IS NULL OR btrim(name) = ''
  ) THEN
    RAISE EXCEPTION 'Cannot apply migration 005: items contains incomplete rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM colors
    WHERE color IS NULL OR btrim(color) = ''
  ) THEN
    RAISE EXCEPTION 'Cannot apply migration 005: colors contains incomplete rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM user_items
    WHERE user_id IS NULL OR item_id IS NULL OR color_id IS NULL
      OR list_type IS NULL
      OR list_type NOT IN ('wishlist', 'tradelist')
  ) THEN
    RAISE EXCEPTION 'Cannot apply migration 005: user_items contains invalid rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM trades
    WHERE user_id1 IS NULL OR user_id2 IS NULL
      OR status IS NULL OR status NOT IN ('new', 'pending', 'confirmed', 'finished')
      OR requested_by IS NULL OR finished_by IS NULL
      OR item_id1 IS NULL OR item_id2 IS NULL
      OR color_id1 IS NULL OR color_id2 IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot apply migration 005: trades contains invalid rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM trades_history
    WHERE user_id1 IS NULL OR user_id2 IS NULL
      OR status IS NULL OR item_id1 IS NULL OR color_id1 IS NULL
      OR (trade_id IS NULL AND (item_id2 IS NOT NULL OR color_id2 IS NOT NULL))
      OR (trade_id IS NOT NULL AND (item_id2 IS NULL OR color_id2 IS NULL))
  ) THEN
    RAISE EXCEPTION 'Cannot apply migration 005: trades_history contains invalid rows';
  END IF;
END $$;

ALTER TABLE users
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN birb_name SET NOT NULL,
  ALTER COLUMN friend_code SET NOT NULL,
  ALTER COLUMN password SET NOT NULL;

ALTER TABLE items
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE colors
  ALTER COLUMN color SET NOT NULL;

ALTER TABLE user_items
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN item_id SET NOT NULL,
  ALTER COLUMN color_id SET NOT NULL,
  ALTER COLUMN list_type SET NOT NULL;

ALTER TABLE trades
  ALTER COLUMN user_id1 SET NOT NULL,
  ALTER COLUMN user_id2 SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN item_id1 SET NOT NULL,
  ALTER COLUMN item_id2 SET NOT NULL,
  ALTER COLUMN color_id1 SET NOT NULL,
  ALTER COLUMN color_id2 SET NOT NULL;

ALTER TABLE trades_history
  ALTER COLUMN user_id1 SET NOT NULL,
  ALTER COLUMN user_id2 SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN item_id1 SET NOT NULL,
  ALTER COLUMN color_id1 SET NOT NULL;

ALTER TABLE users
  ADD CONSTRAINT users_nonempty_fields_check
  CHECK (
    btrim(email) <> '' AND btrim(username) <> '' AND btrim(birb_name) <> ''
    AND btrim(friend_code) <> '' AND btrim(password) <> ''
  );

ALTER TABLE items
  ADD CONSTRAINT items_name_nonempty_check CHECK (btrim(name) <> '');

ALTER TABLE colors
  ADD CONSTRAINT colors_name_nonempty_check CHECK (btrim(color) <> '');

ALTER TABLE trades
  ADD CONSTRAINT trades_status_check
  CHECK (status IN ('new', 'pending', 'confirmed', 'finished'));

ALTER TABLE trades_history
  ADD CONSTRAINT trades_history_gift_or_trade_check
  CHECK (
    (trade_id IS NULL AND item_id2 IS NULL AND color_id2 IS NULL)
    OR (trade_id IS NOT NULL AND item_id2 IS NOT NULL AND color_id2 IS NOT NULL)
  );