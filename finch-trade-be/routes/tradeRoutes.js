import { Router } from "express";
import { getTradesFromDB } from "../controllers/tradeController.js";
const router = Router();

router.get("/", getTradesFromDB);

export default router;
