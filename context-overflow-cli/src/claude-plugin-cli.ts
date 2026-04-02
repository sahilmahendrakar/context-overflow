import { runClaudeCliAsync } from "./claude-exec.js";
import {
  mergeClaudeContextOverflowPluginToken,
  CONTEXT_OVERFLOW_CLAUDE_MARKETPLACE_NAME,
  CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID,
} from "./mcp-merge.js";

const GITHUB_MARKETPLACE_SOURCE = "sahilmahendrakar/context-overflow";

function requireClaudeOnPath(result: Awaited<ReturnType<typeof runClaudeCliAsync>>): void {
  if (result.enoent) {
    throw new Error(
      "Claude Code CLI not found. Install it and ensure `claude` is on your PATH (Claude Code 1.0.33+ required for plugins)."
    );
  }
}

function trimMessage(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t || "unknown error";
}

function benignUninstall(msg: string): boolean {
  return (
    /not found in installed plugins/i.test(msg) ||
    /Plugin ["'][^"']+["'] not found/i.test(msg)
  );
}

function benignMarketplaceRemove(msg: string): boolean {
  return /Marketplace ["'][^"']+["'] not found/i.test(msg);
}

export type ClaudePluginProgress = (message: string) => void;

export type ClaudePluginUninstallResult = {
  pluginRemoved: boolean;
  marketplaceRemoved: boolean;
};

export async function installGlobalClaudeContextOverflowPlugin(
  token: string,
  onProgress?: ClaudePluginProgress
): Promise<void> {
  onProgress?.("Adding marketplace (claude plugin marketplace add)…");
  let result = await runClaudeCliAsync([
    "plugin",
    "marketplace",
    "add",
    GITHUB_MARKETPLACE_SOURCE,
    "--scope",
    "user",
  ]);
  requireClaudeOnPath(result);
  if (result.status !== 0) {
    throw new Error(
      trimMessage(`claude plugin marketplace add failed: ${result.combined}`)
    );
  }

  onProgress?.("Installing plugin (claude plugin install)…");
  result = await runClaudeCliAsync([
    "plugin",
    "install",
    CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID,
    "--scope",
    "user",
  ]);
  requireClaudeOnPath(result);
  if (result.status !== 0) {
    throw new Error(trimMessage(`claude plugin install failed: ${result.combined}`));
  }

  mergeClaudeContextOverflowPluginToken(token);
}

export async function uninstallGlobalClaudeContextOverflowPlugin(
  onProgress?: ClaudePluginProgress
): Promise<ClaudePluginUninstallResult> {
  onProgress?.("Uninstalling plugin (claude plugin uninstall)…");
  let result = await runClaudeCliAsync([
    "plugin",
    "uninstall",
    CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID,
    "--scope",
    "user",
  ]);
  requireClaudeOnPath(result);
  if (result.status !== 0 && !benignUninstall(result.combined)) {
    throw new Error(
      trimMessage(`claude plugin uninstall failed: ${result.combined}`)
    );
  }
  const pluginRemoved = result.status === 0;

  onProgress?.("Removing marketplace (claude plugin marketplace remove)…");
  result = await runClaudeCliAsync([
    "plugin",
    "marketplace",
    "remove",
    CONTEXT_OVERFLOW_CLAUDE_MARKETPLACE_NAME,
  ]);
  requireClaudeOnPath(result);
  if (result.status !== 0 && !benignMarketplaceRemove(result.combined)) {
    throw new Error(
      trimMessage(`claude plugin marketplace remove failed: ${result.combined}`)
    );
  }
  const marketplaceRemoved = result.status === 0;

  return { pluginRemoved, marketplaceRemoved };
}
