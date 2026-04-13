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
  metadata?: any,
) => {
  // Fire and forget to avoid blocking the main request path
  (async () => {
    try {
      const details =
        typeof metadata?.details === 'string'
          ? metadata.details
          : typeof metadata?.key === 'string'
            ? metadata.key
            : null;

      await query(
        `INSERT INTO audit_logs 
         (user_id, project_id, action, details, metadata) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, projectId, action, details, metadata ? JSON.stringify(metadata) : null]
      );
    } catch (err) {
      console.error('Audit log background task failed:', err);
    }
  })();
};

export default pool;
