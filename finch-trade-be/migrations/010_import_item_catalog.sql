CREATE TEMP TABLE item_import (
  name TEXT NOT NULL,
  colors JSONB NOT NULL
) ON COMMIT DROP;

INSERT INTO item_import (name, colors)
SELECT
  NULLIF(BTRIM(item->>'name'), ''),
  item->'colors'
FROM jsonb_array_elements(__ITEM_CATALOG_JSON__) AS source(item);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM item_import) THEN
    RAISE EXCEPTION 'The item catalog JSON must contain at least one item';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM item_import
    WHERE name IS NULL OR jsonb_typeof(colors) IS DISTINCT FROM 'array'
  ) THEN
    RAISE EXCEPTION 'Each imported item must have a non-empty name and a colors array';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM item_import
    WHERE jsonb_array_length(colors) = 0
  ) THEN
    RAISE EXCEPTION 'Each imported item must have at least one color';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM item_import AS item
    CROSS JOIN LATERAL jsonb_array_elements(item.colors) AS supplied(value)
    WHERE jsonb_typeof(supplied.value) IS DISTINCT FROM 'string'
       OR NULLIF(BTRIM(supplied.value #>> '{}'), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Each item color must be a non-empty string';
  END IF;
END $$;

INSERT INTO colors (color)
SELECT DISTINCT LOWER(BTRIM(supplied.color))
FROM item_import AS item
CROSS JOIN LATERAL jsonb_array_elements_text(item.colors) AS supplied(color)
ON CONFLICT (color) DO NOTHING;

INSERT INTO items (name)
SELECT DISTINCT name
FROM item_import
ON CONFLICT (name) DO NOTHING;

-- Imported entries replace default color mappings with their exact catalog colors.
DELETE FROM item_colors
USING item_import, items
WHERE item_colors.item_id = items.id
  AND items.name = item_import.name;

INSERT INTO item_colors (item_id, color_id)
SELECT DISTINCT items.id, colors.id
FROM item_import AS item
CROSS JOIN LATERAL jsonb_array_elements_text(item.colors) AS supplied(color)
JOIN items ON items.name = item.name
JOIN colors
  ON colors.color = LOWER(BTRIM(supplied.color))
  OR colors.color = 'any'
ON CONFLICT (item_id, color_id) DO NOTHING;
