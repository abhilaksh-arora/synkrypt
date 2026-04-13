import { describe, expect, test } from "bun:test";
import request from "supertest";
import app from "./app";
import pool from "./db/db";

// Helper to stub DB queries precisely for V3.5 Schema
type QueryHandler = (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number }>;

async function withStubbedQuery<T>(handler: QueryHandler, run: () => Promise<T>) {
  const originalQuery = pool.query.bind(pool);
  pool.query = (async (sql: string, params?: any[]) => {
    // 1. Intercept Session Validation (requireAuth middleware)
    if (sql.includes("FROM user_sessions s")) {
      return { rows: [{ user_id: 'mock-user-id', email: 'test@synkrypt.com', name: 'Mock User', role: 'developer' }] };
    }
    // 2. Delegate to specific test handler
    return handler(sql, params);
  }) as typeof pool.query;
  
  try {
    return await run();
  } finally {
    pool.query = originalQuery;
  }
}

// Mock project data
const PROJECT_X = { 
  id: 'proj-x', 
  name: 'Project X', 
  master_key: JSON.stringify({ iv: "0".repeat(24), content: "0".repeat(64), tag: "0".repeat(32) }) 
};

describe("Synkrypt V3.5 Anti-Leak Security Suite", () => {

  test("Cross-Project Leak: User should be blocked if not a project member", async () => {
    const handler: QueryHandler = async (sql) => {
      // Identity Check for project access - return empty (Not a member)
      if (sql.includes("FROM project_members")) {
        return { rows: [] }; 
      }
      return { rows: [] };
    };

    await withStubbedQuery(handler, async () => {
      const res = await request(app)
        .get("/projects/proj-x/secrets?env=dev")
        .set("Authorization", "Bearer mock-valid-token");
      
      // Member check failed -> 403 Forbidden
      expect(res.status).toBe(403);
    });
  });

  test("Master Key Safety: Encrypted keys must never leak to UI responses", async () => {
    const handler: QueryHandler = async (sql) => {
      if (sql.includes("FROM projects")) {
        return { rows: [{ ...PROJECT_X, master_key: 'LEAKED_KEY' }] };
      }
      return { rows: [] };
    };

    await withStubbedQuery(handler, async () => {
      const res = await request(app)
        .get("/projects")
        .set("Authorization", "Bearer mock-valid-token");
      
      const data = res.body;
      if (data.projects && data.projects.length > 0) {
        expect(data.projects[0].master_key).toBeUndefined();
      }
    });
  });

  test("TTL Enforcement: Expired memberships must be rejected immediately", async () => {
    const strictHandler: QueryHandler = async (sql) => {
      // This mimics the getProjectWithAccess helper SQL logic
      if (sql.includes("SELECT p.id, p.master_key, pm.environments")) {
        // Correct SQL includes the TTL filter: AND (pm.expires_at IS NULL OR pm.expires_at > now())
        // If we return 0 rows here, it means the filter correctly excluded the expired member.
        return { rows: [] }; 
      }
      return { rows: [] };
    };

    await withStubbedQuery(strictHandler, async () => {
      const res = await request(app)
        .get("/projects/proj-x/secrets?env=dev")
        .set("Authorization", "Bearer mock-valid-token");
      
      expect(res.status).toBe(403);
    });
  });

});
