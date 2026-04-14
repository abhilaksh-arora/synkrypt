import type { Request, Response } from 'express';
import pool, { logAudit } from '../db/db';

// GET /orgs
export const listOrgs = async (req: any, res: Response) => {
  try {
    let result;
    if (req.user.is_platform_admin) {
      result = await pool.query(
        'SELECT id, name, created_by, created_at FROM organizations ORDER BY created_at ASC'
      );
    } else {
      result = await pool.query(
        `SELECT o.id, o.name, o.created_by, o.created_at
         FROM organizations o
         JOIN organization_members om ON om.org_id = o.id
         WHERE om.user_id = $1
         ORDER BY o.created_at ASC`,
        [req.user.id]
      );
    }
    res.json({ orgs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /orgs
export const createOrg = async (req: any, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required.' });

  try {
    const result = await pool.query(
      `INSERT INTO organizations (name, created_by) VALUES ($1, $2)
       RETURNING id, name, created_by, created_at`,
      [name, req.user.id]
    );
    const org = result.rows[0];

    // Creator is automatically the 'owner'
    await pool.query(
      'INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [org.id, req.user.id, 'owner']
    );

    res.status(201).json({ org });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /orgs/:id
export const getOrg = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const orgResult = await pool.query(
      'SELECT id, name, created_by, created_at FROM organizations WHERE id = $1',
      [id]
    );
    if (!orgResult.rows.length) return res.status(404).json({ error: 'Org not found.' });

    const membersResult = await pool.query(
      `SELECT u.id, u.email, u.name, u.is_platform_admin as global_admin, om.role as org_role
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       WHERE om.org_id = $1`,
      [id]
    );

    res.json({ org: orgResult.rows[0], members: membersResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /orgs/:id
export const deleteOrg = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const orgCheck = await pool.query('SELECT created_by FROM organizations WHERE id = $1', [id]);
    if (!orgCheck.rows.length) return res.status(404).json({ error: 'Org not found.' });
    if (!req.user.is_platform_admin && orgCheck.rows[0].created_by !== req.user.id) {
       return res.status(403).json({ error: 'Only organization owners or admins can delete this organization.' });
    }
    await pool.query('DELETE FROM organizations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /orgs/:id/members
export const addMember = async (req: any, res: Response) => {
  const { id: orgId } = req.params;
  const { userId, role } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  try {
    // Permission check (handled by middleware but added here for safety if called directly)
    if (!req.user.is_platform_admin && req.orgRole !== 'owner' && req.orgRole !== 'admin') {
       return res.status(403).json({ error: 'Only organization owners or admins can manage members.' });
    }

    await pool.query(
      'INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role',
      [orgId, userId, role || 'member']
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /orgs/:id/members/:userId
export const removeMember = async (req: any, res: Response) => {
  const { id: orgId, userId } = req.params;
  try {
    // Permission check (handled by middleware)
    if (!req.user.is_platform_admin && req.orgRole !== 'owner' && req.orgRole !== 'admin') {
       return res.status(403).json({ error: 'Only organization owners or admins can manage members.' });
    }

    await pool.query(
      'DELETE FROM organization_members WHERE org_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
