import pool from '../db/db';
import type { SynkryptEnvironment } from '../utils/environment';

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
    return null;
  }

  const row = result.rows[0];
  if (!row.project_role || !row.org_role) {
    return null;
  }

  if (['owner', 'admin', 'moderator'].includes(row.org_role) || ['project_admin', 'project_maintainer'].includes(row.project_role)) {
    return {
      canRead: true,
      canWrite: true,
      source: 'admin-bypass',
      projectRole: row.project_role,
      orgRole: row.org_role,
      ruleTemplateId: row.assigned_rule_template_id || null,
    };
  }

  if (row.assigned_rule_template_id) {
    return {
      canRead: Boolean(row.can_read),
      canWrite: Boolean(row.can_write),
      source: 'rule-template',
      projectRole: row.project_role,
      orgRole: row.org_role,
      ruleTemplateId: row.assigned_rule_template_id,
    };
  }

  if (row.project_role === 'project_viewer') {
    return {
      canRead: true,
      canWrite: false,
      source: 'project-role',
      projectRole: row.project_role,
      orgRole: row.org_role,
      ruleTemplateId: null,
    };
  }

  return {
    canRead: true,
    canWrite: true,
    source: 'project-role',
    projectRole: row.project_role,
    orgRole: row.org_role,
    ruleTemplateId: null,
  };
}

export async function getOrganizationMemberRole(
  organizationId: string,
  userId: string
): Promise<string | null> {
  const result = await pool.query(
    'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
    [organizationId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].role as string;
}
