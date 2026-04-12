import fs from "fs";
import path from "path";
import os from "os";

const GLOBAL_CONFIG_DIR = path.join(os.homedir(), ".synkrypt");
const SESSION_FILE = path.join(GLOBAL_CONFIG_DIR, "session.json");
const LOCAL_CONFIG_DIR = ".synkrypt";
const PROJECT_CONFIG = path.join(LOCAL_CONFIG_DIR, "config.json");

export function ensureDirs() {
  if (!fs.existsSync(GLOBAL_CONFIG_DIR)) fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_CONFIG_DIR)) fs.mkdirSync(LOCAL_CONFIG_DIR, { recursive: true });
}

export function saveSession(token: string) {
  ensureDirs();
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ token }, null, 2));
}

export function getSession(): string {
  if (!fs.existsSync(SESSION_FILE)) {
    console.error("❌ Not logged in. Run 'synkrypt login' first.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SESSION_FILE, "utf8")).token;
}

export function getProjectConfig() {
  if (!fs.existsSync(PROJECT_CONFIG)) return null;
  return JSON.parse(fs.readFileSync(PROJECT_CONFIG, "utf8"));
}

export function setProjectConfig(config: any) {
  ensureDirs();
  fs.writeFileSync(PROJECT_CONFIG, JSON.stringify(config, null, 2));
}

export function deleteSession() {
  if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
}

export function requireProjectConfig() {
  const config = getProjectConfig();
  if (!config?.projectKey) {
    console.error("❌ Project not configured. Run 'synkrypt use <projectKey>' first.");
    process.exit(1);
  }
  return config;
}
