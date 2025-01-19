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

export const deleteItemFromDB = (req, res) => {
  const { itemId, colorId, listType } = req.body;

  if (!itemId || !colorId || !listType) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const query =
    "DELETE FROM user_items WHERE item_id = ? AND color_id = ? AND list_type = ?;";

  db.run(query, [itemId, colorId, listType], function (err) {
    if (err) {
      console.error("Error deleting item:", err.message);
    } else if (this.changes === 0) {
      console.log("No item found with the given ID.");
    } else {
      console.log(`Item successfully deleted from ${listType}`);
      return res.status(200).json({ message: `Item removed from ${listType}` });
    }
  });
};
