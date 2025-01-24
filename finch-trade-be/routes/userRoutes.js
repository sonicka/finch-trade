import { Router } from "express";
import { getUserFromDB, signUp, login } from "../controllers/userController.js";
const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/:userId", getUserFromDB);

export default router;
