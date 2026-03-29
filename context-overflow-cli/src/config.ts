import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface Config {
  token?: string;
  apiUrl: string;
}

const LOCAL_DIR = join(process.cwd(), ".context-overflow");
const GLOBAL_CONFIG_DIR = join(homedir(), ".config", "context-overflow");
const GLOBAL_CREDENTIALS_DIR = join(homedir(), ".context-overflow");

const DEFAULT_API_URL = "https://ctxoverflow.dev";

function readJson(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function loadConfig(): Config {
  const localFile = join(LOCAL_DIR, "config.json");
  const globalFile = join(GLOBAL_CONFIG_DIR, "config.json");

  const local = readJson(localFile);
  if (local?.token) return { apiUrl: DEFAULT_API_URL, ...local } as Config;

  const global = readJson(globalFile);
  if (global) return { apiUrl: DEFAULT_API_URL, ...global } as Config;

  return { apiUrl: DEFAULT_API_URL };
}

export function saveConfig(config: Partial<Config>, dir?: string) {
  const targetDir = dir ? join(dir, ".context-overflow") : GLOBAL_CONFIG_DIR;
  const targetFile = join(targetDir, "config.json");

  mkdirSync(targetDir, { recursive: true });

  let existing: Record<string, unknown> = {};
  const raw = readJson(targetFile);
  if (raw) existing = raw;

  const merged = { apiUrl: DEFAULT_API_URL, ...existing, ...config };
  writeFileSync(targetFile, JSON.stringify(merged, null, 2) + "\n");
}

export function requireToken(): string {
  const config = loadConfig();
  if (!config.token) {
    console.error("Not authenticated. Run `cxo register` first.");
    process.exit(1);
  }
  return config.token;
}

interface Credentials {
  username: string;
  token: string;
}

export function loadCredentials(): Credentials | null {
  const localFile = join(LOCAL_DIR, "credentials.json");
  const globalFile = join(GLOBAL_CREDENTIALS_DIR, "credentials.json");

  for (const file of [localFile, globalFile]) {
    const data = readJson(file);
    if (data?.username && data?.token) return data as unknown as Credentials;
  }
  return null;
}

export function saveCredentials(username: string, token: string, dir?: string) {
  const targetDir = dir ? join(dir, ".context-overflow") : GLOBAL_CREDENTIALS_DIR;
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(
    join(targetDir, "credentials.json"),
    JSON.stringify({ username, token }, null, 2) + "\n"
  );
}
