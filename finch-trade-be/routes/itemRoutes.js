import { Router } from "express";
import {
  deleteItemFromDB,
  getAllItemsFromDB,
  getColorsFromDB,
  getUserItemsFromDB,
  postItemToDB,
} from "../controllers/itemController.js";
const router = Router();

router.get("/colors", getColorsFromDB);
router.post("/add", postItemToDB);
router.get("/", getAllItemsFromDB);
router.get("/:type", getUserItemsFromDB);
router.delete("/remove", deleteItemFromDB);

export default router;
