import type { Response, NextFunction } from 'express';
import pool from '../db/db';
import logger from '../utils/logger';

export const requireOrgRole = (roles: string[]) => {
  return async (req: any, res: Response, next: NextFunction) => {
    const orgId = req.params.orgId || req.params.id; // organizationRoutes usage
    if (!orgId) {
      logger.warn({ path: req.path }, 'Org middleware failed: orgId missing from params');
      return res.status(400).json({ error: 'Organization ID is required.' });
    }

    try {
      // System admins skip these checks
      if (req.user?.role === 'admin') {
        return next();
      }

      const result = await pool.query(
        'SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2',
        [orgId, req.user.id]
      );

      if (!result.rows.length) {
        logger.warn({ userId: req.user.id, orgId }, 'Org access denied: User not a member');
        return res.status(403).json({ error: 'Access denied: You are not a member of this organization.' });
      }

      const userRole = result.rows[0].role;
      req.orgRole = userRole;

      if (!roles.includes(userRole)) {
        logger.warn(
          { userId: req.user.id, orgId, userRole, requiredRoles: roles },
          'Org access denied: Insufficient role'
        );
        return res.status(403).json({ error: `Access denied: Required role one of [${roles.join(', ')}]` });
      }

      next();
    } catch (err: any) {
      logger.error({ err: err.message, orgId, userId: req.user?.id }, 'Org role lookup failed');
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
};

export const requireOrgMember = requireOrgRole(['owner', 'admin', 'member']);
export const requireOrgAdmin = requireOrgRole(['owner', 'admin']);
export const requireOrgOwner = requireOrgRole(['owner']);
