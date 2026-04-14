import { Router } from 'express';
import {
  listOrgs, createOrg, getOrg, deleteOrg, addMember, removeMember
} from '../controllers/organizationController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import { requireOrgMember, requireOrgAdmin, requireOrgOwner } from '../middleware/orgMiddleware';
import projectRoutes from './projectRoutes';

const router = Router();

router.get('/', requireAuth, listOrgs);
router.post('/', requireAuth, createOrg);
router.get('/:id', requireAuth, requireOrgMember, getOrg);
router.delete('/:id', requireAuth, requireOrgOwner, deleteOrg);
router.post('/:id/members', requireAuth, requireOrgAdmin, addMember);
router.delete('/:id/members/:userId', requireAuth, requireOrgAdmin, removeMember);

// Nest project routes under orgs
router.use('/:orgId/projects', projectRoutes);

export default router;
