DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM items AS marked_item
    JOIN items AS existing_item
      ON existing_item.name =
        BTRIM(REGEXP_REPLACE(marked_item.name, E'\\*+[[:space:]]*$', ''))
     AND existing_item.id <> marked_item.id
    WHERE marked_item.name ~ E'\\*+[[:space:]]*$'
  ) THEN
    RAISE EXCEPTION
      'Cannot remove trailing asterisks: a cleaned item name already exists';
  END IF;
END $$;

UPDATE items
SET name = BTRIM(REGEXP_REPLACE(name, E'\\*+[[:space:]]*$', ''))
WHERE name ~ E'\\*+[[:space:]]*$';
