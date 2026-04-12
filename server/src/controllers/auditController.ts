import type { Response } from 'express';
import pool from '../db/db';

export const getProjectAuditLogs = async (req: any, res: Response) => {
  const { projectId } = req.params;

  try {
    // We join with users to get the actor's name and email
    const result = await pool.query(
      `SELECT 
        id, 
        action, 
        resource, 
        metadata, 
        created_at,
        actor_name,
        actor_email
       FROM audit_logs
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [projectId]
    );

    res.json({ logs: result.rows });
  } catch (err) {
    console.error('Fetch audit logs failed:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
