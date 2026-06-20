import { queryAll, queryOne, runQuery } from '../utils.js';
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
    const existingTrade = await getTradeByUsers(userId1, userId2);

    if (existingTrade) {
      let requestedBy = existingTrade.requested_by
        ? JSON.parse(existingTrade.requested_by)
        : [];
      if (!requestedBy.includes(String(userId1)))
        requestedBy.push(String(userId1));
      if (!requestedBy.includes(String(userId2)))
        requestedBy.push(String(userId2));

      const newStatus = requestedBy.length === 2 ? 'confirmed' : 'pending';

      try {
        await updateTrade(existingTrade.id, newStatus, requestedBy);
        return res.status(200).json({
          message: 'Trade updated',
          tradeId: existingTrade.id,
          status: newStatus,
        });
      } catch (err) {
        console.error('Error updating trade:', err.message);
        return res.status(500).json({ error: 'Failed to update trade' });
      }
    } else {
      try {
        const result = await insertItemTransaction(
          userId1,
          userId2,
          chosenItems,
        );
        return res.status(201).json({
          message: 'Trade created',
          tradeId: result.lastID,
          status: 'pending',
        });
      } catch (err) {
        return res
          .status(500)
          .json({ error: `Failed to create trade: ${err.message}` });
      }
    }
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
         WHERE (user_id1 = ? OR user_id2 = ?) AND trade_id IS NULL
         ORDER BY archived_at DESC`,
        [userId, userId],
      ),
      queryAll(
        `SELECT * FROM trades_history
         WHERE (user_id1 = ? OR user_id2 = ?) AND trade_id IS NOT NULL
         ORDER BY archived_at DESC`,
        [userId, userId],
      ),
    ]);

    const currentUserId = Number(userId);
    const formattedGifts = pastGifts.map((row) => {
      const isGiver = row.user_id1 === currentUserId;
      return {
        id: row.id,
        itemId: row.item_id1,
        colorId: row.color_id1,
        archivedAt: row.archived_at,
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
      archivedAt: row.archived_at,
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
    await runQuery(
      'INSERT INTO trades_history (user_id1, user_id2, item_id1, color_id1) VALUES (?, ?, ?, ?)',
      [giftedBy, giftedTo, itemId, colorId],
    );

    await deleteItem(giftedTo, itemId, colorId, true);
    await deleteItem(giftedBy, itemId, colorId);

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
    const trade = await queryOne(
      `SELECT * FROM trades WHERE id = ? AND status = 'confirmed'`,
      [tradeId],
    );

    if (!trade) {
      return res
        .status(404)
        .json({ error: 'Trade not found or not confirmed' });
    }

    if (![String(trade.user_id1), String(trade.user_id2)].includes(userId)) {
      return res
        .status(403)
        .json({ error: 'You are not a party to this trade.' });
    }

    let finishedBy = trade.finished_by ? JSON.parse(trade.finished_by) : [];
    if (!finishedBy.includes(userId)) finishedBy.push(userId);
    const newStatus = finishedBy.length === 2 ? 'finished' : trade.status;

    await runQuery(
      "UPDATE trades SET status = ?, finished_by = ?, valid_until = DATETIME('now', '+24 hours') WHERE id = ?",
      [newStatus, JSON.stringify(finishedBy), trade.id],
    );

    if (newStatus === 'finished') {
      await deleteItem(trade.user_id1, trade.item_id1, trade.color_id1, true);
      await deleteItem(trade.user_id2, trade.item_id2, trade.color_id2, true);
      await deleteItem(trade.user_id1, trade.item_id2, trade.color_id2, true);
      await deleteItem(trade.user_id2, trade.item_id1, trade.color_id1, true);
      await archiveTrade(trade);
      await deleteTrade(trade.id);

      return res.status(200).json({
        message: 'Trade archived and items successfully deleted.',
        tradeId: trade.id,
        status: 'archived',
      });
    }

    return res.status(200).json({
      message: 'Trade updated',
      tradeId: trade.id,
      status: newStatus,
    });
  } catch (err) {
    console.error('Error finishing trade:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
