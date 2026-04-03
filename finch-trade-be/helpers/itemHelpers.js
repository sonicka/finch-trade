import { runQuery } from '../utils.js';

export const deleteItem = async (userId, itemId, colorId, any = false) => {
  let query = any
    ? 'DELETE FROM user_items WHERE user_id = ? AND item_id = ? AND (color_id = ? OR color_id = 1)'
    : 'DELETE FROM user_items WHERE user_id = ? AND item_id = ? AND color_id = ?';

  const result = await runQuery(query, [userId, itemId, colorId]);
  if (result.changes === 0) throw new Error('Item not found');
  return;
};
