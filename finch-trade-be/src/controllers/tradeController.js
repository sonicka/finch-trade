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

export const getTradesFromDB = (req, res) => {
  const userId = req.userId;

  findTrades(userId, (err, trades) => {
    if (err) {
      res.status(500).json({ error: 'Error finding trades:', err });
      return;
    }
    res.json(trades);
  });
};

export const postRequestTrade = async (req, res) => {
  const userId1 = req.userId;
  const { userId2 } = req.query;
  const { chosenItems } = req.body;

  if (!userId2 || !chosenItems?.my || !chosenItems?.their) {
    return res.status(400).json({ error: 'Missing required trade data' });
  }

  try {
    const result = await db.transaction(async (client) => {
      const orderedUserIds = [Number(userId1), Number(userId2)].sort(
        (a, b) => a - b,
      );
      await client.query(
        'SELECT pg_advisory_xact_lock($1, $2)',
        orderedUserIds,
      );

      const existingTrade = await getTradeByUsers(userId1, userId2, client);

      if (existingTrade) {
        const requestedBy = existingTrade.requested_by
          ? JSON.parse(existingTrade.requested_by)
          : [];
        if (!requestedBy.includes(String(userId1)))
          requestedBy.push(String(userId1));
        if (!requestedBy.includes(String(userId2)))
          requestedBy.push(String(userId2));

        const status = requestedBy.length === 2 ? 'confirmed' : 'pending';
        await updateTrade(existingTrade.id, status, requestedBy, client);
        return { created: false, tradeId: existingTrade.id, status };
      }

      const trade = await insertItemTransaction(
        userId1,
        userId2,
        chosenItems,
        client,
      );
      return { created: true, tradeId: trade.lastID, status: 'pending' };
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.created ? 'Trade created' : 'Trade updated',
      tradeId: result.tradeId,
      status: result.status,
    });
  } catch (err) {
    console.error('Error processing trade:', err.message);
    return res.status(500).json({ error: err.message });
  }
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
    res.status(500).json({ error: 'Failed to retrieve past trades' });
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
      error: `Failed to finish gifting: ${err.message}`,
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

      if (![String(trade.user_id1), String(trade.user_id2)].includes(userId)) {
        return { forbidden: true };
      }

      const finishedBy = trade.finished_by ? JSON.parse(trade.finished_by) : [];
      if (!finishedBy.includes(userId)) finishedBy.push(userId);
      const newStatus = finishedBy.length === 2 ? 'finished' : trade.status;

      await runQuery(
        `UPDATE trades
     SET status = $1,
       finished_by = $2,
         valid_until = NOW() + INTERVAL '24 hours'
    WHERE id = $3`,
        [newStatus, JSON.stringify(finishedBy), trade.id],
        client,
      );

      if (newStatus === 'finished') {
        await deleteItem(
          trade.user_id1,
          trade.item_id1,
          trade.color_id1,
          true,
          client,
        );
        await deleteItem(
          trade.user_id2,
          trade.item_id2,
          trade.color_id2,
          true,
          client,
        );
        await deleteItem(
          trade.user_id1,
          trade.item_id2,
          trade.color_id2,
          true,
          client,
        );
        await deleteItem(
          trade.user_id2,
          trade.item_id1,
          trade.color_id1,
          true,
          client,
        );
        await archiveTrade(trade, client);
        await deleteTrade(trade.id, client);

        return { tradeId: trade.id, status: 'archived' };
      }

      return { tradeId: trade.id, status: newStatus };
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
