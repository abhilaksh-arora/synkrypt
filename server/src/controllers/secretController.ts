import crypto from 'crypto';
import type { Request, Response } from 'express';
import pool, { logAudit } from '../db/db';
import { decryptMasterKey } from './projectController';
import { notifyRestrictedAccess } from '../utils/notifier';

// ── AES-256-GCM helpers ─────────────────────────────────────────────────────

function encrypt(plaintext: string, masterKeyHex: string) {
  const key = Buffer.from(masterKeyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const content = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('hex'), content: content.toString('hex'), tag: tag.toString('hex') };
}

function decrypt(data: { iv: string; content: string; tag: string }, masterKeyHex: string): string {
  const key = Buffer.from(masterKeyHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(data.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data.content, 'hex')), decipher.final()]).toString();
}

// ── Access helpers ───────────────────────────────────────────────────────────

async function getProjectWithAccess(projectId: string, userId: string, role: string, env: string) {
  if (role === 'admin') {
    const r = await pool.query('SELECT id, master_key FROM projects WHERE id = $1', [projectId]);
    return r.rows[0] ?? null;
  }

  const r = await pool.query(
    `SELECT p.id, p.master_key, pm.environments
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE p.id = $1 AND pm.user_id = $2 
     AND (pm.expires_at IS NULL OR pm.expires_at > now())`,
    [projectId, userId]
  );

  if (!r.rows.length) return null;
  const row = r.rows[0];
  if (!row.environments.includes(env)) return null;

  // Update last active timestamp
  pool.query('UPDATE project_members SET last_active_at = now() WHERE project_id = $1 AND user_id = $2', [projectId, userId]).catch(console.error);

  return row;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

// GET /projects/:projectId/secrets?env=dev
export const listSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const env = req.query.env as string;
  if (!env) return res.status(400).json({ error: 'env query param required.' });

  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, env);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const result = await pool.query(
      `SELECT id, user_id, type, key, encrypted_value, metadata, can_view, created_by, created_at, updated_at
       FROM secrets 
       WHERE project_id = $1 AND environment = $2 
       AND (user_id IS NULL OR user_id = $3)
       ORDER BY key ASC`,
      [projectId, env, req.user.id]
    );

    const masterKey = decryptMasterKey(project.master_key);

    const secrets = result.rows.map(row => ({
      id: row.id,
      key: row.key,
      type: row.type,
      user_id: row.user_id,
      is_personal: !!row.user_id,
      metadata: row.metadata,
      value: row.can_view ? decrypt(row.encrypted_value, masterKey) : null,
      can_view: row.can_view,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    res.json({ secrets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /projects/:projectId/secrets
export const upsertSecret = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { environment, key, value, type, metadata, can_view, isPersonal } = req.body;

  if (!environment || !key || value === undefined) {
    return res.status(400).json({ error: 'environment, key, and value are required.' });
  }

  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, environment);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const masterKey = decryptMasterKey(project.master_key);
    const encrypted_value = encrypt(String(value), masterKey);
    const userId = isPersonal ? req.user.id : null;

    const result = await pool.query(
      `INSERT INTO secrets (project_id, user_id, environment, type, key, encrypted_value, metadata, can_view, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (project_id, environment, key, user_id) DO UPDATE SET
         encrypted_value = EXCLUDED.encrypted_value,
         metadata = COALESCE(EXCLUDED.metadata, secrets.metadata),
         can_view = EXCLUDED.can_view,
         updated_at = now()
       RETURNING id, key, type, user_id, metadata, can_view, created_at, updated_at`,
      [projectId, userId, environment, type || 'env', key, JSON.stringify(encrypted_value), metadata || {}, can_view ?? true, req.user.id]
    );

    logAudit(req.user.id, projectId, 'secret_write', { key, env: environment, type: type || 'env', personal: !!userId });
    res.json({ secret: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /projects/:projectId/secrets/:secretId/visibility
export const updateSecretVisibility = async (req: any, res: Response) => {
  const { projectId, secretId } = req.params;
  const { can_view } = req.body;

  try {
    const result = await pool.query(
      'UPDATE secrets SET can_view = $1 WHERE id = $2 AND project_id = $3 RETURNING key, environment',
      [can_view, secretId, projectId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Secret not found.' });
    
    const secret = result.rows[0];
    logAudit(req.user.id, projectId, 'secret_visibility_change', { key: secret.key, env: secret.environment, can_view });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /projects/:projectId/secrets/:secretId
export const deleteSecret = async (req: any, res: Response) => {
  const { projectId, secretId } = req.params;
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('DELETE FROM secrets WHERE id = $1 AND project_id = $2 RETURNING key, environment', [secretId, projectId]);
    } else {
      result = await pool.query(
        'DELETE FROM secrets WHERE id = $1 AND project_id = $2 AND (user_id = $3 OR user_id IS NULL) RETURNING key, environment', 
        [secretId, projectId, req.user.id]
      );
    }
    if (result.rowCount === 0) return res.status(404).json({ error: 'Secret not found or access denied.' });
    
    const secret = result.rows[0];
    logAudit(req.user.id, projectId, 'secret_delete', { key: secret.key, env: secret.environment });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /projects/:projectId/secrets/pull?env=dev
export const pullSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const env = req.query.env as string;
  if (!env) return res.status(400).json({ error: 'env query param required.' });

  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, env);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const result = await pool.query(
      `SELECT user_id, key, encrypted_value, can_view FROM secrets
       WHERE project_id = $1 AND environment = $2 
       AND (user_id IS NULL OR user_id = $3)
       AND can_view = TRUE ORDER BY user_id ASC NULLS FIRST, key ASC`,
      [projectId, env, req.user.id]
    );

    const masterKey = decryptMasterKey(project.master_key);
    const secrets: Record<string, string> = {};
    for (const row of result.rows) {
      secrets[row.key] = decrypt(row.encrypted_value, masterKey);
    }

    logAudit(req.user.id, projectId, 'secret_read', { env, method: 'pull' });
    res.json({ secrets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /projects/:projectId/secrets/run?env=dev
export const runSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const env = req.query.env as string;
  if (!env) return res.status(400).json({ error: 'env query param required.' });

  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, env);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const result = await pool.query(
      `SELECT user_id, key, encrypted_value, can_view FROM secrets
       WHERE project_id = $1 AND environment = $2 
       AND (user_id IS NULL OR user_id = $3)
       ORDER BY user_id ASC NULLS FIRST, key ASC`,
      [projectId, env, req.user.id]
    );

    const masterKey = decryptMasterKey(project.master_key);
    const secrets: Record<string, string> = {};
    const restrictedValues: string[] = [];

    for (const row of result.rows) {
      const val = decrypt(row.encrypted_value, masterKey);
      secrets[row.key] = val;
      if (row.can_view === false) {
        restrictedValues.push(val);
        notifyRestrictedAccess(projectId, req.user.id, row.key, env);
      }
    }

    logAudit(req.user.id, projectId, 'secret_read', { env, method: 'run' });
    res.json({ secrets, restrictedValues });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /projects/:projectId/secrets/sync
export const syncSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { fromEnv, toEnv } = req.body;

  try {
    const fromProj = await getProjectWithAccess(projectId, req.user.id, req.user.role, fromEnv);
    const toProj = await getProjectWithAccess(projectId, req.user.id, req.user.role, toEnv);
    if (!fromProj || !toProj) return res.status(403).json({ error: 'Access denied to one or both environments.' });

    const secretsResult = await pool.query(
      'SELECT type, key, encrypted_value, metadata, can_view FROM secrets WHERE project_id = $1 AND environment = $2 AND user_id IS NULL',
      [projectId, fromEnv]
    );

    for (const s of secretsResult.rows) {
      await pool.query(
        `INSERT INTO secrets (project_id, environment, type, key, encrypted_value, metadata, can_view, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (project_id, environment, key, user_id) DO UPDATE SET
           encrypted_value = EXCLUDED.encrypted_value,
           metadata = EXCLUDED.metadata,
           can_view = EXCLUDED.can_view`,
        [projectId, toEnv, s.type, s.key, s.encrypted_value, s.metadata, s.can_view, req.user.id]
      );
    }

    logAudit(req.user.id, projectId, 'secret_sync', { from: fromEnv, to: toEnv, count: secretsResult.rowCount });
    res.json({ success: true, count: secretsResult.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /projects/:projectId/secrets/bulk
export const bulkUpsertSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { environment, secrets, isPersonal } = req.body; 
  if (!environment || !secrets || !Array.isArray(secrets)) return res.status(400).json({ error: 'Invalid payload.' });

  const client = await pool.connect();
  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, environment);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const masterKey = decryptMasterKey(project.master_key);
    const userId = isPersonal ? req.user.id : null;

    await client.query('BEGIN');
    for (const s of secrets) {
      if (!s.key || s.value === undefined) continue;
      const encrypted_value = encrypt(String(s.value), masterKey);
      await client.query(
        `INSERT INTO secrets (project_id, user_id, environment, type, key, encrypted_value, metadata, can_view, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (project_id, environment, key, user_id) DO UPDATE SET
           encrypted_value = EXCLUDED.encrypted_value,
           can_view = EXCLUDED.can_view,
           updated_at = now()`,
        [projectId, userId, environment, s.type || 'env', s.key, JSON.stringify(encrypted_value), s.metadata || {}, s.can_view ?? true, req.user.id]
      );
    }
    await client.query('COMMIT');
    logAudit(req.user.id, projectId, 'secret_bulk_write', { count: secrets.length, env: environment });
    res.json({ success: true, count: secrets.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
};
