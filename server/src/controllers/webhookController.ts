import type { Response } from 'express';
import pool from '../db/db';

export const addWebhook = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required.' });

  try {
    // Ownership check: Admin or Project Creator
    const projectCheck = await pool.query('SELECT created_by FROM projects WHERE id = $1', [projectId]);
    if (!projectCheck.rows.length) return res.status(404).json({ error: 'Project not found.' });
    if (req.user.role !== 'admin' && projectCheck.rows[0].created_by !== req.user.id) {
       return res.status(403).json({ error: 'Only project owners or admins can manage webhooks.' });
    }

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
