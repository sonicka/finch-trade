CREATE TABLE IF NOT EXISTS item_colors (
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, color_id)
);

INSERT INTO item_colors (item_id, color_id)
SELECT items.id, colors.id
FROM items
CROSS JOIN colors
ON CONFLICT (item_id, color_id) DO NOTHING;
