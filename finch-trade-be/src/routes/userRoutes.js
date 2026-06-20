import { Router } from 'express';
import {
  getUserFromDB,
  signUp,
  login,
  editUser,
} from '../controllers/userController.js';
const router = Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/:userId', getUserFromDB);
router.post('/:userId', editUser);

export default router;
