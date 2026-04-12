import { Router } from 'express';
import { getProjectAuditLogs } from '../controllers/auditController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/:projectId/logs', requireAuth, getProjectAuditLogs);

export default router;
