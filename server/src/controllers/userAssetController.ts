import crypto from 'crypto';
import type { Request, Response } from 'express';
import pool, { logAudit } from '../db/db';

// ── Encryption Helpers (Using SERVER_SECRET) ────────────────────────────────

function getServerKey() {
  const keyHex = process.env.SERVER_SECRET;
  if (!keyHex || keyHex.length < 64) throw new Error("Invalid SERVER_SECRET");
  return Buffer.from(keyHex.slice(0, 64), 'hex');
}

function encrypt(plaintext: string) {
  const key = getServerKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('hex'), content: encrypted.toString('hex'), tag: tag.toString('hex') };
}

function decrypt(data: { iv: string; content: string; tag: string }): string {
  const key = getServerKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(data.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data.content, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

// ── Endpoints ────────────────────────────────────────────────────────────────

// GET /user-assets — List assets for the logged-in user
export const listMyAssets = async (req: any, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, type, metadata, created_at FROM user_assets WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ assets: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /user-assets/:id — Download/View specific asset
export const getAsset = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    // Admins can see any asset, users can only see their own
    let query = 'SELECT * FROM user_assets WHERE id = $1';
    const params = [id];
    if (req.user.role !== 'admin') {
      query += ' AND user_id = $2';
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    if (!result.rows.length) return res.status(404).json({ error: 'Asset not found.' });

    const asset = result.rows[0];
    const value = decrypt(asset.encrypted_value);

    logAudit(req.user.id, null, 'user_asset_access', { assetId: id, name: asset.name });
    res.json({ ...asset, value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /user-assets — Issue an asset to a user
export const issueAsset = async (req: any, res: Response) => {
  let { userId, name, type, value, metadata } = req.body;
  
  if (req.user.role !== 'admin') {
     userId = req.user.id; // Non-admins can only issue to themselves
  }

  if (!userId || !name || !value) return res.status(400).json({ error: 'userId, name, and value are required.' });

  try {
    const encrypted = encrypt(String(value));
    const result = await pool.query(
      `INSERT INTO user_assets (user_id, name, type, encrypted_value, metadata, issued_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, type, metadata, created_at`,
      [userId, name, type || 'file', JSON.stringify(encrypted), metadata || {}, req.user.id]
    );

    logAudit(req.user.id, null, 'user_asset_issue', { targetUserId: userId, name });
    res.status(201).json({ asset: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /user-assets/:id — Revoke/Delete an asset
export const revokeAsset = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM user_assets WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : '') + ' RETURNING *',
      req.user.role !== 'admin' ? [id, req.user.id] : [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Asset not found.' });

    logAudit(req.user.id, null, 'user_asset_revoke', { assetId: id, name: result.rows[0].name });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /users/:id/assets — List assets for a specific user (Admin only)
export const listUserAssets = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, type, metadata, created_at FROM user_assets WHERE user_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json({ assets: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
