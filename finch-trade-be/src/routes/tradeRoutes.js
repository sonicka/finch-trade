import { Router } from 'express';
import {
  getPastTradesFromDB,
  getTradesFromDB,
  postRequestTrade,
  postFinishTrade,
  postFinishGifting,
} from '../controllers/tradeController.js';
const router = Router();

router.get('/', getTradesFromDB);
router.get('/past', getPastTradesFromDB);
router.post('/requestTrade', postRequestTrade);
router.post('/finishTrade/:tradeId', postFinishTrade);
router.post('/finishGifting', postFinishGifting);

export default router;
