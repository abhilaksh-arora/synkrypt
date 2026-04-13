import { Router } from 'express';
import { listUsers, createUser, deleteUser, changePassword, revokeAllAccess } from '../controllers/userController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, requireAdmin, listUsers);
router.post('/', requireAuth, requireAdmin, createUser);
router.delete('/:id', requireAuth, requireAdmin, deleteUser);
router.post('/:id/revoke', requireAuth, requireAdmin, revokeAllAccess);
router.put('/:id/password', requireAuth, changePassword);

export default router;
