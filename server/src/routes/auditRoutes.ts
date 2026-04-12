import { Router } from 'express';
import { listLogs } from '../controllers/auditController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, requireAdmin, listLogs);

export default router;
