import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import pool, { logAudit } from '../db/db';
import logger from '../utils/logger';

// GET /users — list all users with their project memberships (admin only)
export const listUsers = async (req: any, res: Response) => {
  try {
    const usersResult = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at ASC'
    );
    
    const membershipsResult = await pool.query(
      `SELECT pm.user_id, p.id as project_id, p.name as project_name, pm.environments, pm.preset_name, pm.expires_at
       FROM project_members pm
       JOIN projects p ON p.id = pm.project_id`
    );

    const membershipsByUser: Record<string, any[]> = {};
    for (const m of membershipsResult.rows) {
      if (req.user && !membershipsByUser[m.user_id]) membershipsByUser[m.user_id] = [];
      membershipsByUser[m.user_id]?.push({
        id: m.project_id,
        name: m.project_name,
        environments: m.environments,
        preset: m.preset_name,
        expires_at: m.expires_at
      });
    }

    const users = usersResult.rows.map(u => ({
      ...u,
      projects: membershipsByUser[u.id] || []
    }));

    logger.debug({ userId: req.user.id, count: users.length }, 'Users and memberships listed');
    res.json({ users });
  } catch (err: any) {
    logger.error({ err: err.message, userId: req.user.id }, 'Failed to list users');
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /users — admin creates (invites) a user account
export const createUser = async (req: any, res: Response) => {
  const { email, name, password, role } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'email, name, and password are required.' });
  }

  logger.info({ adminId: req.user.id, targetEmail: email, role }, 'Admin creating new user');

  try {
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email, name, password_hash, role || 'developer']
    );

    const user = result.rows[0];
    logger.info({ adminId: req.user.id, userId: user.id, email: user.email }, 'User created successfully');
    
    res.status(201).json({ user });
  } catch (err: any) {
    if (err.code === '23505') {
      logger.warn({ adminId: req.user.id, targetEmail: email }, 'User creation failed: Email already exists');
      return res.status(409).json({ error: 'Email already registered.' });
    }
    logger.error({ err: err.message, adminId: req.user.id }, 'User creation process failed');
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /users/:id — global wipe (Deletes user + memberships)
export const deleteUser = async (req: any, res: Response) => {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself.' });

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    logAudit(req.user.id, null, 'user_delete', { targetUserId: id });
    logger.info({ adminId: req.user.id, targetUserId: id }, 'User deleted permanently');
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err: err.message, adminId: req.user.id, targetUserId: id }, 'User deletion failed');
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /users/:id/revoke — One-click Revoke All Access (Keeps user identity)
export const revokeAllAccess = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM project_members WHERE user_id = $1 RETURNING *', [id]);
    logAudit(req.user.id, null, 'user_global_revoke', { targetUserId: id, revokedCount: result.rowCount });
    logger.info({ adminId: req.user.id, targetUserId: id, revokedCount: result.rowCount }, 'Global access revocation triggered');
    res.json({ success: true, count: result.rowCount });
  } catch (err: any) {
    logger.error({ err: err.message, adminId: req.user.id, targetUserId: id }, 'Revocation process failed');
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /users/:id/password — user changes their own password
export const changePassword = async (req: any, res: Response) => {
  const { id } = req.params;
  if (id !== req.user.id) return res.status(403).json({ error: 'Cannot change another user\'s password.' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required.' });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      logger.warn({ userId: id }, 'Password change failed: Incorrect current password');
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, id]);
    logger.info({ userId: id }, 'User changed their own password');
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err: err.message, userId: id }, 'Password change failed internally');
    res.status(500).json({ error: 'Internal server error.' });
  }
};
