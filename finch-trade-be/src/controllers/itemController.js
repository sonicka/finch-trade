import { queryAll, queryOne, runQuery } from '../utils.js';
import { asyncHandler } from '../errors.js';
import { MAX_ITEM_NAME_LENGTH } from '../../../shared/src/constants/limits.js';

const isPositiveInteger = (value) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// Returns the available colors.
export const getColorsFromDB = asyncHandler(async (_req, res) =>
  res.json(await queryAll('SELECT id, color FROM colors ORDER BY id')),
);

// Adds an item to the authenticated user's list, rejecting duplicate or
// conflicting entries for the same item and color.
export const postItemToDB = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const body = isRecord(req.body) ? req.body : {};
  const { color, listType } = body;
  const colorId = Number(color);
  const normalizedName = typeof body.name === 'string' ? body.name.trim() : '';

  if (!normalizedName || !color) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (
    normalizedName.length > MAX_ITEM_NAME_LENGTH ||
    !isPositiveInteger(colorId) ||
    !['wishlist', 'tradelist'].includes(listType)
  ) {
    return res
      .status(400)
      .json({ message: 'Invalid item name, color, or list type' });
  }

  if (listType === 'tradelist' && colorId === 1) {
    return res
      .status(400)
      .json({ message: 'Tradelist items must have a specific color.' });
  }

  const result = await runQuery(
    `INSERT INTO items (name) VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [normalizedName],
  );
  const itemId = result.lastID;

  const existingUserItem = await queryOne(
    colorId === 1
      ? `SELECT list_type, color_id
         FROM user_items
         WHERE user_id = $1 AND item_id = $2
         LIMIT 1`
      : `SELECT list_type, color_id
         FROM user_items
         WHERE user_id = $1 AND item_id = $2
           AND (color_id = $3 OR color_id = 1)
         ORDER BY CASE WHEN color_id = $3 THEN 0 ELSE 1 END
         LIMIT 1`,
    colorId === 1 ? [userId, itemId] : [userId, itemId, colorId],
  );

  if (existingUserItem) {
    if (colorId === 1) {
      if (existingUserItem.list_type === listType) {
        return res.status(400).json({
          message:
            'If you want this item in any color, please remove specific colors from your list first.',
        });
      }
      return res.status(400).json({
        message: `You cannot add the item in "any" color to ${listType} if you already have it in the other list.`,
      });
    }

    if (existingUserItem.color_id === 1) {
      return res.status(400).json({
        message:
          'Remove the any-color version of this item before adding a specific color.',
      });
    }
    if (existingUserItem.list_type === listType) {
      return res.status(400).json({
        message: `This item is already in your ${existingUserItem.list_type}.`,
      });
    }
  }

  const insertResult = await runQuery(
    'INSERT INTO user_items (user_id, item_id, color_id, list_type) VALUES ($1, $2, $3, $4)',
    [userId, itemId, colorId, listType],
  );

  return res.status(201).json({
    message: `Item added to ${listType}`,
    itemId: insertResult.lastID,
  });
});

// Returns the item catalog in stable alphabetical order.
export const getAllItemsFromDB = asyncHandler(async (_req, res) =>
  res.json(
    await queryAll('SELECT id, name FROM items ORDER BY LOWER(name), id'),
  ),
);

// Returns the authenticated user's items from the requested list.
export const getUserItemsFromDB = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const userId = req.userId;
  if (!['wishlist', 'tradelist'].includes(type)) {
    return res.status(400).json({ message: 'Invalid item type' });
  }

  const query = `
    SELECT
      user_items.user_id,
      user_items.item_id,
      user_items.color_id AS color,
      (user_items.in_trade_with_user IS NOT NULL) AS "isInTrade",
      items.name
    FROM user_items
    JOIN items ON user_items.item_id = items.id
    WHERE user_items.list_type = $1 AND user_items.user_id = $2
    ORDER BY items.name ASC;
  `;

  return res.json(await queryAll(query, [type, userId]));
});

// Removes one item/color entry from the authenticated user's list.
export const deleteItemFromDB = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const body = isRecord(req.body) ? req.body : {};
  const { itemId, colorId, listType } = body;

  if (
    !isPositiveInteger(itemId) ||
    !isPositiveInteger(colorId) ||
    !['wishlist', 'tradelist'].includes(listType)
  ) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const result = await runQuery(
    `DELETE FROM user_items
     WHERE user_id = $1 AND item_id = $2 AND color_id = $3
       AND list_type = $4 AND in_trade_with_user IS NULL`,
    [userId, itemId, colorId, listType],
  );
  if (result.changes === 0) {
    const item = await queryOne(
      `SELECT in_trade_with_user FROM user_items
       WHERE user_id = $1 AND item_id = $2 AND color_id = $3 AND list_type = $4`,
      [userId, itemId, colorId, listType],
    );
    if (item?.in_trade_with_user != null) {
      return res.status(409).json({
        message:
          'This item cannot be removed while it is reserved for a trade.',
      });
    }
    return res.status(404).json({ message: 'Item not found' });
  }
  return res.status(200).json({ message: `Item removed from ${listType}` });
});

// Looks up a catalog item by ID.
export const getItemByIdFromDB = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  if (!isPositiveInteger(itemId)) {
    return res.status(400).json({ message: 'Invalid item id.' });
  }

  const items = await queryAll('SELECT id, name FROM items WHERE id = $1', [
    itemId,
  ]);
  return res.json(items);
});
