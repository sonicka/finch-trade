import db from '../models/db.js';
import { queryOne, queryAll, runQuery } from '../utils.js';

export const findTrades = async (userId, callback) => {
  try {
    const colors = await getNonAnyColors();
    const [existingTrades, recentlyTradedWith, wishItems, tradeItems] =
      await Promise.all([
        getTradeByUser(userId),
        getRecentlyTradedUsers(userId),
        getWishItems(userId),
        getTradeItems(userId),
      ]);

    const inTradeWithUsers = extractUsersFromTrades(
      existingTrades ?? [],
      userId,
    );
    const updatedWishItems = expandAnyColor(wishItems, colors);
    const updatedPotentialGifts = await findPotentialGifts(
      tradeItems,
      inTradeWithUsers,
    );

    const giftsAndTrades = mapExistingTrades(existingTrades, userId);

    const potentialTraders = [
      ...new Set(updatedPotentialGifts.map((item) => item.userId)),
    ];

    for (const traderId of potentialTraders) {
      const traderWants = updatedPotentialGifts.filter(
        (item) => item.userId === traderId,
      );
      const traderOffers = await findMatchingOffers(traderId, updatedWishItems);

      giftsAndTrades.push({
        userId: traderId,
        wants: traderWants,
        has: traderOffers,
        recentlyTraded: recentlyTradedWith.includes(traderId),
      });
    }

    callback(null, giftsAndTrades);
  } catch (err) {
    console.error('Error finding trades:', err);
    callback(err);
  }
};

// helpers for findTrades
const getNonAnyColors = () =>
  queryAll(`SELECT * FROM colors WHERE color != ?`, ['any']);

const getRecentlyTradedUsers = (currentUserId) => {
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT user_id1, user_id2 FROM trades_history
       WHERE archived_at >= ? AND (user_id1 = ? OR user_id2 = ?)`,
      [twentyFourHoursAgo, currentUserId, currentUserId],
      (err, rows) => {
        if (err) return reject(err);
        const userIds = new Set();
        rows.forEach((row) => {
          // Add the *other* user to the Set
          const otherUser =
            row.user_id1 === Number(currentUserId)
              ? row.user_id2
              : row.user_id1;
          userIds.add(otherUser);
        });

        resolve([...userIds]);
      },
    );
  });
};

const getTradeByUser = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM trades WHERE user_id1 = ? OR user_id2 = ?`,
      [userId, userId],
      (err, rows) => {
        if (err) return reject(err);
        if (!rows || rows.length === 0) return resolve([]);

        const currentUserIdStr = userId.toString();
        const processed = rows
          .filter(
            (row) => row.status === 'pending' || row.status === 'confirmed',
          )
          .map((row) => {
            const finishedBy = JSON.parse(row.finished_by || '[]');

            return {
              tradeId: row.id,
              status: row.status,
              requestedByMe: currentUserIdStr === row.user_id1.toString(),
              finishedByMe: finishedBy.includes(currentUserIdStr),
              requestedTrade: {
                userId1: row.user_id1,
                itemId1: row.item_id1,
                colorId1: row.color_id1,
                userId2: row.user_id2,
                itemId2: row.item_id2,
                colorId2: row.color_id2,
              },
            };
          });

        resolve(processed);
      },
    );
  });
};

export const getTradeByUsers = (userId1, userId2) => {
  return queryOne(
    `SELECT * FROM trades
    WHERE ((user_id1 = ? AND user_id2 = ?)
       OR (user_id1 = ? AND user_id2 = ?))
       AND status = 'pending'`,
    [userId1, userId2, userId2, userId1],
  );
};

const getWishItems = (userId) =>
  queryAll(
    `SELECT item_id, color_id FROM user_items WHERE user_id = ? AND list_type = 'wishlist'`,
    [userId],
  );

const getTradeItems = (userId) =>
  queryAll(
    `SELECT item_id, color_id FROM user_items WHERE user_id = ? AND list_type = 'tradelist' AND in_trade_with_user IS NULL`,
    [userId],
  );

const extractUsersFromTrades = (trades, userId) => {
  const currentId = Number(userId);

  return trades
    .filter((trade) => trade.status !== 'finished')
    .map((trade) => {
      const { userId1, userId2 } = trade.requestedTrade;
      return userId1 === currentId ? userId2 : userId1;
    });
};

const expandAnyColor = (items, colors) =>
  items.flatMap((item) =>
    item.color_id === 1
      ? colors.map((color) => ({ ...item, color_id: color.id }))
      : item,
  );

const findPotentialGifts = async (tradeItems, inTradeWithUsers) => {
  if (!tradeItems.length) return [];

  const tradeItemsList = tradeItems.flatMap((item) => [
    item.item_id,
    item.color_id,
  ]);
  const conditions = tradeItems
    .map(() => '(i.item_id = ? AND i.color_id IN (?, 1))')
    .join(' OR ');
  const exclusionClause = inTradeWithUsers.length
    ? `AND i.user_id NOT IN (${inTradeWithUsers.map(() => '?').join(', ')})`
    : '';

  const params = [...tradeItemsList, ...inTradeWithUsers];

  const potentialGifts = await queryAll(
    `SELECT i.user_id AS userId, i.item_id AS itemId, i.color_id AS colorId, i.in_trade_with_user
     FROM user_items i
     WHERE i.list_type = 'wishlist'
     AND (${conditions})
     ${exclusionClause}
     AND i.in_trade_with_user IS NULL`,
    params,
  );

  return potentialGifts.flatMap((gift) =>
    gift.colorId === 1
      ? tradeItems
          .filter((item) => item.item_id === gift.itemId)
          .map((e) => ({ ...gift, colorId: e.color_id }))
      : gift,
  );
};

