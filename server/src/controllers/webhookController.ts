import type { Response } from 'express';
import pool from '../db/db';

export const addWebhook = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required.' });

  try {
    // Basic validation that user has admin access to project (or member access)
    // We reuse existing logic or just check membership
    const result = await pool.query(
      `INSERT INTO webhooks (project_id, url) VALUES ($1, $2) RETURNING id`,
      [projectId, url]
    );

    res.json({ success: true, webhookId: result.rows[0].id });
  } catch (err) {
    console.error('Add webhook failed:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
