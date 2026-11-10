import { queryAll, queryOne, runQuery } from '../utils.js';
import db from '../models/db.js';
import {
  archiveTrade,
  deleteTrade,
  findTrades,
  getTradeByUsers,
  insertItemTransaction,
  releaseTradeItems,
  updateTrade,
} from '../helpers/tradeHelpers.js';
import { deleteItem } from '../helpers/itemHelpers.js';

// Returns active and potential trades involving the authenticated user.
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

// Compares two item selections by both catalog item and color ID.
const sameItem = (first, second) =>
  first.id === second.id && first.colorId === second.colorId;

// Parses existing requesters and adds new participant IDs without duplicates.
const addRequester = (requestedBy, ...userIds) => [
  ...new Set([
    ...(requestedBy ? JSON.parse(requestedBy) : []),
    ...userIds.map(String),
  ]),
];

// Validates the reciprocal request's item selections and confirms the trade
// once both participants have requested the same exchange.
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
    return { invalidSelection: true };
  }

  const requestedBy = addRequester(trade.requested_by, userId1, userId2);
  const status = requestedBy.length === 2 ? 'confirmed' : 'pending';
  await updateTrade(trade.id, status, requestedBy, client);
  return { created: false, tradeId: trade.id, status };
};

// Updates a matching pending trade or reserves the selected items for a new one.
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

// Serializes trade operations for a user pair using a consistently ordered lock.
const lockUserPair = (client, userId1, userId2) => {
  const orderedUserIds = [Number(userId1), Number(userId2)].sort(
    (first, second) => first - second,
  );
  return client.query('SELECT pg_advisory_xact_lock($1, $2)', orderedUserIds);
};

// Validates and creates or updates a trade request inside a transaction, then
// returns its ID and current pending/confirmed status.
export const postRequestTrade = async (req, res) => {
  const userId1 = req.userId;
  const { userId2 } = req.query;
  const { chosenItems } = req.body;

  const isPositiveInteger = (value) => Number.isSafeInteger(value) && value > 0;
  if (
    !isPositiveInteger(Number(userId2)) ||
    Number(userId2) === Number(userId1) ||
    !chosenItems?.my ||
    !chosenItems?.their ||
    !isPositiveInteger(chosenItems.my.id) ||
    !isPositiveInteger(chosenItems.my.colorId) ||
    !isPositiveInteger(chosenItems.their.id) ||
    !isPositiveInteger(chosenItems.their.colorId)
  ) {
    return res.status(400).json({ message: 'Missing required trade data' });
  }

  try {
    const result = await db.transaction(async (client) => {
      await lockUserPair(client, userId1, userId2);
      return requestTrade(userId1, userId2, chosenItems, client);
    });

    if (result.invalidSelection) {
      return res.status(400).json({
        message: 'Trade items do not match. Please review the trade details.',
      });
    }

    return res.status(result.created ? 201 : 200).json({
      message: result.created ? 'Trade created' : 'Trade updated',
      tradeId: result.tradeId,
      status: result.status,
    });
  } catch (err) {
    console.error('Error processing trade:', err);
    return res.status(500).json({ message: 'Failed to process trade' });
  }
};

// Removes both participants' offered items and matching wishlist entries
// after both participants have completed the exchange.
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

// Records this participant's completion; archives the trade and removes its
// reserved items once both participants have marked it finished.
const finishTrade = async (trade, userId, client) => {
  if (![String(trade.user_id1), String(trade.user_id2)].includes(userId)) {
    return { forbidden: true };
  }

  const finishedBy = addRequester(trade.finished_by, userId);
  await runQuery(
    `UPDATE trades
     SET status = $1, finished_by = $2
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

// Returns the authenticated user's archived trades and gifts in newest-first
// order, formatted to match the history API response.
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

// Records a completed gift and removes its item from both users' lists in one
// transaction; only the giver may submit it.
export const postFinishGifting = async (req, res) => {
  const { giftedBy, giftedTo, itemId, colorId } = req.body;

  const isPositiveInteger = (value) =>
    Number.isSafeInteger(Number(value)) && Number(value) > 0;
  if (
    !isPositiveInteger(itemId) ||
    !isPositiveInteger(colorId) ||
    !isPositiveInteger(giftedTo) ||
    !isPositiveInteger(giftedBy) ||
    Number(giftedBy) === Number(giftedTo)
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (String(giftedBy) !== req.userId) {
    return res
      .status(403)
      .json({ message: 'Only the gift giver can complete this gift.' });
  }

  try {
    await db.transaction(async (client) => {
      await runQuery(
        'INSERT INTO trades_history (user_id1, user_id2, item_id1, color_id1) VALUES ($1, $2, $3, $4)',
        [giftedBy, giftedTo, itemId, colorId],
        client,
      );

      await deleteItem(giftedTo, itemId, colorId, true, client, 'wishlist');
      await deleteItem(giftedBy, itemId, colorId, false, client, 'tradelist');
    });

    return res.status(200).json({
      message: 'Gifting archived and items successfully deleted.',
    });
  } catch (err) {
    console.error('Error finishing gifting:', err);
    return res.status(500).json({
      message: 'Failed to finish gifting',
    });
  }
};

// Marks the authenticated participant's confirmed trade as complete, archiving
// it and removing reserved items after both participants finish.
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

// Cancels a pending trade and releases its reserved items, locking both users
// to avoid a race with trade acceptance.
export const deletePendingTrade = async (req, res) => {
  const { tradeId } = req.params;

  try {
    const result = await db.transaction(async (client) => {
      const currentTrade = await queryOne(
        'SELECT * FROM trades WHERE id = $1',
        [tradeId],
        (row) => row,
        client,
      );

      if (!currentTrade) return { notFound: true };

      if (
        ![
          String(currentTrade.user_id1),
          String(currentTrade.user_id2),
        ].includes(req.userId)
      ) {
        return { forbidden: true };
      }

      if (currentTrade.status !== 'pending') {
        return { alreadyAccepted: currentTrade.status === 'confirmed' };
      }

      await lockUserPair(client, currentTrade.user_id1, currentTrade.user_id2);
      const trade = await queryOne(
        'SELECT * FROM trades WHERE id = $1 FOR UPDATE',
        [tradeId],
        (row) => row,
        client,
      );

      if (!trade) return { notFound: true };
      if (trade.status !== 'pending') {
        return { alreadyAccepted: trade.status === 'confirmed' };
      }

      await releaseTradeItems(trade, client);
      await deleteTrade(trade.id, client);
      return { cancelled: true };
    });

    if (result.notFound) {
      return res.status(404).json({
        message:
          'This trade no longer exists; it may already have been cancelled.',
      });
    }

    if (result.alreadyAccepted) {
      return res.status(409).json({
        message:
          'This trade has already been accepted and cannot be cancelled.',
      });
    }

    if (result.forbidden) {
      return res
        .status(403)
        .json({ message: 'Only trade participants can cancel this trade.' });
    }

    return res.status(200).json({ message: 'Pending trade cancelled' });
  } catch (error) {
    console.error('Error cancelling pending trade:', error);
    return res.status(500).json({ message: 'Failed to cancel pending trade' });
  }
};
