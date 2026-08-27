import { runQuery } from '../utils.js';

export const deleteItem = async (
  userId,
  itemId,
  colorId,
  any = false,
  executor,
) => {
  let query = any
    ? 'DELETE FROM user_items WHERE user_id = $1 AND item_id = $2 AND (color_id = $3 OR color_id = 1)'
    : 'DELETE FROM user_items WHERE user_id = $1 AND item_id = $2 AND color_id = $3';

  const result = await runQuery(query, [userId, itemId, colorId], executor);
  if (result.changes === 0) throw new Error('Item not found');
  return;
};
