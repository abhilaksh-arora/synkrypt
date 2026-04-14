import { Pool } from "pg";
import crypto from "crypto";
import logger from "../utils/logger";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/synkrypt",
});

export const query = async (text: string, params?: any[]) => {
  const start = process.hrtime.bigint();
  try {
    const res = await pool.query(text, params);
    const duration = Number(process.hrtime.bigint() - start) / 1_000_000;

    if (duration > 100) {
      logger.warn(
        { durationMs: duration.toFixed(2), query: text.substring(0, 100) },
        "Slow query detected",
      );
    } else {
      logger.debug(
        { durationMs: duration.toFixed(2), query: text.substring(0, 50) },
        "Database query executed",
      );
    }

    return res;
  } catch (err: any) {
    logger.error(
      { err: err.message, query: text.substring(0, 100) },
      "Database query failed",
    );
    throw err;
  }
};

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const logAudit = async (
  userId: string | null,
  projectId: string | null,
  action: string,
  metadata?: any,
) => {
  // Fire and forget to avoid blocking the main request path
  (async () => {
    try {
      const details =
        typeof metadata?.details === "string"
          ? metadata.details
          : typeof metadata?.key === "string"
            ? metadata.key
            : null;

      await query(
        `INSERT INTO audit_logs 
         (user_id, project_id, action, details, metadata) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          projectId,
          action,
          details,
          metadata ? JSON.stringify(metadata) : null,
        ],
      );
    } catch (err) {
      console.error("Audit log background task failed:", err);
    }
  })();
};

export default pool;
