import pool from '../db/db';
import type { SynkryptEnvironment } from '../utils/environment';
import logger from '../utils/logger';

type EffectiveAccess = {
  canRead: boolean;
  canWrite: boolean;
  source: string;
  projectRole: string | null;
  orgRole: string | null;
  ruleTemplateId: string | null;
};

export async function getProjectMemberAccess(
  projectId: string,
  userId: string,
  environment: SynkryptEnvironment
): Promise<EffectiveAccess | null> {
  try {
    const result = await pool.query(
      `SELECT
         p.organization_id,
         pm.role AS project_role,
         pm.assigned_rule_template_id,
         om.role AS org_role,
         rtr.can_read,
         rtr.can_write
       FROM projects p
       LEFT JOIN project_members pm
         ON pm.project_id = p.id AND pm.user_id = $2
       LEFT JOIN organization_members om
         ON om.organization_id = p.organization_id AND om.user_id = $2
       LEFT JOIN rule_template_rules rtr
         ON rtr.rule_template_id = pm.assigned_rule_template_id AND rtr.environment = $3
       WHERE p.id = $1`,
      [projectId, userId, environment]
    );

    if (result.rows.length === 0) {
      logger.warn({ projectId, userId }, 'Policy evaluation: Project not found');
      return null;
    }

    const row = result.rows[0];
    if (!row.project_role || !row.org_role) {
      logger.debug({ projectId, userId }, 'Policy evaluation: No direct membership found');
      return null;
    }

    let access: EffectiveAccess;

    if (['owner', 'admin', 'moderator'].includes(row.org_role) || ['project_admin', 'project_maintainer'].includes(row.project_role)) {
      access = {
        canRead: true,
        canWrite: true,
        source: 'admin-bypass',
        projectRole: row.project_role,
        orgRole: row.org_role,
        ruleTemplateId: row.assigned_rule_template_id || null,
      };
    } else if (row.assigned_rule_template_id) {
      access = {
        canRead: Boolean(row.can_read),
        canWrite: Boolean(row.can_write),
        source: 'rule-template',
        projectRole: row.project_role,
        orgRole: row.org_role,
        ruleTemplateId: row.assigned_rule_template_id,
      };
    } else if (row.project_role === 'project_viewer') {
      access = {
        canRead: true,
        canWrite: false,
        source: 'project-role',
        projectRole: row.project_role,
        orgRole: row.org_role,
        ruleTemplateId: null,
      };
    } else {
      access = {
        canRead: true,
        canWrite: true,
        source: 'project-role',
        projectRole: row.project_role,
        orgRole: row.org_role,
        ruleTemplateId: null,
      };
    }

    logger.debug({ projectId, userId, env: environment, source: access.source, canRead: access.canRead, canWrite: access.canWrite }, 'Policy evaluated');
    return access;
  } catch (err: any) {
    logger.error({ err: err.message, projectId, userId }, 'Policy evaluation failed');
    return null;
  }
}

export async function getOrganizationMemberRole(
  organizationId: string,
  userId: string
): Promise<string | null> {
  try {
    const result = await pool.query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [organizationId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].role as string;
  } catch (err: any) {
    logger.error({ err: err.message, organizationId, userId }, 'Failed to fetch org member role');
    return null;
  }
}
