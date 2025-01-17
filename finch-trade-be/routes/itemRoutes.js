import { Router } from "express";
import {
  postItemToDB,
  getColorsFromDB,
  getItemsFromDB,
} from "../controllers/itemController.js";
const router = Router();

router.get("/colors", getColorsFromDB);
router.post("/add", postItemToDB);
router.get("/:type", getItemsFromDB);

export default router;
