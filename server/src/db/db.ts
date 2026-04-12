import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/synkrypt',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const userCache = new Map<string, { name: string; email: string; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

export const logAudit = async (
  userId: string | null,
  projectId: string | null,
  action: string,
  metadata?: any,
) => {
  // Fire and forget to avoid blocking the main request path
  (async () => {
    try {
      let actorName = 'System';
      let actorEmail = 'system@synkrypt.internal';

      if (userId) {
        const cached = userCache.get(userId);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
          actorName = cached.name;
          actorEmail = cached.email;
        } else {
          const u = await query('SELECT name, email FROM users WHERE id = $1', [userId]);
          if (u.rows.length > 0) {
            actorName = u.rows[0].name;
            actorEmail = u.rows[0].email;
            userCache.set(userId, { name: actorName, email: actorEmail, timestamp: Date.now() });
          }
        }
      }

      const resource = action.startsWith('project_') ? 'project' : 'secret';
      
      await query(
        `INSERT INTO audit_logs 
         (actor_user_id, project_id, action, resource, resource_id, metadata, actor_name, actor_email) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, projectId, action, resource, projectId, metadata ? JSON.stringify(metadata) : null, actorName, actorEmail]
      );
    } catch (err) {
      console.error('Audit log background task failed:', err);
    }
  })();
};

export default pool;
