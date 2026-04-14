import type { Request, Response } from 'express';
import pool from '../db/db';

// GET /audit-logs — Universal forensic stream with advanced filtering
export const listAuditLogs = async (req: any, res: Response) => {
  const { projectId, userId, action, limit = 100, offset = 0 } = req.query;

  try {
    let query = `
      SELECT 
        al.id, 
        al.action, 
        al.details, 
        al.metadata, 
        al.created_at,
        u.name as actor_name, 
        u.email as actor_email,
        p.name as project_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN projects p ON p.id = al.project_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (projectId) {
      params.push(projectId);
      query += ` AND al.project_id = $${params.length}`;
    }

    if (userId) {
      params.push(userId);
      query += ` AND al.user_id = $${params.length}`;
    }

    if (action) {
      params.push(action);
      query += ` AND al.action = $${params.length}`;
    }

    // RBAC: Non-admins can only see logs for projects they are members of
    if (req.user.role !== 'admin') {
      params.push(req.user.id);
      query += ` AND (al.project_id IN (SELECT project_id FROM project_members WHERE user_id = $${params.length}))`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /audit-logs/stats — Quick overview for the dashboard
export const getAuditStats = async (req: any, res: Response) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE action LIKE 'secret_read%') as reads,
        COUNT(*) FILTER (WHERE action LIKE 'secret_write%') as writes,
        COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as last_24h
      FROM audit_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (req.user.role !== 'admin') {
      params.push(req.user.id);
      query += ` AND project_id IN (SELECT project_id FROM project_members WHERE user_id = $1)`;
    }

    const result = await pool.query(query, params);
    res.json({ stats: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
