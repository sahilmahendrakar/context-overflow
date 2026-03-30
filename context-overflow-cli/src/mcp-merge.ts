import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const MCP_URL = "https://www.ctxoverflow.dev/api/mcp";

export const GLOBAL_CURSOR_PLUGIN_DIR = join(
  homedir(),
  ".cursor",
  "plugins",
  "local",
  "context-overflow-plugin"
);

function contextOverflowServer(token: string) {
  return {
    url: MCP_URL,
    headers: { Authorization: `Bearer ${token}` },
  };
}

export function mergeProjectMcpConfig(projectRoot: string, token: string) {
  const mcpDir = join(projectRoot, ".cursor");
  const mcpFile = join(mcpDir, "mcp.json");

  let config: Record<string, unknown> = { mcpServers: {} };
  if (existsSync(mcpFile)) {
    try {
      config = JSON.parse(readFileSync(mcpFile, "utf-8"));
    } catch {
      // corrupt file, start fresh
    }
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }

  (config.mcpServers as Record<string, unknown>)["context-overflow"] =
    contextOverflowServer(token);

  mkdirSync(mcpDir, { recursive: true });
  writeFileSync(mcpFile, JSON.stringify(config, null, 2) + "\n");
}

export function mergePluginMcpConfig(pluginRoot: string, token: string) {
  const mcpFile = join(pluginRoot, "mcp.json");

  let config: Record<string, unknown> = { mcpServers: {} };
  if (existsSync(mcpFile)) {
    try {
      config = JSON.parse(readFileSync(mcpFile, "utf-8"));
    } catch {
      // corrupt file, start fresh
    }
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }

  (config.mcpServers as Record<string, unknown>)["context-overflow"] =
    contextOverflowServer(token);

  writeFileSync(mcpFile, JSON.stringify(config, null, 2) + "\n");
}

export function syncGlobalPluginMcpIfInstalled(token: string) {
  if (existsSync(GLOBAL_CURSOR_PLUGIN_DIR)) {
    mergePluginMcpConfig(GLOBAL_CURSOR_PLUGIN_DIR, token);
  }
}
