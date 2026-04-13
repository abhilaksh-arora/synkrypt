const BASE = (import.meta as any).env.VITE_SYNKRYPT_SERVER_URL || "http://localhost:2809";

let authTokenGetter: (() => string | null) | null = null;

export const setAuthTokenGetter = (getter: (() => string | null) | null) => {
  authTokenGetter = getter;
};

export async function customFetch<T = any>(
  path: string,
  options: RequestInit & { responseType?: "json" } = {},
): Promise<T> {
  const { responseType, ...fetchOptions } = options;
  const token = authTokenGetter ? authTokenGetter() : null;

  const headers = new Headers(fetchOptions.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith("/api") ? path.slice(4) : path;

  const res = await fetch(`${BASE}${normalizedPath}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (responseType === "json") {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data as T;
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json().catch(() => ({}))) as T;
}

async function request(method: string, path: string, body?: any): Promise<any> {
  return customFetch(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    responseType: "json",
    headers: body ? { "Content-Type": "application/json" } : {},
  });
}

export const api = {
  // Auth
  setupStatus: () => request("GET", "/auth/setup-status"),
  register: (body: any) => request("POST", "/auth/register", body),
  login: (body: any) => request("POST", "/auth/login", body),
  logout: () => request("POST", "/auth/logout"),
  me: () => request("GET", "/auth/me"),

  // Users & Team Management
  listUsers: () => request("GET", "/users"),
  createUser: (body: any) => request("POST", "/users", body),
  deleteUser: (id: string) => request("DELETE", `/users/${id}`),
  revokeAllAccess: (id: string) => request("POST", `/users/${id}/revoke`),
  changePassword: (id: string, body: any) =>
    request("PUT", `/users/${id}/password`, body),

  // Access Presets
  listPresets: () => request("GET", "/access-presets"),
  createPreset: (body: any) => request("POST", "/access-presets", body),
  deletePreset: (id: string) => request("DELETE", `/access-presets/${id}`),

  // User Assets (The Vault)
  listMyAssets: () => request("GET", "/user-assets"),
  getAsset: (id: string) => request("GET", `/user-assets/${id}`),
  issueAsset: (body: any) => request("POST", "/user-assets", body),
  revokeAsset: (id: string) => request("DELETE", `/user-assets/${id}`),
  listUserAssets: (uid: string) => request("GET", `/user-assets/user/${uid}`),

  // Projects
  listProjects: () => request("GET", "/projects"),
  createProject: (body: any) =>
    request("POST", "/projects", body),
  getProject: (id: string) => request("GET", `/projects/${id}`),
  updateProject: (id: string, body: any) =>
    request("PUT", `/projects/${id}`, body),
  deleteProject: (id: string) => request("DELETE", `/projects/${id}`),
  addProjectMember: (pid: string, body: any) =>
    request("POST", `/projects/${pid}/members`, body),
  removeProjectMember: (pid: string, uid: string) =>
    request("DELETE", `/projects/${pid}/members/${uid}`),

  // Secrets & Assets
  listSecrets: (pid: string, env: string) =>
    request("GET", `/projects/${pid}/secrets?env=${env}`),
  upsertSecret: (pid: string, body: any) =>
    request("POST", `/projects/${pid}/secrets`, body),
  bulkUpsertSecrets: (pid: string, body: any) =>
    request("POST", `/projects/${pid}/secrets/bulk`, body),
  deleteSecret: (pid: string, sid: string) =>
    request("DELETE", `/projects/${pid}/secrets/${sid}`),
  
  // Audit Logs
  listAuditLogs: () => request("GET", "/audit-logs"),
  getAuditLogs: (projectId: string) => request("GET", `/audit-logs/${projectId}/logs`),

  // Sync
  syncSecrets: (pid: string, body: { fromEnv: string; toEnv: string }) =>
    request("POST", `/projects/${pid}/secrets/sync`, body),

  updateSecretVisibility: (projectId: string, secretId: string, canView: boolean) => 
    request("PATCH", `/projects/${projectId}/secrets/${secretId}/visibility`, { can_view: canView }),
  
  // Custom request
  request: (method: string, path: string, body?: any) => request(method, path, body),
};
