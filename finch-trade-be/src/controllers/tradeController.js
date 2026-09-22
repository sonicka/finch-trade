import { queryAll, queryOne, runQuery } from '../utils.js';
import db from '../models/db.js';
import {
  archiveTrade,
  deleteTrade,
  findTrades,
  getTradeByUsers,
  insertItemTransaction,
  updateTrade,
} from '../helpers/tradeHelpers.js';
import { deleteItem } from '../helpers/itemHelpers.js';

export const getTradesFromDB = async (req, res) => {
  try {
    res.json(await findTrades(req.userId));
  } catch (error) {
    console.error('Error finding trades:', error);
    res.status(500).json({ message: 'Error finding trades' });
  }
};

const getTradeItemsForUser = (trade, userId) => {
  const isUser1 = trade.user_id1 === Number(userId);
  return {
    my: isUser1
      ? { id: trade.item_id1, colorId: trade.color_id1 }
      : { id: trade.item_id2, colorId: trade.color_id2 },
    their: isUser1
      ? { id: trade.item_id2, colorId: trade.color_id2 }
      : { id: trade.item_id1, colorId: trade.color_id1 },
  };
};

const sameItem = (first, second) =>
  first.id === second.id && first.colorId === second.colorId;

const addRequester = (requestedBy, ...userIds) => [
  ...new Set([
    ...(requestedBy ? JSON.parse(requestedBy) : []),
    ...userIds.map(String),
  ]),
];

const updateExistingTrade = async (
  trade,
  userId1,
  userId2,
  chosenItems,
  client,
) => {
  const existingItems = getTradeItemsForUser(trade, userId1);
  if (
    !sameItem(chosenItems.my, existingItems.my) ||
    !sameItem(chosenItems.their, existingItems.their)
  ) {
    throw new Error(
      'Trade items do not match. Please review the trade details.',
    );
  }

  const requestedBy = addRequester(trade.requested_by, userId1, userId2);
  const status = requestedBy.length === 2 ? 'confirmed' : 'pending';
  await updateTrade(trade.id, status, requestedBy, client);
  return { created: false, tradeId: trade.id, status };
};

const requestTrade = async (userId1, userId2, chosenItems, client) => {
  const existingTrade = await getTradeByUsers(userId1, userId2, client);
  if (existingTrade) {
    return updateExistingTrade(
      existingTrade,
      userId1,
      userId2,
      chosenItems,
      client,
    );
  }

  const trade = await insertItemTransaction(
    userId1,
    userId2,
    chosenItems,
    client,
  );
  return { created: true, tradeId: trade.lastID, status: 'pending' };
};

const lockUserPair = (client, userId1, userId2) => {
  const orderedUserIds = [Number(userId1), Number(userId2)].sort(
    (first, second) => first - second,
  );
  return client.query('SELECT pg_advisory_xact_lock($1, $2)', orderedUserIds);
};

