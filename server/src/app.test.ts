import { afterEach, describe, expect, test } from "bun:test";
import crypto from "crypto";
import type { AddressInfo } from "net";
import app from "./app";
import pool from "./db/db";

type QueryHandler = (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount?: number }>;

type RequestOptions = {
  method?: string;
  path: string;
  body?: unknown;
  privateKey: string;
  userId?: string;
};

const openServers: Array<{ close: () => void }> = [];

afterEach(() => {
  while (openServers.length > 0) {
    openServers.pop()?.close();
  }
});

function sign(privateKey: string, timestamp: string, body?: unknown) {
  const data = timestamp + (body ? JSON.stringify(body) : "");
  const signer = crypto.createSign("SHA256");
  signer.update(data);
  signer.end();
  return signer.sign(privateKey, "hex");
}

async function withStubbedQuery<T>(handler: QueryHandler, run: () => Promise<T>) {
  const originalQuery = pool.query.bind(pool);
  pool.query = ((sql: string, params?: unknown[]) => handler(sql, params)) as typeof pool.query;
  try {
    return await run();
  } finally {
    pool.query = originalQuery;
  }
}

async function startServer() {
  const server = app.listen(0);
  openServers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function signedFetch(baseUrl: string, options: RequestOptions) {
  const timestamp = Date.now().toString();
  const signature = sign(options.privateKey, timestamp, options.body);
  return fetch(`${baseUrl}${options.path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": options.userId || "user-test",
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

describe("Server integration", () => {
  test("rejects invalid environments before secret access work continues", async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "pkcs1", format: "pem" },
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
    });

    const queries: string[] = [];
    const baseUrl = await startServer();

    const response = await withStubbedQuery(async (sql) => {
      queries.push(sql);
      if (sql.includes("FROM users WHERE id = $1")) {
        return { rows: [{ publicKey }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    }, async () =>
      signedFetch(baseUrl, {
        path: "/secrets?projectId=proj-1&environment=qa",
        privateKey,
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid environment. Use one of: dev, staging, prod",
    });
    expect(queries).toHaveLength(1);
  });

  test("filters secret reads to explicit secret grants for non-admin users", async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "pkcs1", format: "pem" },
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
    });

    const baseUrl = await startServer();
    const response = await withStubbedQuery(async (sql, params) => {
      if (sql.includes("FROM users WHERE id = $1")) {
        return { rows: [{ publicKey }] };
      }
      if (sql.includes("FROM projects p")) {
        return {
          rows: [{
            organization_id: "org-1",
            project_role: "project_developer",
            assigned_rule_template_id: null,
            org_role: "developer",
            can_read: null,
            can_write: null,
          }],
        };
      }
      if (sql.includes("SELECT encrypted_project_key FROM project_members")) {
        return { rows: [{ encrypted_project_key: "wrapped-project-key" }] };
      }
      if (sql.includes("SELECT organization_id FROM projects WHERE id = $1")) {
        return { rows: [{ organization_id: "org-1" }] };
      }
      if (sql.includes("SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2")) {
        return { rows: [{ role: "developer" }] };
      }
      if (sql.includes("WHERE s.scope = 'organization'")) {
        expect(params).toEqual(["org-1", "dev", "user-test", false]);
        return { rows: [] };
      }
      if (sql.includes("WHERE s.scope = 'project'")) {
        expect(params).toEqual(["proj-1", "dev", "user-test", false]);
        return {
          rows: [{
            id: 11,
            key: "DB_PASSWORD",
            encrypted_value: { iv: "aa", content: "bb", tag: "cc" },
            encryptedSecretKey: "wrapped-secret-key",
            canRead: true,
            canWrite: false,
            hasSecretGrants: true,
          }],
        };
      }
      if (sql.includes("INSERT INTO audit_logs")) {
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`Unexpected query: ${sql}`);
    }, async () =>
      signedFetch(baseUrl, {
        path: "/secrets?projectId=proj-1&environment=dev",
        privateKey,
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json() as {
      secrets: Record<string, unknown>;
      encryptedProjectKey: string;
    };
    expect(json.secrets).toEqual({
      DB_PASSWORD: {
        encryptedValue: { iv: "aa", content: "bb", tag: "cc" },
        encryptedSecretKey: "wrapped-secret-key",
        canWrite: false,
        hasSecretGrants: true,
      },
    });
    expect(json.encryptedProjectKey).toBe("wrapped-project-key");
  });

  test("denies secret writes when an existing secret grant blocks writes", async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "pkcs1", format: "pem" },
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
    });

    const baseUrl = await startServer();
    const response = await withStubbedQuery(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) {
        return { rows: [{ publicKey }] };
      }
      if (sql.includes("FROM projects p")) {
        return {
          rows: [{
            organization_id: "org-1",
            project_role: "project_developer",
            assigned_rule_template_id: null,
            org_role: "developer",
            can_read: null,
            can_write: null,
          }],
        };
      }
      if (sql.includes("SELECT id FROM secrets")) {
        return { rows: [{ id: 99 }] };
      }
      if (sql.includes("SELECT can_write FROM secret_user_access")) {
        return { rows: [{ can_write: false }] };
      }
      if (sql.includes("SELECT organization_id FROM projects WHERE id = $1")) {
        return { rows: [{ organization_id: "org-1" }] };
      }
      if (sql.includes("INSERT INTO audit_logs")) {
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`Unexpected query: ${sql}`);
    }, async () =>
      signedFetch(baseUrl, {
        method: "POST",
        path: "/secrets",
        privateKey,
        body: {
          projectId: "proj-1",
          key: "DB_PASSWORD",
          environment: "dev",
          encryptedValue: { iv: "11", content: "22", tag: "33" },
        },
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json() as { error: string }).toEqual({
      error: "No write access for this secret",
    });
  });

  test("merged secret resolution gives project secrets precedence over organization secrets", async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "pkcs1", format: "pem" },
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
    });

    const baseUrl = await startServer();
    const response = await withStubbedQuery(async (sql, params) => {
      if (sql.includes("FROM users WHERE id = $1")) {
        return { rows: [{ publicKey }] };
      }
      if (sql.includes("FROM projects p")) {
        return {
          rows: [{
            organization_id: "org-1",
            project_role: "project_developer",
            assigned_rule_template_id: null,
            org_role: "developer",
            can_read: null,
            can_write: null,
          }],
        };
      }
      if (sql.includes("SELECT encrypted_project_key FROM project_members")) {
        return { rows: [{ encrypted_project_key: "wrapped-project-key" }] };
      }
      if (sql.includes("SELECT organization_id FROM projects WHERE id = $1")) {
        return { rows: [{ organization_id: "org-1" }] };
      }
      if (sql.includes("SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2")) {
        return { rows: [{ role: "developer" }] };
      }
      if (sql.includes("WHERE s.scope = 'project'")) {
        expect(params).toEqual(["proj-1", "dev", "user-test", false]);
        return {
          rows: [{
            id: 21,
            scope: "project",
            key: "API_URL",
            encrypted_value: { iv: "p1", content: "project", tag: "pt" },
            encryptedSecretKey: "project-secret-key",
            canRead: true,
            canWrite: true,
            hasSecretGrants: true,
          }],
        };
      }
      if (sql.includes("WHERE s.scope = 'organization'")) {
        expect(params).toEqual(["org-1", "dev", "user-test", false]);
        return {
          rows: [{
            id: 22,
            scope: "organization",
            key: "API_URL",
            encrypted_value: { iv: "o1", content: "org", tag: "ot" },
            encryptedSecretKey: "org-secret-key",
            canRead: true,
            canWrite: false,
            hasSecretGrants: true,
          }, {
            id: 23,
            scope: "organization",
            key: "SHARED_TIMEOUT",
            encrypted_value: { iv: "o2", content: "30", tag: "ot2" },
            encryptedSecretKey: "org-secret-key-2",
            canRead: true,
            canWrite: false,
            hasSecretGrants: true,
          }],
        };
      }
      if (sql.includes("INSERT INTO audit_logs")) {
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`Unexpected query: ${sql}`);
    }, async () =>
      signedFetch(baseUrl, {
        path: "/secrets?projectId=proj-1&environment=dev",
        privateKey,
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json() as {
      secrets: Record<string, {
        scope: string;
        encryptedSecretKey: string | null;
        encryptedValue: { iv: string; content: string; tag: string };
        canWrite: boolean | null;
        hasSecretGrants: boolean;
      }>;
    };
    expect(Object.keys(json.secrets).sort()).toEqual(["API_URL", "SHARED_TIMEOUT"]);
    expect(json.secrets.API_URL).toEqual({
      scope: "project",
      encryptedValue: { iv: "p1", content: "project", tag: "pt" },
      encryptedSecretKey: "project-secret-key",
      canWrite: true,
      hasSecretGrants: true,
    });
    expect(json.secrets.SHARED_TIMEOUT).toEqual({
      scope: "organization",
      encryptedValue: { iv: "o2", content: "30", tag: "ot2" },
      encryptedSecretKey: "org-secret-key-2",
      canWrite: false,
      hasSecretGrants: true,
    });
  });
});
