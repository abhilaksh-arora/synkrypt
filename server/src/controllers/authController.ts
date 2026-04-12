import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import pool, { hashSessionToken, logAudit } from '../db/db';

const SESSION_COOKIE = 'synkrypt_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET env var is not set.');
  return secret;
}

function cookieOptions(maxAge?: number) {
  const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
  const maxAgeStr = maxAge !== undefined ? `; Max-Age=${maxAge}` : '';
  return `HttpOnly; Path=/; SameSite=Lax${secure ? '; Secure' : ''}${maxAgeStr}`;
}

async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hashSessionToken(token), expiresAt]
  );
  return token;
}

// POST /auth/register
// Open only when no users exist (first admin) OR when called by an admin via invite flow
export const register = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'email, name, and password are required.' });
  }

  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(countResult.rows[0].count, 10);

    // Lock registration once any user exists — admins use POST /users (invite) instead
    if (userCount > 0) {
      // Allow if request is from a logged-in admin (invite flow handled in userController)
      return res.status(403).json({ error: 'Registration is closed. Contact your admin.' });
    }

    // First user → admin
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, email, name, role`,
      [email, name, password_hash]
    );

    const user = result.rows[0];
    const token = await createSession(user.id);

    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; ${cookieOptions()}`);
    res.json({ user });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /auth/setup-status — tells the UI whether first-run registration is available
export const setupStatus = async (_req: Request, res: Response) => {
  const countResult = await pool.query('SELECT COUNT(*) FROM users');
  const userCount = parseInt(countResult.rows[0].count, 10);
  res.json({ needsSetup: userCount === 0 });
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = await createSession(user.id);
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; ${cookieOptions()}`);
    await logAudit(user.id, null, 'login', `User logged in: ${user.email}`);
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /auth/logout
export const logout = async (req: Request, res: Response) => {
  const cookieHeader = req.headers.cookie || '';
  const token = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${SESSION_COOKIE}=`))
    ?.split('=')[1];

  if (token) {
    await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [hashSessionToken(token)]);
  }

  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=deleted; ${cookieOptions(0)}`);
  res.json({ success: true });
};

// GET /auth/me
export const me = async (req: any, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
