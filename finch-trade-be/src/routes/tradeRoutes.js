import { Router } from 'express';
import {
  getPastTradesFromDB,
  getTradesFromDB,
  postRequestTrade,
  postFinishTrade,
  postFinishGifting,
  deletePendingTrade,
} from '../controllers/tradeController.js';
import { requireAuth } from '../../middleware/auth.js';
const router = Router();

router.get('/', requireAuth, getTradesFromDB);
router.get('/past', requireAuth, getPastTradesFromDB);
router.post('/requestTrade', requireAuth, postRequestTrade);
router.post('/finishTrade/:tradeId', requireAuth, postFinishTrade);
router.post('/finishGifting', requireAuth, postFinishGifting);
router.delete('/:tradeId', requireAuth, deletePendingTrade);

export default router;
