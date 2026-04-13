import crypto from "crypto";
import type { Request, Response } from "express";
import pool, { logAudit } from "../db/db";

function generateProjectKey(): string {
  return "pk_" + crypto.randomBytes(12).toString("hex");
}

function generateMasterKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

function encryptMasterKey(masterKeyHex: string): string {
  const serverSecret = process.env.SERVER_SECRET;
  if (!serverSecret) throw new Error("SERVER_SECRET env var not set.");
  const key = Buffer.from(serverSecret.slice(0, 64), "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(masterKeyHex),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
    tag: tag.toString("hex"),
  });
}

export function decryptMasterKey(encryptedJson: string): string {
  const serverSecret = process.env.SERVER_SECRET;
  if (!serverSecret) throw new Error("SERVER_SECRET env var not set.");
  const data = JSON.parse(encryptedJson);
  const key = Buffer.from(serverSecret.slice(0, 64), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(data.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(data.tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.content, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString();
}

// Utility to ensure sensitive fields are never returned
function sanitizeProject(project: any) {
  if (!project) return project;
  const { master_key, ...sanitized } = project;
  return sanitized;
}

// GET /projects
export const listProjects = async (req: any, res: Response) => {
  try {
    let result;
    if (req.user.role === "admin") {
      result = await pool.query(
        `SELECT id, name, description, github_repo, project_key, created_by, created_at
         FROM projects ORDER BY created_at ASC`,
      );
    } else {
      result = await pool.query(
        `SELECT p.id, p.name, p.description, p.github_repo, p.project_key, p.created_by, p.created_at
         FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = $1 AND (pm.expires_at IS NULL OR pm.expires_at > now())
         ORDER BY p.created_at ASC`,
        [req.user.id],
      );
    }
    res.json({ projects: result.rows.map(sanitizeProject) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// POST /projects
export const createProject = async (req: any, res: Response) => {
  const { name, description, github_repo } = req.body;
  if (!name) return res.status(400).json({ error: "name is required." });

  try {
    const project_key = generateProjectKey();
    const rawMasterKey = generateMasterKey();
    const master_key = encryptMasterKey(rawMasterKey);

    const result = await pool.query(
      `INSERT INTO projects (name, description, github_repo, project_key, master_key, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, github_repo, project_key, created_by, created_at`,
      [
        name,
        description ?? null,
        github_repo ?? null,
        project_key,
        master_key,
        req.user.id,
      ],
    );

    const project = result.rows[0];

    await pool.query(
      `INSERT INTO project_members (project_id, user_id, environments, preset_name)
       VALUES ($1, $2, $3, $4)`,
      [project.id, req.user.id, ["dev", "staging", "prod"], 'Senior Developer'],
    );

    logAudit(req.user.id, project.id, "project_create", { name: project.name });
    res.status(201).json({ project: sanitizeProject(project) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// GET /projects/:id
export const getProject = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const projectResult = await pool.query(
      `SELECT id, name, description, github_repo, project_key, created_by, created_at
       FROM projects WHERE id = $1`,
      [id],
    );
    if (!projectResult.rows.length)
      return res.status(404).json({ error: "Project not found." });

    const membersResult = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, pm.environments, pm.preset_name, pm.expires_at, pm.last_active_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [id],
    );

    res.json({ 
      project: sanitizeProject(projectResult.rows[0]), 
      members: membersResult.rows 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// PUT /projects/:id
export const updateProject = async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, description, github_repo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE projects SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         github_repo = COALESCE($3, github_repo)
       WHERE id = $4
       RETURNING id, name, description, github_repo, project_key`,
      [name ?? null, description ?? null, github_repo ?? null, id],
    );
    if (!result.rows.length) return res.status(404).json({ error: "Project not found." });
    
    logAudit(req.user.id, id, "project_update", { projectId: id });
    res.json({ project: sanitizeProject(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// DELETE /projects/:id
export const deleteProject = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM projects WHERE id = $1", [id]);
    logAudit(req.user.id, id, "project_delete", { projectId: id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// POST /projects/:id/members
export const addMember = async (req: any, res: Response) => {
  const { id: projectId } = req.params;
  const { userId, environments, presetName, expiresAt } = req.body;
  if (!userId || !Array.isArray(environments)) {
    return res.status(400).json({ error: "userId and environments[] are required." });
  }

  try {
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, environments, preset_name, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (project_id, user_id) DO UPDATE SET 
         environments = EXCLUDED.environments,
         preset_name = EXCLUDED.preset_name,
         expires_at = EXCLUDED.expires_at`,
      [projectId, userId, environments, presetName || null, expiresAt || null],
    );
    logAudit(req.user.id, projectId, "member_add", { targetUserId: userId, preset: presetName });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// DELETE /projects/:id/members/:userId
export const removeMember = async (req: any, res: Response) => {
  const { id: projectId, userId } = req.params;
  try {
    await pool.query(
      "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
      [projectId, userId],
    );
    logAudit(req.user.id, projectId, "member_remove", { targetUserId: userId });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// GET /projects/by-key/:projectKey — resolve project_key → project (CLI use)
export const getProjectByKey = async (req: any, res: Response) => {
  const { projectKey } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.github_repo, p.project_key, p.created_at
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
       WHERE p.project_key = $1 AND (pm.user_id = $2 OR $3 = 'admin') 
       AND (pm.expires_at IS NULL OR pm.expires_at > now() OR $3 = 'admin')`,
      [projectKey, req.user.id, req.user.role],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Project not found, access expired, or access denied." });
    }

    res.json({ project: sanitizeProject(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
};
