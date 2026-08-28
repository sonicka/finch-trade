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
    const updatedTradeItems = expandAnyColor(tradeItems, colors);
    const updatedPotentialGifts = await findPotentialGifts(
      updatedTradeItems,
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
  queryAll(`SELECT * FROM colors WHERE color != $1`, ['any']);

const getRecentlyTradedUsers = (currentUserId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT user_id1, user_id2 FROM trades_history
        WHERE archived_at >= NOW() - INTERVAL '24 hours' 
          AND (user_id1 = $1 OR user_id2 = $2)`,
      [currentUserId, currentUserId],
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
      `SELECT * FROM trades WHERE user_id1 = $1 OR user_id2 = $2`,
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

export const getTradeByUsers = (userId1, userId2, executor) => {
  return queryOne(
    `SELECT * FROM trades
     WHERE ((user_id1 = $1 AND user_id2 = $2)
       OR (user_id1 = $3 AND user_id2 = $4))
       AND status = 'pending'`,
    [userId1, userId2, userId2, userId1],
    (row) => row,
    executor,
  );
};

const getWishItems = (userId) =>
  queryAll(
    `SELECT item_id, color_id FROM user_items WHERE user_id = $1 AND list_type = 'wishlist'`,
    [userId],
  );

const getTradeItems = (userId) =>
  queryAll(
    `SELECT item_id, color_id FROM user_items WHERE user_id = $1 AND list_type = 'tradelist' AND in_trade_with_user IS NULL`,
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
    .map(
      (_, index) =>
        `(i.item_id = $${index * 2 + 1} AND i.color_id IN ($${index * 2 + 2}, 1))`,
    )
    .join(' OR ');
  const exclusionClause = inTradeWithUsers.length
    ? `AND i.user_id NOT IN (${inTradeWithUsers.map((_, index) => `$${tradeItemsList.length + index + 1}`).join(', ')})`
    : '';

  const params = [...tradeItemsList, ...inTradeWithUsers];

  const potentialGifts = await queryAll(
    `SELECT i.user_id AS "userId", i.item_id AS "itemId", i.color_id AS "colorId", i.in_trade_with_user
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
    .map(
      (_, index) =>
        `(i.item_id = $${index * 2 + 2} AND i.color_id = $${index * 2 + 3})`,
    )
    .join(' OR ');
  const values = wishItems.flatMap((item) => [item.item_id, item.color_id]);

  return queryAll(
    `SELECT u.id AS "userId", i.item_id AS "itemId", i.color_id AS "colorId"
     FROM user_items i
     JOIN users u ON i.user_id = u.id
     WHERE i.list_type = 'tradelist'
     AND i.in_trade_with_user IS NULL
    AND i.user_id = $1
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

export const insertItemTransaction = async (
  userId1,
  userId2,
  chosenItems,
  executor,
) => {
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

  const insertTransaction = async (client) => {
    const itemUpdates = [
      [myItem.id, myItem.colorId, myItem.userId, theirItem.userId],
      [theirItem.id, theirItem.colorId, theirItem.userId, myItem.userId],
      [myItem.id, myItem.colorId, theirItem.userId, myItem.userId],
      [theirItem.id, theirItem.colorId, myItem.userId, theirItem.userId],
    ];

    for (const [itemId, colorId, userId, inTradeWithUser] of itemUpdates) {
      await updateInTradeItem(itemId, colorId, userId, inTradeWithUser, client);
    }

    return runQuery(
      'INSERT INTO trades (user_id1, user_id2, status, requested_by, item_id1, color_id1, item_id2, color_id2) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [userId1, userId2, 'pending', JSON.stringify([userId1]), ...items],
      client,
    );
  };

  return executor
    ? insertTransaction(executor)
    : db.transaction(insertTransaction);
};

const updateInTradeItem = async (
  itemId,
  colorId,
  userId,
  inTradeWithUser,
  client,
) => {
  let result = await runQuery(
    `UPDATE user_items SET in_trade_with_user = $1 WHERE item_id = $2 AND user_id = $3 AND color_id = $4`,
    [inTradeWithUser, itemId, userId, colorId],
    client,
  );

  if (result.changes === 0) {
    result = await runQuery(
      `UPDATE user_items SET in_trade_with_user = $1 WHERE item_id = $2 AND user_id = $3 AND color_id = 1`,
      [inTradeWithUser, itemId, userId],
      client,
    );
  }

  if (result.changes === 0) {
    throw new Error(
      `Failed to update item: itemId=${itemId}, userId=${userId}`,
    );
  }
};

export const updateTrade = (tradeId, newStatus, requestedBy, executor) => {
  return runQuery(
    'UPDATE trades SET status = $1, requested_by = $2 WHERE id = $3',
    [newStatus, JSON.stringify(requestedBy), tradeId],
    executor,
  );
};

export const deleteTrade = async (tradeId, executor) => {
  const result = await runQuery(
    'DELETE FROM trades WHERE id = $1',
    [tradeId],
    executor,
  );
  if (result.changes === 0) throw new Error('Trade not found');
  return;
};

export const archiveTrade = (row, executor) => {
  const query = `
    INSERT INTO trades_history
    (trade_id, user_id1, user_id2, status, item_id1, color_id1, item_id2, color_id2)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

  return runQuery(query, params, executor);
};
