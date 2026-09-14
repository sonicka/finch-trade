import { queryAll, queryOne, runQuery } from '../utils.js';

export const getColorsFromDB = async (req, res) => {
  try {
    res.json(await queryAll('SELECT * FROM colors'));
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ message: 'Failed to retrieve colors' });
  }
};

export const postItemToDB = async (req, res) => {
  const userId = req.userId;
  const { color, name, listType } = req.body;
  const normalizedName = typeof name === 'string' ? name.trim() : '';

  if (!color || !normalizedName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const result = await runQuery(
      `INSERT INTO items (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [normalizedName],
    );
    const itemId = result.lastID;

    let existingUserItem;
    // "any" color
    if (color === 1) {
      existingUserItem = await queryOne(
        'SELECT list_type FROM user_items WHERE user_id = $1 AND item_id = $2',
        [userId, itemId],
      );
    } else {
      existingUserItem = await queryOne(
        'SELECT list_type FROM user_items WHERE user_id = $1 AND item_id = $2 AND color_id IN ($3, 1)',
        [userId, itemId, color],
      );
    }

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
      } else {
        return res.status(400).json({
          message: `This item is already in your ${existingUserItem.list_type}.`,
        });
      }
    }

    const insertResult = await runQuery(
      'INSERT INTO user_items (user_id, item_id, color_id, list_type) VALUES ($1, $2, $3, $4)',
      [userId, itemId, color, listType],
    );

    return res.status(201).json({
      message: `Item added to ${listType}`,
      itemId: insertResult.lastID,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ message: `Something went wrong: ${err.message}` });
  }
};

export const getAllItemsFromDB = async (req, res) => {
  try {
    res.json(await queryAll('SELECT * FROM items ORDER BY LOWER(name), id'));
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to retrieve items' });
  }
};

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

export const deleteItemFromDB = async (req, res) => {
  const userId = req.userId;
  const { itemId, colorId, listType } = req.body;

  if (!itemId || !colorId || !listType) {
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

export const getItemByIdFromDB = async (req, res) => {
  const { itemId } = req.params;

  try {
    res.json(await queryAll('SELECT * FROM items WHERE id = $1', [itemId]));
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Failed to retrieve the item' });
  }
};
