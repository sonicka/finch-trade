import db from "../models/db.js";

export const getTradesFromDB = (req, res) => {
  const userId = req.query.userId;

  findTrades(userId, (err, trades) => {
    if (err) {
      res.status(500).json({ error: "Error finding trades:", err });
      return;
    }
    res.json(trades);
  });
};

async function findTrades(userId, callback) {
  try {
    const wishItems = await new Promise((resolve, reject) => {
      db.all(
        `SELECT item_id, color_id FROM user_items WHERE user_id = ? AND list_type = 'wishlist'`,
        [userId],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    const tradeItems = await new Promise((resolve, reject) => {
      db.all(
        `SELECT item_id, color_id FROM user_items WHERE user_id = ? AND list_type = 'tradelist'`,
        [userId],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    const tradeItemsList = tradeItems.flatMap((item) => [
      item.item_id,
      item.color_id,
    ]);
    const conditions = tradeItems
      .map(() => "(i.item_id = ? AND i.color_id = ?)")
      .join(" OR ");

    const potentialGifts = await new Promise((resolve, reject) => {
      db.all(
        `SELECT u.id AS userId, i.item_id AS itemId, i.color_id AS colorId
          FROM user_items i
          JOIN users u ON i.user_id = u.id
          WHERE i.list_type = 'wishlist'
          AND (${conditions})`,
        tradeItemsList,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    const giftsAndTrades = [];

    const potentialTraders = [
      ...new Set(potentialGifts.map((item) => item.userId)),
    ];

    for (const traderId of potentialTraders) {
      const existingTrade = await new Promise((resolve, reject) => {
        db.get(
          `SELECT status, requested_by FROM trades
           WHERE (user_id1 = ? AND user_id2 = ?)
           OR (user_id1 = ? AND user_id2 = ?)`,
          [userId, traderId, traderId, userId],
          (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);

            if (row.status === "pending") {
              const requestedByArray = row.requested_by
                ? JSON.parse(row.requested_by)
                : [];
              const requestedByMe = requestedByArray.includes(userId);

              return resolve({
                status: row.status,
                requestedByMe,
              });
            }

            resolve({ status: row.status });
          }
        );
      });

      const traderWants = potentialGifts.filter(
        (item) => item.userId === traderId
      );

      const wishConditions = wishItems
        .map(() => "(i.item_id = ? AND i.color_id = ?)")
        .join(" OR ");
      const wishParams = wishItems.flatMap((item) => [
        item.item_id,
        item.color_id,
      ]);

      const traderOffers = await new Promise((resolve, reject) => {
        db.all(
          `SELECT u.id AS userId, i.item_id AS itemId, i.color_id AS colorId
            FROM user_items i
            JOIN users u ON i.user_id = u.id
            WHERE i.list_type = 'tradelist'
            AND i.user_id = ?
            AND (${wishConditions})`,
          [traderId, ...wishParams],
          (err, rows) => (err ? reject(err) : resolve(rows))
        );
      });

      giftsAndTrades.push({
        userId: traderId,
        wants: traderWants,
        has: traderOffers,
        ...existingTrade,
      });
    }

    callback(null, giftsAndTrades);
  } catch (err) {
    console.error("Error finding trades:", err);
    callback(err);
  }
}

export const postRequestTrade = (req, res) => {
  const userId1 = req.query.userId1;
  const userId2 = req.query.userId2;

  db.get(
    `SELECT id FROM trades
     WHERE (user_id1 = ? AND user_id2 = ?)
        OR (user_id1 = ? AND user_id2 = ?)
        AND status = 'pending'`,
    [userId1, userId2, userId2, userId1],
    (err, row) => {
      if (err) {
        console.error("Error checking existing trade:", err.message);
        return res.status(500).json({ error: "Database error" });
      }

      if (row) {
        let requestedBy = row.requested_by ? JSON.parse(row.requested_by) : [];
        if (!requestedBy.includes(userId1)) requestedBy.push(userId1);
        if (!requestedBy.includes(userId2)) requestedBy.push(userId2);

        const newStatus = requestedBy.length === 2 ? "confirmed" : "pending";

        db.run(
          "UPDATE trades SET status = ?, requested_by = ?, valid_until = DATETIME('now', '+24 hours') WHERE id = ?",
          [newStatus, JSON.stringify(requestedBy), row.id],
          function (err) {
            if (err) {
              console.error("Error updating trade:", err.message);
              return res.status(500).json({ error: "Failed to update trade" });
            }
            return res.status(200).json({
              message: "Trade updated",
              tradeId: row.id,
              status: newStatus,
            });
          }
        );
      } else {
        db.run(
          "INSERT INTO trades (user_id1, user_id2, status, requested_by) VALUES (?, ?, ?, ?)",
          [userId1, userId2, "pending", JSON.stringify([userId1])],
          function (err) {
            if (err) {
              console.error("Error inserting trade:", err.message);
              return res.status(500).json({ error: "Failed to create trade" });
            }
            console.log(`New trade added with ID: ${this.lastID}`);
            return res.status(201).json({
              message: "Trade created",
              tradeId: this.lastID,
              status: "pending",
            });
          }
        );
      }
    }
  );
};
