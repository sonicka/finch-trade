import db from "../models/db.js";

export const getColorsFromDB = (req, res) => {
  db.all("SELECT * FROM colors", (err, rows) => {
    if (err) {
      console.error("Error fetching colors:", err);
      return res.status(500).json({ error: "Failed to retrieve colors" });
    }
    res.json(rows);
  });
};

export const postItemToDB = (req, res) => {
  const { userId, color, id, name, listType } = req.body;
  let itemId = id;

  if (!color || !name) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    db.get("SELECT * FROM items WHERE name = ?", [name], (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (row) {
        insertUserItem(row.id);
      } else {
        db.run("INSERT INTO items (name) VALUES (?)", [name], function (err) {
          if (err) {
            console.error("Error creating item:", err);
            return res.status(500).json({ message: "Error creating item" });
          }
          insertUserItem(this.lastID);
        });
      }
    });

    function insertUserItem(id) {
      db.run(
        "INSERT INTO user_items (user_id, item_id, color_id, list_type) VALUES (?, ?, ?, ?)",
        [userId, id, color, listType],
        function (err) {
          if (err) {
            console.error("Error saving item:", err);
            return res.status(500).json({ message: "Error saving item" });
          }
          return res.status(201).json({
            message: `Item added to ${listType}`,
            itemId: itemId,
          });
        }
      );
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// todo review
export const getItemsFromDB = (req, res) => {
  const { type } = req.params;

  if (!["wishlist", "tradelist"].includes(type)) {
    return res.status(400).json({ message: "Invalid item type" });
  }

  const query = `
    SELECT
      user_items.user_id,
      user_items.item_id,
      user_items.color_id AS color,
      items.name
    FROM user_items
    JOIN items ON user_items.item_id = items.id
    WHERE user_items.list_type = ?;
  `;

  db.all(query, [type], (err, rows) => {
    if (err) {
      console.error("Error fetching items:", err);
      return res.status(500).json({ error: "Failed to retrieve items" });
    }
    res.json(rows);
  });
};
