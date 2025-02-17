import { Router } from "express";
import {
  getTradesFromDB,
  postRequestTrade,
} from "../controllers/tradeController.js";
const router = Router();

router.get("/", getTradesFromDB);
router.post("/requestTrade", postRequestTrade);

export default router;
