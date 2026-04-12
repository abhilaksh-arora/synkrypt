import crypto from 'crypto';
import type { Request, Response } from 'express';
import pool, { logAudit } from '../db/db';
import { decryptMasterKey } from './projectController';

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
     WHERE p.id = $1 AND pm.user_id = $2`,
    [projectId, userId]
  );

  if (!r.rows.length) return null;
  const row = r.rows[0];
  if (!row.environments.includes(env)) return null;
  return row;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

// GET /projects/:projectId/secrets?env=dev
// Returns all secrets for the env. can_view=false secrets show masked value.
export const listSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const env = req.query.env as string;
  if (!env) return res.status(400).json({ error: 'env query param required.' });

  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, env);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const result = await pool.query(
      `SELECT id, key, encrypted_value, can_view, created_by, created_at, updated_at
       FROM secrets WHERE project_id = $1 AND environment = $2 ORDER BY key ASC`,
      [projectId, env]
    );

    const masterKey = decryptMasterKey(project.master_key);

    const secrets = result.rows.map(row => ({
      id: row.id,
      key: row.key,
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
  const { environment, key, value, can_view } = req.body;

  if (!environment || !key || value === undefined) {
    return res.status(400).json({ error: 'environment, key, and value are required.' });
  }

  const validEnvs = ['dev', 'staging', 'prod'];
  if (!validEnvs.includes(environment)) {
    return res.status(400).json({ error: 'environment must be dev, staging, or prod.' });
  }

  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, environment);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const masterKey = decryptMasterKey(project.master_key);
    const encrypted_value = encrypt(String(value), masterKey);

    const result = await pool.query(
      `INSERT INTO secrets (project_id, environment, key, encrypted_value, can_view, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (project_id, environment, key) DO UPDATE SET
         encrypted_value = EXCLUDED.encrypted_value,
         can_view = EXCLUDED.can_view,
         updated_at = now()
       RETURNING id, key, can_view, created_at, updated_at`,
      [projectId, environment, key, JSON.stringify(encrypted_value), can_view ?? true, req.user.id]
    );

    await logAudit(req.user.id, projectId, 'secret_write', `key=${key} env=${environment}`);
    res.json({ secret: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /projects/:projectId/secrets/:secretId
export const deleteSecret = async (req: any, res: Response) => {
  const { projectId, secretId } = req.params;
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });

  try {
    await pool.query('DELETE FROM secrets WHERE id = $1 AND project_id = $2', [secretId, projectId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /projects/:projectId/secrets/pull?env=dev
// CLI: returns decrypted key=value pairs where can_view=true only
export const pullSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const env = req.query.env as string;
  if (!env) return res.status(400).json({ error: 'env query param required.' });

  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, env);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const result = await pool.query(
      `SELECT key, encrypted_value, can_view FROM secrets
       WHERE project_id = $1 AND environment = $2 AND can_view = TRUE ORDER BY key ASC`,
      [projectId, env]
    );

    const masterKey = decryptMasterKey(project.master_key);
    const secrets: Record<string, string> = {};
    for (const row of result.rows) {
      secrets[row.key] = decrypt(row.encrypted_value, masterKey);
    }

    await logAudit(req.user.id, projectId, 'secret_read', `pull env=${env}`);
    res.json({ secrets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /projects/:projectId/secrets/run?env=dev
// CLI: returns ALL accessible decrypted secrets including can_view=false ones (for process injection only)
export const runSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const env = req.query.env as string;
  if (!env) return res.status(400).json({ error: 'env query param required.' });

  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, env);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const result = await pool.query(
      `SELECT key, encrypted_value, can_view FROM secrets
       WHERE project_id = $1 AND environment = $2 ORDER BY key ASC`,
      [projectId, env]
    );

    const masterKey = decryptMasterKey(project.master_key);
    const secrets: Record<string, string> = {};
    const restrictedValues: string[] = [];

    for (const row of result.rows) {
      const val = decrypt(row.encrypted_value, masterKey);
      secrets[row.key] = val;
      if (row.can_view === false) {
        restrictedValues.push(val);
      }
    }

    await logAudit(req.user.id, projectId, 'secret_read', `run env=${env}`);
    res.json({ secrets, restrictedValues });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /projects/:projectId/secrets/bulk
export const bulkUpsertSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { environment, secrets } = req.body; // secrets: [{ key, value, can_view }]

  if (!environment || !secrets || !Array.isArray(secrets)) {
    return res.status(400).json({ error: 'environment and secrets array are required.' });
  }

  const validEnvs = ['dev', 'staging', 'prod'];
  if (!validEnvs.includes(environment)) {
    return res.status(400).json({ error: 'environment must be dev, staging, or prod.' });
  }

  const client = await pool.connect();
  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, environment);
    if (!project) return res.status(403).json({ error: 'Access denied.' });

    const masterKey = decryptMasterKey(project.master_key);

    await client.query('BEGIN');
    
    for (const s of secrets) {
      if (!s.key || s.value === undefined) continue;
      const encrypted_value = encrypt(String(s.value), masterKey);
      await client.query(
        `INSERT INTO secrets (project_id, environment, key, encrypted_value, can_view, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (project_id, environment, key) DO UPDATE SET
           encrypted_value = EXCLUDED.encrypted_value,
           can_view = EXCLUDED.can_view,
           updated_at = now()`,
        [projectId, environment, s.key, JSON.stringify(encrypted_value), s.can_view ?? true, req.user.id]
      );
    }

    await client.query('COMMIT');
    await logAudit(req.user.id, projectId, 'secret_bulk_write', `count=${secrets.length} env=${environment}`);
    res.json({ success: true, count: secrets.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
};

// POST /projects/:projectId/secrets/sync
export const syncSecrets = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { fromEnv, toEnv } = req.body;

  if (!fromEnv || !toEnv) {
    return res.status(400).json({ error: 'fromEnv and toEnv are required.' });
  }

  const validEnvs = ['dev', 'staging', 'prod'];
  if (!validEnvs.includes(fromEnv) || !validEnvs.includes(toEnv)) {
    return res.status(400).json({ error: 'Invalid environment specification.' });
  }

  const client = await pool.connect();
  try {
    const project = await getProjectWithAccess(projectId, req.user.id, req.user.role, fromEnv);
    if (!project) return res.status(403).json({ error: 'Access denied to source environment.' });

    // Ensure access to target as well
    const targetAccess = await getProjectWithAccess(projectId, req.user.id, req.user.role, toEnv);
    if (!targetAccess) return res.status(403).json({ error: 'Access denied to target environment.' });

    await client.query('BEGIN');

    // Get all secrets from source
    const sourceResult = await client.query(
      'SELECT key, encrypted_value, can_view FROM secrets WHERE project_id = $1 AND environment = $2',
      [projectId, fromEnv]
    );

    for (const row of sourceResult.rows) {
      await client.query(
        `INSERT INTO secrets (project_id, environment, key, encrypted_value, can_view, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (project_id, environment, key) DO UPDATE SET
           encrypted_value = EXCLUDED.encrypted_value,
           can_view = EXCLUDED.can_view,
           updated_at = now()`,
        [projectId, toEnv, row.key, row.encrypted_value, row.can_view, req.user.id]
      );
    }

    await client.query('COMMIT');
    await logAudit(req.user.id, projectId, 'secret_sync', `${fromEnv} -> ${toEnv} (count: ${sourceResult.rows.length})`);
    res.json({ success: true, count: sourceResult.rows.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
};

// PATCH /projects/:projectId/secrets/:secretId/visibility
export const updateSecretVisibility = async (req: any, res: Response) => {
  const { projectId, secretId } = req.params;
  const { can_view } = req.body;

  if (can_view === undefined) {
    return res.status(400).json({ error: 'can_view is required.' });
  }

  try {
    await pool.query(
      'UPDATE secrets SET can_view = $1, updated_at = now() WHERE id = $2 AND project_id = $3',
      [can_view, secretId, projectId]
    );

    await logAudit(req.user.id, projectId, 'secret_visibility_change', `id=${secretId} can_view=${can_view}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
