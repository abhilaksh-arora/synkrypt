import { Router } from 'express';
import { listPresets, createPreset, deletePreset } from '../controllers/accessPresetController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, listPresets);
router.post('/', requireAuth, requireAdmin, createPreset);
router.delete('/:id', requireAuth, requireAdmin, deletePreset);

export default router;
