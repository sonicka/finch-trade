import { queryAll, queryOne, runQuery } from '../utils.js';

// Returns the available colors.
export const getColorsFromDB = async (req, res) => {
  try {
    res.json(await queryAll('SELECT * FROM colors'));
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ message: 'Failed to retrieve colors' });
  }
};

// Adds an item to the authenticated user's list, rejecting duplicate or
// conflicting entries for the same item and color.
export const postItemToDB = async (req, res) => {
  const userId = req.userId;
  const { color, name, listType } = req.body;
  const colorId = Number(color);
  const normalizedName = typeof name === 'string' ? name.trim() : '';

  if (!color || !normalizedName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (
    !Number.isSafeInteger(colorId) ||
    colorId < 1 ||
    !['wishlist', 'tradelist'].includes(listType)
  ) {
    return res.status(400).json({ message: 'Invalid item color or list type' });
  }

  if (listType === 'tradelist' && colorId === 1) {
    return res
      .status(400)
      .json({ message: 'Tradelist items must have a specific color.' });
  }

  try {
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
      if (color === 1) {
        if (existingUserItem.list_type === listType) {
          return res.status(400).json({
            message: `If you want this item in any color, please remove specific colors from your list first.`,
          });
        } else {
          return res.status(400).json({
            message: `You cannot add the item in "any" color to ${listType} if you already have it in the other list.`,
          });
        }
      } else if (existingUserItem.color_id === 1) {
        return res.status(400).json({
          message: `Remove the any-color version of this item before adding a specific color.`,
        });
      } else if (existingUserItem.list_type === listType) {
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
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// Returns the item catalog in stable alphabetical order.
export const getAllItemsFromDB = async (req, res) => {
  try {
    res.json(await queryAll('SELECT * FROM items ORDER BY LOWER(name), id'));
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to retrieve items' });
  }
};

// Returns the authenticated user's items from the requested list.
export const getUserItemsFromDB = async (req, res) => {
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
      CASE
        WHEN user_items.in_trade_with_user IS NOT NULL THEN true
        ELSE false
        END AS "isInTrade",
      items.name
    FROM user_items
    JOIN items ON user_items.item_id = items.id
    WHERE user_items.list_type = $1 AND user_items.user_id = $2
    ORDER BY items.name ASC;
  `;

  try {
    res.json(await queryAll(query, [type, userId]));
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to retrieve items' });
  }
};

// Removes one item/color entry from the authenticated user's list.
export const deleteItemFromDB = async (req, res) => {
  const userId = req.userId;
  const { itemId, colorId, listType } = req.body;

  if (
    !Number.isSafeInteger(Number(itemId)) ||
    Number(itemId) < 1 ||
    !Number.isSafeInteger(Number(colorId)) ||
    Number(colorId) < 1 ||
    !['wishlist', 'tradelist'].includes(listType)
  ) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const query =
    'DELETE FROM user_items WHERE item_id = $1 AND color_id = $2 AND list_type = $3 AND user_id = $4;';

  try {
    const result = await runQuery(query, [itemId, colorId, listType, userId]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    return res.status(200).json({ message: `Item removed from ${listType}` });
  } catch (error) {
    console.error('Error deleting item:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Looks up a catalog item by ID.
export const getItemByIdFromDB = async (req, res) => {
  const { itemId } = req.params;

  try {
    res.json(await queryAll('SELECT * FROM items WHERE id = $1', [itemId]));
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Failed to retrieve the item' });
  }
};
