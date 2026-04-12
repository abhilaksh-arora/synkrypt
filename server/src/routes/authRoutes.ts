import { Router } from 'express';
import { register, login, logout, me, setupStatus } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/setup-status', setupStatus);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
