import { Router } from "express";
import {
  getTradesFromDB,
  postRequestTrade,
  postFinishTrade,
} from "../controllers/tradeController.js";
const router = Router();

router.get("/", getTradesFromDB);
router.post("/requestTrade", postRequestTrade);
router.post("/finishTrade/:tradeId", postFinishTrade);

export default router;
