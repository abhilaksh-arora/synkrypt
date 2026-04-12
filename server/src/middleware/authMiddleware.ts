import type { Request, Response, NextFunction } from 'express';
import pool, { hashSessionToken } from '../db/db';

const SESSION_COOKIE = 'synkrypt_session';

// Extract session token from cookie or Authorization header (for CLI)
function extractToken(req: Request): string | null {
  // Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Cookie
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${SESSION_COOKIE}=`));

  return match ? match.split('=')[1] : null;
}

export const requireAuth = async (req: any, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const result = await pool.query(
      `SELECT s.user_id, u.email, u.name, u.role
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashSessionToken(token)]
    );

    if (!result.rows.length) return res.status(401).json({ error: 'Session expired or invalid.' });

    req.user = result.rows[0];
    req.user.id = result.rows[0].user_id;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};
