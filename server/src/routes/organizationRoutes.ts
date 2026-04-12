import { Router } from 'express';
import {
  listOrgs, createOrg, getOrg, deleteOrg, addMember, removeMember
} from '../controllers/organizationController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import projectRoutes from './projectRoutes';

const router = Router();

router.get('/', requireAuth, listOrgs);
router.post('/', requireAuth, requireAdmin, createOrg);
router.get('/:id', requireAuth, getOrg);
router.delete('/:id', requireAuth, requireAdmin, deleteOrg);
router.post('/:id/members', requireAuth, requireAdmin, addMember);
router.delete('/:id/members/:userId', requireAuth, requireAdmin, removeMember);

// Nest project routes under orgs
router.use('/:orgId/projects', projectRoutes);

export default router;
