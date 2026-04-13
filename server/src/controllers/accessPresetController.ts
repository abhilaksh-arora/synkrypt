import type { Request, Response } from 'express';
import pool from '../db/db';

// GET /access-presets
export const listPresets = async (req: any, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM access_presets ORDER BY name ASC');
    res.json({ presets: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /access-presets
export const createPreset = async (req: any, res: Response) => {
  const { name, environments, description } = req.body;
  if (!name || !Array.isArray(environments)) {
    return res.status(400).json({ error: 'name and environments[] are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO access_presets (name, environments, description) VALUES ($1, $2, $3) RETURNING *',
      [name, environments, description || null]
    );
    res.status(201).json({ preset: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Preset name already exists.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /access-presets/:id
export const deletePreset = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM access_presets WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Initialize default presets (Helper for setup)
export const seedDefaultPresets = async () => {
  const defaults = [
    { name: 'Senior Developer', envs: ['dev', 'staging', 'prod'], desc: 'Full architectural authority across all clusters.' },
    { name: 'Developer', envs: ['dev', 'staging'], desc: 'Standard access for feature development and integration testing.' },
    { name: 'Product Manager', envs: ['dev'], desc: 'Limited visibility for environment tracking and feature validation.' },
    { name: 'Contractor (Temporary)', envs: ['dev'], desc: 'Restricted dev-only access with defined expiration protocols.' }
  ];

  for (const d of defaults) {
    await pool.query(
      'INSERT INTO access_presets (name, environments, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
      [d.name, d.envs, d.desc]
    );
  }
};
