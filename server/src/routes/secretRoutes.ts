import { Router } from 'express';
import { listSecrets, upsertSecret, deleteSecret, pullSecrets, runSecrets, bulkUpsertSecrets, syncSecrets } from '../controllers/secretController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

router.get('/pull', requireAuth, pullSecrets);
router.get('/run', requireAuth, runSecrets);
router.get('/', requireAuth, listSecrets);
router.post('/', requireAuth, upsertSecret);
router.post('/bulk', requireAuth, bulkUpsertSecrets);
router.post('/sync', requireAuth, syncSecrets);
router.delete('/:secretId', requireAuth, deleteSecret);

export default router;
