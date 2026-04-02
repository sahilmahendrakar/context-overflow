import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { runClaudeCli } from "./claude-exec.js";

export const MCP_URL = "https://www.ctxoverflow.dev/api/mcp";

/** Sent on MCP HTTP requests so the server can default tool `projectId` (see /api/mcp). */
export const CXO_PROJECT_ID_HEADER = "X-CXO-Project-Id";

export const GLOBAL_CURSOR_PLUGIN_DIR = join(
  homedir(),
  ".cursor",
  "plugins",
  "local",
  "context-overflow-cursor-plugin"
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

function contextOverflowClaudeHttpServer(token: string) {
  return {
    type: "http",
    url: MCP_URL,
    headers: { Authorization: `Bearer ${token}` },
  };
}

export const CXO_CLAUDE_LOCAL_HOOK_START = ".claude/hooks/session-start.sh";
export const CXO_CLAUDE_LOCAL_HOOK_END = ".claude/hooks/session-end.sh";

const SESSION_START = "SessionStart";
const SESSION_END = "SessionEnd";

function groupReferencesCxoHook(group: unknown, pathMarker: string): boolean {
  if (!group || typeof group !== "object") return false;
  const inner = (group as Record<string, unknown>).hooks;
  if (!Array.isArray(inner)) return false;
  return inner.some((h) => {
    if (h == null || typeof h !== "object") return false;
    const cmd = (h as Record<string, unknown>).command;
    return typeof cmd === "string" && cmd.includes(pathMarker);
  });
}

export function mergeClaudeProjectMcpConfig(projectRoot: string, token: string) {
  const mcpFile = join(projectRoot, ".mcp.json");

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
    contextOverflowClaudeHttpServer(token);

  writeFileSync(mcpFile, JSON.stringify(config, null, 2) + "\n");
}

export function detectProjectClaudeLocalInstall(projectDir: string): boolean {
  return existsSync(
    join(projectDir, ".claude", "skills", "context-overflow", "SKILL.md")
  );
}

export function syncClaudeProjectMcpIfInstalled(token: string, projectDir: string) {
  if (detectProjectClaudeLocalInstall(projectDir)) {
    mergeClaudeProjectMcpConfig(projectDir, token);
  }
}

const CLAUDE_PROJECT_SETTINGS_LOCAL = "settings.local.json";
const CLAUDE_PROJECT_SETTINGS_SHARED = "settings.json";

function stripCxoHooksFromClaudeProjectSettingsFile(
  settingsPath: string
): boolean {
  if (!existsSync(settingsPath)) return false;

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    return false;
  }

  const hooksRoot = settings.hooks;
  if (!hooksRoot || typeof hooksRoot !== "object") return false;

  const h = hooksRoot as Record<string, unknown>;
  let changed = false;

  for (const [key, marker] of [
    [SESSION_START, CXO_CLAUDE_LOCAL_HOOK_START],
    [SESSION_END, CXO_CLAUDE_LOCAL_HOOK_END],
  ] as const) {
    const arr = h[key];
    if (!Array.isArray(arr)) continue;
    const filtered = arr.filter((g) => !groupReferencesCxoHook(g, marker));
    if (filtered.length !== arr.length) {
      changed = true;
      if (filtered.length === 0) {
        delete h[key];
      } else {
        h[key] = filtered;
      }
    }
  }

  if (changed && Object.keys(h).length === 0) {
    delete settings.hooks;
  }

  if (changed) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  }
  return changed;
}

