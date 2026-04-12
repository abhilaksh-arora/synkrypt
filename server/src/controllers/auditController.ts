import type { Request, Response } from 'express';
import pool from '../db/db';

export const listLogs = async (req: any, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        l.id, 
        l.action, 
        l.details, 
        l.created_at,
        u.name as user_name,
        u.email as user_email,
        p.name as project_name
       FROM audit_logs l
       LEFT JOIN users u ON l.user_id = u.id
       LEFT JOIN projects p ON l.project_id = p.id
       ORDER BY l.created_at DESC
       LIMIT 100`
    );

    res.json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
