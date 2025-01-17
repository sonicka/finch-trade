import { Router } from "express";
import { getColors } from "../controllers/itemController.js";
const router = Router();

router.get("/colors", getColors);

export default router;