export function mergeClaudeProjectContextOverflowHooks(projectDir: string) {
  const claudeDir = join(projectDir, ".claude");
  const settingsPath = join(claudeDir, CLAUDE_PROJECT_SETTINGS_LOCAL);

  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    } catch {
      settings = {};
    }
  }

  if (!settings.hooks || typeof settings.hooks !== "object") {
    settings.hooks = {};
  }
  const hooksRoot = settings.hooks as Record<string, unknown>;

  let sessionStart = hooksRoot[SESSION_START];
  if (!Array.isArray(sessionStart)) sessionStart = [];
  const ssArr = sessionStart as unknown[];
  if (!ssArr.some((g) => groupReferencesCxoHook(g, CXO_CLAUDE_LOCAL_HOOK_START))) {
    ssArr.push({
      hooks: [
        {
          type: "command",
          command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-start.sh',
        },
      ],
    });
  }
  hooksRoot[SESSION_START] = ssArr;

  let sessionEnd = hooksRoot[SESSION_END];
  if (!Array.isArray(sessionEnd)) sessionEnd = [];
  const seArr = sessionEnd as unknown[];
  if (!seArr.some((g) => groupReferencesCxoHook(g, CXO_CLAUDE_LOCAL_HOOK_END))) {
    seArr.push({
      matcher: "prompt_input_exit|other",
      hooks: [
        {
          type: "command",
          command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-end.sh',
        },
      ],
    });
  }
  hooksRoot[SESSION_END] = seArr;

  mkdirSync(claudeDir, { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");

  stripCxoHooksFromClaudeProjectSettingsFile(
    join(claudeDir, CLAUDE_PROJECT_SETTINGS_SHARED)
  );
}

export function removeClaudeProjectContextOverflowHooks(projectDir: string): boolean {
  const claudeDir = join(projectDir, ".claude");
  const localChanged = stripCxoHooksFromClaudeProjectSettingsFile(
    join(claudeDir, CLAUDE_PROJECT_SETTINGS_LOCAL)
  );
  const sharedChanged = stripCxoHooksFromClaudeProjectSettingsFile(
    join(claudeDir, CLAUDE_PROJECT_SETTINGS_SHARED)
  );
  return localChanged || sharedChanged;
}

export function removeContextOverflowFromClaudeProjectMcp(projectDir: string): boolean {
  const mcpFile = join(projectDir, ".mcp.json");
  if (!existsSync(mcpFile)) return false;

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(readFileSync(mcpFile, "utf-8"));
  } catch {
    return false;
  }

  const servers = config.mcpServers as Record<string, unknown> | undefined;
  if (!servers || !("context-overflow" in servers)) return false;

  delete servers["context-overflow"];

  if (Object.keys(servers).length === 0) {
    unlinkSync(mcpFile);
  } else {
    writeFileSync(mcpFile, JSON.stringify(config, null, 2) + "\n");
  }
  return true;
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

// --- Claude Code settings helpers ---

export const CLAUDE_SETTINGS_DIR = join(homedir(), ".claude");
export const CLAUDE_SETTINGS_PATH = join(CLAUDE_SETTINGS_DIR, "settings.json");

export const CONTEXT_OVERFLOW_CLAUDE_MARKETPLACE_NAME = "context-overflow-plugins";
export const CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID = `context-overflow@${CONTEXT_OVERFLOW_CLAUDE_MARKETPLACE_NAME}`;

function readClaudeSettings(): Record<string, unknown> {
  if (!existsSync(CLAUDE_SETTINGS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CLAUDE_SETTINGS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeClaudeSettings(settings: Record<string, unknown>) {
  mkdirSync(CLAUDE_SETTINGS_DIR, { recursive: true });
  writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");
}

function listInstalledClaudePluginsFromCli(): { id: string }[] | null {
  const r = runClaudeCli(["plugin", "list", "--json"]);
  if (r.enoent || r.status !== 0 || !r.stdout.trim()) return null;
  try {
    const parsed = JSON.parse(r.stdout) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (x): x is { id: string } =>
        x != null && typeof x === "object" && typeof (x as { id?: unknown }).id === "string"
    );
  } catch {
    return null;
  }
}

export function mergeClaudeContextOverflowPluginToken(token: string) {
  const settings = readClaudeSettings();

  if (!settings.pluginConfigs || typeof settings.pluginConfigs !== "object") {
    settings.pluginConfigs = {};
  }
  const pluginConfigs = settings.pluginConfigs as Record<string, unknown>;
  if (
    !pluginConfigs[CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID] ||
    typeof pluginConfigs[CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID] !== "object"
  ) {
    pluginConfigs[CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID] = {};
  }
  const pluginEntry = pluginConfigs[CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID] as Record<string, unknown>;
  if (!pluginEntry.options || typeof pluginEntry.options !== "object") {
    pluginEntry.options = {};
  }
  (pluginEntry.options as Record<string, unknown>).token = token;

  writeClaudeSettings(settings);
}

export function removeClaudeCodeSettings() {
  if (!existsSync(CLAUDE_SETTINGS_PATH)) return false;

  const settings = readClaudeSettings();
  let changed = false;

  const marketplaces = settings.extraKnownMarketplaces as Record<string, unknown> | undefined;
  if (marketplaces && CONTEXT_OVERFLOW_CLAUDE_MARKETPLACE_NAME in marketplaces) {
    delete marketplaces[CONTEXT_OVERFLOW_CLAUDE_MARKETPLACE_NAME];
    if (Object.keys(marketplaces).length === 0) delete settings.extraKnownMarketplaces;
    changed = true;
  }

  const enabled = settings.enabledPlugins as Record<string, unknown> | undefined;
  if (enabled && CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID in enabled) {
    delete enabled[CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID];
    if (Object.keys(enabled).length === 0) delete settings.enabledPlugins;
    changed = true;
  }

  const configs = settings.pluginConfigs as Record<string, unknown> | undefined;
  if (configs && CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID in configs) {
    delete configs[CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID];
    if (Object.keys(configs).length === 0) delete settings.pluginConfigs;
    changed = true;
  }

  if (changed) {
    writeClaudeSettings(settings);
  }
  return changed;
}

export function detectClaudeCodeInstall(): boolean {
  const fromCli = listInstalledClaudePluginsFromCli();
  if (fromCli?.some((p) => p.id === CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID)) {
    return true;
  }
  if (!existsSync(CLAUDE_SETTINGS_PATH)) return false;
  const settings = readClaudeSettings();
  const enabled = settings.enabledPlugins as Record<string, unknown> | undefined;
  return !!(enabled && CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID in enabled);
}

export function hasClaudeContextOverflowInSettings(): boolean {
  if (!existsSync(CLAUDE_SETTINGS_PATH)) return false;
  const settings = readClaudeSettings();
  const marketplaces = settings.extraKnownMarketplaces as Record<string, unknown> | undefined;
  if (marketplaces && CONTEXT_OVERFLOW_CLAUDE_MARKETPLACE_NAME in marketplaces) return true;
  const enabled = settings.enabledPlugins as Record<string, unknown> | undefined;
  if (enabled && CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID in enabled) return true;
  const configs = settings.pluginConfigs as Record<string, unknown> | undefined;
  return !!(configs && CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID in configs);
}

export function syncClaudeContextOverflowPluginTokenIfInstalled(token: string) {
  if (detectClaudeCodeInstall()) {
    mergeClaudeContextOverflowPluginToken(token);
  }
}