export const postRequestTrade = async (req, res) => {
  const userId1 = req.userId;
  const { userId2 } = req.query;
  const { chosenItems } = req.body;

  if (!userId2 || !chosenItems?.my || !chosenItems?.their) {
    return res.status(400).json({ message: 'Missing required trade data' });
  }

  try {
    const result = await db.transaction(async (client) => {
      await lockUserPair(client, userId1, userId2);
      return requestTrade(userId1, userId2, chosenItems, client);
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.created ? 'Trade created' : 'Trade updated',
      tradeId: result.tradeId,
      status: result.status,
    });
  } catch (err) {
    console.error('Error processing trade:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

const deleteTradeItems = (trade, client) => {
  const items = [
    [trade.user_id1, trade.item_id1, trade.color_id1],
    [trade.user_id2, trade.item_id2, trade.color_id2],
    [trade.user_id1, trade.item_id2, trade.color_id2],
    [trade.user_id2, trade.item_id1, trade.color_id1],
  ];

  return Promise.all(
    items.map(([userId, itemId, colorId]) =>
      deleteItem(userId, itemId, colorId, true, client),
    ),
  );
};

// todo this works but is written poorly
const finishTrade = async (trade, userId, client) => {
  if (![String(trade.user_id1), String(trade.user_id2)].includes(userId)) {
    return { forbidden: true };
  }

  const finishedBy = addRequester(trade.finished_by, userId);
  await runQuery(
    `UPDATE trades
     SET status = $1, finished_by = $2, valid_until = NOW() + INTERVAL '24 hours'
     WHERE id = $3`,
    [trade.status, JSON.stringify(finishedBy), trade.id],
    client,
  );

  if (trade.status === 'confirmed' && finishedBy.length !== 2)
    return { tradeId: trade.id, status: trade.status };

  await deleteTradeItems(trade, client);
  await archiveTrade(trade, client);
  await deleteTrade(trade.id, client);
  return { tradeId: trade.id, status: 'archived' };
};

export const getPastTradesFromDB = async (req, res) => {
  try {
    const userId = req.userId;
    const [pastGifts, pastTrades] = await Promise.all([
      queryAll(
        `SELECT * FROM trades_history
         WHERE (user_id1 = $1 OR user_id2 = $2) AND trade_id IS NULL
         ORDER BY archived_at DESC`,
        [userId, userId],
      ),
      queryAll(
        `SELECT * FROM trades_history
         WHERE (user_id1 = $1 OR user_id2 = $2) AND trade_id IS NOT NULL
         ORDER BY archived_at DESC`,
        [userId, userId],
      ),
    ]);

    const toISOString = (timestamp) => new Date(timestamp).toISOString();
    const currentUserId = Number(userId);
    const formattedGifts = pastGifts.map((row) => {
      const isGiver = row.user_id1 === currentUserId;
      return {
        id: row.id,
        itemId: row.item_id1,
        colorId: row.color_id1,
        archivedAt: toISOString(row.archived_at),
        type: isGiver ? 'giftGiven' : 'giftReceived',
        userId: isGiver ? row.user_id2 : row.user_id1,
      };
    });

    const formattedTrades = pastTrades.map((row) => ({
      id: row.id,
      status: row.status,
      tradeId: row.trade_id,
      userId1: row.user_id1,
      itemId1: row.item_id1,
      colorId1: row.color_id1,
      userId2: row.user_id2,
      itemId2: row.item_id2,
      colorId2: row.color_id2,
      archivedAt: toISOString(row.archived_at),
      type: 'trade',
    }));

    const allPastTransactions = [...formattedGifts, ...formattedTrades].sort(
      (a, b) => new Date(b.archivedAt) - new Date(a.archivedAt),
    );

    res.status(200).json(allPastTransactions);
  } catch (error) {
    console.error('Error fetching past trades:', error);
    res.status(500).json({ message: 'Failed to retrieve past trades' });
  }
};

export const postFinishGifting = async (req, res) => {
  const { giftedBy, giftedTo, itemId, colorId } = req.body;

  if (!itemId || !colorId || !giftedTo || !giftedBy) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (![String(giftedBy), String(giftedTo)].includes(req.userId)) {
    return res
      .status(403)
      .json({ message: 'You are not a party to this gift.' });
  }

  try {
    await db.transaction(async (client) => {
      await runQuery(
        'INSERT INTO trades_history (user_id1, user_id2, item_id1, color_id1) VALUES ($1, $2, $3, $4)',
        [giftedBy, giftedTo, itemId, colorId],
        client,
      );

      await deleteItem(giftedTo, itemId, colorId, true, client);
      await deleteItem(giftedBy, itemId, colorId, false, client);
    });

    return res.status(200).json({
      message: 'Gifting archived and items successfully deleted.',
    });
  } catch (err) {
    console.error('Error finishing gifting:', err.message);
    return res.status(500).json({
      message: `Failed to finish gifting: ${err.message}`,
    });
  }
};

export const postFinishTrade = async (req, res) => {
  const { tradeId } = req.params;
  const userId = req.userId;

  try {
    const result = await db.transaction(async (client) => {
      const trade = await queryOne(
        `SELECT * FROM trades WHERE id = $1 AND status = 'confirmed' FOR UPDATE`,
        [tradeId],
        (row) => row,
        client,
      );

      if (!trade) return { notFound: true };

      return finishTrade(trade, userId, client);
    });

    if (result.notFound) {
      return res
        .status(404)
        .json({ error: 'Trade not found or not confirmed' });
    }

    if (result.forbidden) {
      return res
        .status(403)
        .json({ error: 'You are not a party to this trade.' });
    }

    if (result.status === 'archived') {
      return res.status(200).json({
        message: 'Trade archived and items successfully deleted.',
        tradeId: result.tradeId,
        status: result.status,
      });
    }

    return res.status(200).json({
      message: 'Trade updated',
      tradeId: result.tradeId,
      status: result.status,
    });
  } catch (err) {
    console.error('Error finishing trade:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
