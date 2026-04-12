import { Router } from 'express';
import { listSecrets, upsertSecret, deleteSecret, pullSecrets, runSecrets } from '../controllers/secretController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

router.get('/pull', requireAuth, pullSecrets);
router.get('/run', requireAuth, runSecrets);
router.get('/', requireAuth, listSecrets);
router.post('/', requireAuth, upsertSecret);
router.delete('/:secretId', requireAuth, deleteSecret);

export default router;
