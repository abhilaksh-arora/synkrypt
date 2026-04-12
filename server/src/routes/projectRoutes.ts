import { Router } from 'express';
import {
  listProjects, createProject, getProject, deleteProject, updateProject,
  addMember, removeMember, getProjectByKey
} from '../controllers/projectController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import { addWebhook } from '../controllers/webhookController';
import secretRoutes from './secretRoutes';

const router = Router({ mergeParams: true });

// Org-scoped
router.get('/', requireAuth, listProjects);
router.post('/', requireAuth, requireAdmin, createProject);

// Project-scoped (standalone, used by /projects/:id paths in app.ts)
router.get('/by-key/:projectKey', requireAuth, getProjectByKey);
router.get('/:id', requireAuth, getProject);
router.put('/:id', requireAuth, requireAdmin, updateProject);
router.delete('/:id', requireAuth, requireAdmin, deleteProject);
router.post('/:id/members', requireAuth, requireAdmin, addMember);
router.delete('/:id/members/:userId', requireAuth, requireAdmin, removeMember);
router.post('/:id/webhooks', requireAuth, addWebhook);

// Nest secrets under projects
router.use('/:projectId/secrets', secretRoutes);

export default router;
