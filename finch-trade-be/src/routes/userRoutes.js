import { Router } from 'express';
import {
  getUserFromDB,
  signUp,
  login,
  editUser,
} from '../controllers/userController.js';
import { requireAuth } from '../../middleware/auth.js';
const router = Router();

router.post('/signup', signUp);
router.post('/login', login);

// :userId identifies whose profile to view, e.g. when looking at a
// potential trader's public info - any logged-in user can view it
router.get('/:userId', requireAuth, getUserFromDB);

// only allow editing your own user
router.post('/:userId', requireAuth, editUser);

export default router;
