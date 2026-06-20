import { Router } from 'express';
import {
  deleteItemFromDB,
  getAllItemsFromDB,
  getColorsFromDB,
  getItemByIdFromDB,
  getUserItemsFromDB,
  postItemToDB,
} from '../controllers/itemController.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();

// not user-specific data, no auth needed
router.get('/colors', getColorsFromDB);
router.get('/', getAllItemsFromDB);
router.get('/item/:itemId', getItemByIdFromDB);

// all these mutate or read a specific user's lists - requires auth
router.post('/add', requireAuth, postItemToDB);
router.get('/:type', requireAuth, getUserItemsFromDB);
router.delete('/remove', requireAuth, deleteItemFromDB);

export default router;
