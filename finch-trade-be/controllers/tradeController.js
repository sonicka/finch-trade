import db from "../models/db.js";
import { queryAll, queryOne } from "../utils.js";

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
    const colors = await queryAll(`SELECT * FROM colors WHERE color != ?`, [
      "any",
    ]);

    const wishItems = await queryAll(
      `SELECT item_id, color_id FROM user_items WHERE user_id = ? AND list_type = 'wishlist'`,
      [userId]
    );

    // exchange "any" color for individual colors
    const updatedWishItems = wishItems.flatMap((wishItem) =>
      wishItem.color_id === 1
        ? colors.map((color) => ({ ...wishItem, color_id: color.id }))
        : wishItem
    );

    const tradeItems = await queryAll(
      `SELECT item_id, color_id FROM user_items WHERE user_id = ? AND list_type = 'tradelist'`,
      [userId]
    );

    const tradeItemsList = tradeItems.flatMap((item) => [
      item.item_id,
      item.color_id,
    ]);

    const conditions = tradeItems
      .map(() => "(i.item_id = ? AND i.color_id IN (?, 1))")
      .join(" OR ");

    const potentialGifts = await queryAll(
      `SELECT u.id AS userId, i.item_id AS itemId, i.color_id AS colorId
         FROM user_items i
         JOIN users u ON i.user_id = u.id
         WHERE i.list_type = 'wishlist'
         AND (${conditions})`,
      tradeItemsList
    );

    // exchange "any" color for individual colors
    const updatedPotentialGifts = potentialGifts.flatMap((gift) =>
      gift.colorId === 1
        ? tradeItems
            .filter((item) => item.item_id === gift.itemId)
            .map((e) => ({ ...gift, colorId: e.color_id }))
        : gift
    );

    const giftsAndTrades = [];
    const potentialTraders = [
      ...new Set(potentialGifts.map((item) => item.userId)),
    ];

    for (const traderId of potentialTraders) {
      const existingTrade = await queryOne(
        `SELECT * FROM trades WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)`,
        [userId, traderId, traderId, userId],
        (row, resolve) => {
          if (!row) return resolve(null);
          if (row.status === "pending" || row.status === "confirmed") {
            const requestedByMe = userId.toString() === row.user_id1.toString();
            const finishedByMe = JSON.parse(row.finished_by).includes(
              userId.toString()
            );
            return resolve({
              tradeId: row.id,
              status: row.status,
              requestedByMe,
              finishedByMe,
              requestedTrade: {
                userId1: row.user_id1,
                itemId1: row.item_id1,
                colorId1: row.color_id1,
                userId2: row.user_id2,
                itemId2: row.item_id2,
                colorId2: row.color_id2,
              },
            });
          }
          resolve({ status: row.status });
        }
      );

      const traderWants = updatedPotentialGifts.filter(
        (item) => item.userId === traderId
      );

      const wishConditions = updatedWishItems.length
        ? updatedWishItems
            .map(() => "(i.item_id = ? AND i.color_id = ?)")
            .join(" OR ")
        : "1=0";

      const wishParams = updatedWishItems.flatMap((item) => [
        item.item_id,
        item.color_id,
      ]);

      const traderOffers = await queryAll(
        `SELECT u.id AS userId, i.item_id AS itemId, i.color_id AS colorId
         FROM user_items i
         JOIN users u ON i.user_id = u.id
         WHERE i.list_type = 'tradelist'
         AND i.user_id = ?
         AND (${wishConditions})`,
        [traderId, ...wishParams]
      );

      giftsAndTrades.push({
        userId: traderId,
        wants: traderWants,
        has: traderOffers,
        ...(existingTrade || {}),
      });
    }

    callback(null, giftsAndTrades);
  } catch (err) {
    console.error("Error finding trades:", err);
    callback(err);
  }
}

export const postRequestTrade = (req, res) => {
  const { userId1, userId2 } = req.query;
  const { chosenItems } = req.body;

  const items = [
    chosenItems.my.id,
    chosenItems.my.colorId,
    chosenItems.their.id,
    chosenItems.their.colorId,
  ];

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
          "UPDATE trades SET status = ?, requested_by = ? WHERE id = ?",
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
          "INSERT INTO trades (user_id1, user_id2, status, requested_by, item_id1, color_id1, item_id2, color_id2) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [userId1, userId2, "pending", JSON.stringify([userId1]), ...items],
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

export const postFinishTrade = (req, res) => {
  const { tradeId } = req.params;
  const { userId } = req.query;

  // Flag to track if we have already sent a response
  let responseSent = false;

  // Helper function to send the response once
  function sendResponse(status, data) {
    if (!responseSent) {
      responseSent = true;
      return res.status(status).json(data);
    }
  }

  db.get(
    `SELECT * FROM trades
     WHERE id = ? AND status = 'confirmed'`,
    [tradeId],
    (err, row) => {
      if (err) {
        console.error("Error checking existing trade:", err.message);
        return sendResponse(500, { error: "Database error" });
      }

      if (row) {
        let finishedBy = row.finished_by ? JSON.parse(row.finished_by) : [];
        if (!finishedBy.includes(userId)) finishedBy.push(userId);

        const newStatus = finishedBy.length === 2 ? "finished" : row.status;

        db.run(
          "UPDATE trades SET status = ?, finished_by = ?, valid_until = DATETIME('now', '+24 hours') WHERE id = ?",
          [newStatus, JSON.stringify(finishedBy), row.id],
          function (err) {
            if (err) {
              console.error("Error updating trade:", err.message);
              return sendResponse(500, { error: "Failed to update trade" });
            }
            return sendResponse(200, {
              message: "Trade updated",
              tradeId: row.id,
              status: newStatus,
            });
          }
        );

        if (finishedBy.length === 2) {
          (async () => {
            try {
              await deleteItem(row.user_id1, row.item_id1, row.color_id1);
              await deleteItem(row.user_id2, row.item_id2, row.color_id2);
              await deleteTrade(row.id);

              return sendResponse(200, {
                message: "Trade and items successfully deleted.",
              });
            } catch (err) {
              console.error("Error during deletion:", err.message);
              return sendResponse(500, { error: err.message });
            }
          })();
        }
      }
    }
  );
};

const deleteItem = (userId, itemId, colorId) => {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM user_items WHERE user_id = ? AND item_id = ? AND color_id = ?",
      [userId, itemId, colorId],
      function (err) {
        if (err) return reject(err);
        if (this.changes === 0) return reject(new Error("Item not found"));
        resolve();
      }
    );
  });
};

const deleteTrade = (tradeId) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM trades WHERE id = ?", [tradeId], function (err) {
      if (err) return reject(err);
      if (this.changes === 0) return reject(new Error("Trade not found"));
      resolve();
    });
  });
};
