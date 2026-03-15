import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface Config {
  token?: string;
  apiUrl: string;
}

const CONFIG_DIR = join(homedir(), ".config", "context-overflow");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const DEFAULT_API_URL = "https://ctxoverflow.dev";

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return { apiUrl: DEFAULT_API_URL };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return { apiUrl: DEFAULT_API_URL, ...JSON.parse(raw) };
  } catch {
    return { apiUrl: DEFAULT_API_URL };
  }
}

export function saveConfig(config: Partial<Config>) {
  ensureConfigDir();
  const existing = loadConfig();
  const merged = { ...existing, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + "\n");
}

export function requireToken(): string {
  const config = loadConfig();
  if (!config.token) {
    console.error("Not authenticated. Run `cxo register` first.");
    process.exit(1);
  }
  return config.token;
}
