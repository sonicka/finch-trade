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
      });
    }

    callback(null, giftsAndTrades);
  } catch (err) {
    console.error("Error finding trades:", err);
    callback(err);
  }
}