const findMatchingOffers = (userId, wishItems) => {
  if (!wishItems.length) return [];

  const conditions = wishItems
    .map(() => '(i.item_id = ? AND i.color_id = ?)')
    .join(' OR ');
  const values = wishItems.flatMap((item) => [item.item_id, item.color_id]);

  return queryAll(
    `SELECT u.id AS userId, i.item_id AS itemId, i.color_id AS colorId
     FROM user_items i
     JOIN users u ON i.user_id = u.id
     WHERE i.list_type = 'tradelist'
     AND i.in_trade_with_user IS NULL
     AND i.user_id = ?
     AND (${conditions})`,
    [userId, ...values],
  );
};

const mapExistingTrades = (trades, currentUserId) =>
  trades
    .filter((trade) => trade.status !== 'finished')
    .map((trade) => {
      const { requestedByMe, requestedTrade } = trade;

      const otherUserId = requestedByMe
        ? requestedTrade.userId2
        : requestedTrade.userId1;

      const myItem = requestedByMe
        ? { itemId: requestedTrade.itemId1, colorId: requestedTrade.colorId1 }
        : { itemId: requestedTrade.itemId2, colorId: requestedTrade.colorId2 };

      const theirItem = requestedByMe
        ? { itemId: requestedTrade.itemId2, colorId: requestedTrade.colorId2 }
        : { itemId: requestedTrade.itemId1, colorId: requestedTrade.colorId1 };

      return {
        ...trade,
        userId: otherUserId,
        wants: [
          {
            userId: currentUserId,
            ...myItem,
          },
        ],
        has: [
          {
            userId: currentUserId,
            ...theirItem,
          },
        ],
      };
    });

export const insertItemTransaction = async (userId1, userId2, chosenItems) => {
  const items = [
    chosenItems.my.id,
    chosenItems.my.colorId,
    chosenItems.their.id,
    chosenItems.their.colorId,
  ];
  const myItem = {
    id: Number(chosenItems.my.id),
    colorId: Number(chosenItems.my.colorId),
    userId: Number(userId1),
  };
  const theirItem = {
    id: Number(chosenItems.their.id),
    colorId: Number(chosenItems.their.colorId),
    userId: Number(userId2),
  };

  return new Promise((resolve, reject) => {
    // Start the transaction
    db.run('BEGIN TRANSACTION;', (err) => {
      if (err) {
        return reject('Failed to start transaction');
      }

      // Update both items in trade
      Promise.all([
        updateInTradeItem(
          myItem.id,
          myItem.colorId,
          myItem.userId,
          theirItem.userId,
        ),
        updateInTradeItem(
          theirItem.id,
          theirItem.colorId,
          theirItem.userId,
          myItem.userId,
        ),
        updateInTradeItem(
          myItem.id,
          myItem.colorId,
          theirItem.userId,
          myItem.userId,
        ),
        updateInTradeItem(
          theirItem.id,
          theirItem.colorId,
          myItem.userId,
          theirItem.userId,
        ),
      ])
        .then(() => {
          // Insert new trade
          runQuery(
            'INSERT INTO trades (user_id1, user_id2, status, requested_by, item_id1, color_id1, item_id2, color_id2) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId1, userId2, 'pending', JSON.stringify([userId1]), ...items],
          )
            .then((result) => {
              // Commit transaction if everything succeeds
              db.run('COMMIT;', (commitErr) => {
                if (commitErr) {
                  return reject('Failed to commit transaction');
                }
                resolve(result);
              });
            })
            .catch((insertErr) => {
              // Rollback transaction on insert failure
              db.run('ROLLBACK;', () => {
                reject(insertErr);
              });
            });
        })
        .catch((updateErr) => {
          // Rollback transaction on update failure
          db.run('ROLLBACK;', () => {
            reject(updateErr);
          });
        });
    });
  });
};

const updateInTradeItem = (itemId, colorId, userId, inTradeWithUser) => {
  return new Promise((resolve, reject) => {
    const runUpdate = (colorIdToUse, fallback = false) => {
      db.run(
        `UPDATE user_items SET in_trade_with_user = ? WHERE item_id = ? AND user_id = ? AND color_id = ?`,
        [inTradeWithUser, itemId, userId, colorIdToUse],
        function (err) {
          if (err) return reject(err);
          if (this.changes === 0 && !fallback) {
            // try again using colorId = 1 (any) if no exact match is found
            return runUpdate(1, true);
          }
          if (this.changes === 0 && fallback) {
            return reject(
              new Error(
                `Failed to update item: itemId=${itemId}, userId=${userId}`,
              ),
            );
          }
          resolve();
        },
      );
    };
    runUpdate(colorId);
  });
};

export const updateTrade = (tradeId, newStatus, requestedBy) => {
  return runQuery(
    'UPDATE trades SET status = ?, requested_by = ? WHERE id = ?',
    [newStatus, JSON.stringify(requestedBy), tradeId],
  );
};

export const deleteTrade = async (tradeId) => {
  const result = await runQuery('DELETE FROM trades WHERE id = ?', [tradeId]);
  if (result.changes === 0) throw new Error('Trade not found');
  return;
};

export const archiveTrade = (row) => {
  const query = `
    INSERT INTO trades_history
    (trade_id, user_id1, user_id2, status, item_id1, color_id1, item_id2, color_id2)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    row.id,
    row.user_id1,
    row.user_id2,
    'archived',
    row.item_id1,
    row.color_id1,
    row.item_id2,
    row.color_id2,
  ];

  return runQuery(query, params);
};
