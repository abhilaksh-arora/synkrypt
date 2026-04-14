// Central wrapper for all server logic
const BASE_URL =
  process.env.SYNKRYPT_SERVER_URL || "https://synkrypt.abhilaksharora.com";

import { getSession } from "./config";

export async function request(method: string, path: string, body?: any) {
  let token;
  try {
    token = getSession();
  } catch {
    // some endpoints don't need auth (like login)
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const body = await res.text();
    let err = body || `HTTP ${res.status}`;
    try {
      const data = JSON.parse(body);
      if (data.error) err = data.error;
    } catch {}
    throw new Error(err);
  }

  return res.json();
}

export const api = {
  login: (body: any) => request("POST", "/auth/login", body),
  getProjectByKey: (key: string) => request("GET", `/projects/by-key/${key}`),
  pullSecrets: (projectId: string, env: string) =>
    request("GET", `/projects/${projectId}/secrets/pull?env=${env}`),
  runSecrets: (projectId: string, env: string) =>
    request("GET", `/projects/${projectId}/secrets/run?env=${env}`),
  getMe: () => request("GET", "/auth/me"),
};
