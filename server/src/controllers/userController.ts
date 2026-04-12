import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import pool from '../db/db';

// GET /users — list all users (admin only)
export const listUsers = async (req: any, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at ASC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /users — admin creates (invites) a developer account
export const createUser = async (req: any, res: Response) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'email, name, and password are required.' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, 'developer')
       RETURNING id, email, name, role, created_at`,
      [email, name, password_hash]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /users/:id — admin removes a user
export const deleteUser = async (req: any, res: Response) => {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself.' });

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
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
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
