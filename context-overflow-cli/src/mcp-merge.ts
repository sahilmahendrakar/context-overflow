import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const MCP_URL = "https://www.ctxoverflow.dev/api/mcp";

/** Sent on MCP HTTP requests so the server can default tool `projectId` (see /api/mcp). */
export const CXO_PROJECT_ID_HEADER = "X-CXO-Project-Id";

export const GLOBAL_CURSOR_PLUGIN_DIR = join(
  homedir(),
  ".cursor",
  "plugins",
  "local",
  "context-overflow-plugin"
);

export function contextOverflowServer(token: string, projectId?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  const pid = projectId?.trim();
  if (pid) {
    headers[CXO_PROJECT_ID_HEADER] = pid;
  }
  return {
    url: MCP_URL,
    headers,
  };
}

export function mergeProjectMcpConfig(projectRoot: string, token: string, projectId?: string) {
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
    contextOverflowServer(token, projectId);

  mkdirSync(mcpDir, { recursive: true });
  writeFileSync(mcpFile, JSON.stringify(config, null, 2) + "\n");
}

export function mergePluginMcpConfig(pluginRoot: string, token: string, projectId?: string) {
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
    contextOverflowServer(token, projectId);

  writeFileSync(mcpFile, JSON.stringify(config, null, 2) + "\n");
}

/** If `.mcp.json` exists at project root (e.g. Claude Code), merge context-overflow headers. */
export function mergeClaudeRootMcpIfExists(
  projectRoot: string,
  token: string,
  projectId: string
) {
  const mcpFile = join(projectRoot, ".mcp.json");
  if (!existsSync(mcpFile)) return;

  let config: Record<string, unknown> = { mcpServers: {} };
  try {
    config = JSON.parse(readFileSync(mcpFile, "utf-8"));
  } catch {
    return;
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }

  const existing = (config.mcpServers as Record<string, unknown>)["context-overflow"] as
    | Record<string, unknown>
    | undefined;
  const next: Record<string, unknown> = {
    ...contextOverflowServer(token, projectId),
    ...(existing?.type !== undefined ? { type: existing.type } : {}),
  };

  (config.mcpServers as Record<string, unknown>)["context-overflow"] = next;
  writeFileSync(mcpFile, JSON.stringify(config, null, 2) + "\n");
}

export function syncGlobalPluginMcpIfInstalled(token: string) {
  if (existsSync(GLOBAL_CURSOR_PLUGIN_DIR)) {
    mergePluginMcpConfig(GLOBAL_CURSOR_PLUGIN_DIR, token);
  }
}
