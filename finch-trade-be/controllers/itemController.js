import db from "../models/db.js";

export const getColors = (req, res) => {
  db.all("SELECT * FROM colors", (err, rows) => {
    if (err) {
      console.error("Error fetching colors:", err);
      return res.status(500).json({ error: "Failed to retrieve colors" });
    }
    res.json(rows);
  });
};
