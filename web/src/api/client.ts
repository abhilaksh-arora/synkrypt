const BASE = process.env.SYNKRYPT_SERVER_URL || "http://localhost:2809";

async function request(method: string, path: string, body?: any): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  setupStatus: () => request("GET", "/auth/setup-status"),
  register: (body: any) => request("POST", "/auth/register", body),
  login: (body: any) => request("POST", "/auth/login", body),
  logout: () => request("POST", "/auth/logout"),
  me: () => request("GET", "/auth/me"),

  // Users
  listUsers: () => request("GET", "/users"),
  createUser: (body: any) => request("POST", "/users", body),
  deleteUser: (id: string) => request("DELETE", `/users/${id}`),
  changePassword: (id: string, body: any) =>
    request("PUT", `/users/${id}/password`, body),

  // Orgs
  listOrgs: () => request("GET", "/orgs"),
  createOrg: (body: any) => request("POST", "/orgs", body),
  getOrg: (id: string) => request("GET", `/orgs/${id}`),
  deleteOrg: (id: string) => request("DELETE", `/orgs/${id}`),
  addOrgMember: (orgId: string, body: any) =>
    request("POST", `/orgs/${orgId}/members`, body),
  removeOrgMember: (orgId: string, uid: string) =>
    request("DELETE", `/orgs/${orgId}/members/${uid}`),

  // Projects
  listProjects: (orgId: string) => request("GET", `/orgs/${orgId}/projects`),
  createProject: (orgId: string, body: any) =>
    request("POST", `/orgs/${orgId}/projects`, body),
  getProject: (id: string) => request("GET", `/projects/${id}`),
  updateProject: (id: string, body: any) =>
    request("PUT", `/projects/${id}`, body),
  deleteProject: (id: string) => request("DELETE", `/projects/${id}`),
  addProjectMember: (pid: string, body: any) =>
    request("POST", `/projects/${pid}/members`, body),
  removeProjectMember: (pid: string, uid: string) =>
    request("DELETE", `/projects/${pid}/members/${uid}`),

  // Secrets
  listSecrets: (pid: string, env: string) =>
    request("GET", `/projects/${pid}/secrets?env=${env}`),
  upsertSecret: (pid: string, body: any) =>
    request("POST", `/projects/${pid}/secrets`, body),
  deleteSecret: (pid: string, sid: string) =>
    request("DELETE", `/projects/${pid}/secrets/${sid}`),
};
