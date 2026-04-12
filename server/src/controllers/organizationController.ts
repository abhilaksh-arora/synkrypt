import type { Request, Response } from 'express';
import pool, { logAudit } from '../db/db';

// GET /orgs
export const listOrgs = async (req: any, res: Response) => {
  try {
    let result;
    if (req.user.role === 'admin') {
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

    // Creator is automatically a member
    await pool.query(
      'INSERT INTO organization_members (org_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [org.id, req.user.id]
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
      `SELECT u.id, u.email, u.name, u.role
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
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  try {
    await pool.query(
      'INSERT INTO organization_members (org_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [orgId, userId]
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
