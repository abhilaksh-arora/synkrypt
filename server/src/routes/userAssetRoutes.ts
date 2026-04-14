import { Router } from 'express';
import { listMyAssets, getAsset, issueAsset, revokeAsset, listUserAssets } from '../controllers/userAssetController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, listMyAssets);
router.get('/:id', requireAuth, getAsset);
router.post('/', requireAuth, issueAsset);
router.delete('/:id', requireAuth, revokeAsset);
router.get('/user/:id', requireAuth, requireAdmin, listUserAssets);

export default router;
