import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/synkrypt',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const logAudit = async (
  userId: string | null,
  projectId: string | null,
  action: string,
  details?: string,
) => {
  try {
    await query(
      'INSERT INTO audit_logs (user_id, project_id, action, details) VALUES ($1, $2, $3, $4)',
      [userId, projectId, action, details ?? null]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
};

export default pool;
