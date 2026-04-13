import { Router } from 'express';
import { listAuditLogs, getAuditStats } from '../controllers/auditController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, listAuditLogs);
router.get('/stats', requireAuth, getAuditStats);

export default router;
