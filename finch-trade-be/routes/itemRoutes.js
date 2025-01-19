import { Router } from "express";
import {
  deleteItemFromDB,
  getColorsFromDB,
  getItemsFromDB,
  postItemToDB,
} from "../controllers/itemController.js";
const router = Router();

router.get("/colors", getColorsFromDB);
router.post("/add", postItemToDB);
router.get("/:type", getItemsFromDB);
router.delete("/remove", deleteItemFromDB);

export default router;
