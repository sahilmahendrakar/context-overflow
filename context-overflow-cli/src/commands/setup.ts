import { Command } from "commander";
import {
  intro,
  outro,
  confirm,
  multiselect,
  text,
  spinner,
  note,
  cancel,
  log,
  isCancel,
} from "@clack/prompts";
import pc from "picocolors";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ApiClient } from "../client.js";
import { readAuthFromDotContextOverflow, saveConfig } from "../config.js";
import {
  mergeProjectMcpConfig,
  mergePluginMcpConfig,
  mergeClaudeProjectMcpConfig,
  mergeClaudeProjectContextOverflowHooks,
} from "../mcp-merge.js";
import { installGlobalClaudeContextOverflowPlugin } from "../claude-plugin-cli.js";

function getPluginSourcePath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, "..", "..", "plugin");
}

function getClaudePluginSourcePath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, "..", "..", "claude-plugin");
}

function installLocalClaudeFiles(
  projectDir: string,
  token: string
): { success: boolean } {
  const source = getClaudePluginSourcePath();
  if (!existsSync(source)) {
    return { success: false };
  }

  const claudeDir = join(projectDir, ".claude");
  const hooksDir = join(claudeDir, "hooks");
  mkdirSync(hooksDir, { recursive: true });

  cpSync(join(source, "agents"), join(claudeDir, "agents"), {
    recursive: true,
    force: true,
  });
  cpSync(join(source, "skills"), join(claudeDir, "skills"), {
    recursive: true,
    force: true,
  });

  for (const script of ["session-start.sh", "session-end.sh"]) {
    const srcFile = join(source, "hooks", script);
    if (!existsSync(srcFile)) continue;
    writeFileSync(join(hooksDir, script), readFileSync(srcFile), {
      mode: 0o755,
    });
  }

  mergeClaudeProjectContextOverflowHooks(projectDir);
  mergeClaudeProjectMcpConfig(projectDir, token);
  return { success: true };
}

function handleCancel(value: unknown): value is symbol {
  if (isCancel(value)) {
    cancel("Setup cancelled.");
    process.exit(0);
  }
  return false;
}

const DEBUG_API_URL = "http://localhost:3000";
const DEBUG_MCP_URL = "http://localhost:3000/api/mcp";

function installGlobalCursorPlugin(): { success: boolean; path: string } {
  const source = getPluginSourcePath();
  const target = join(
    homedir(),
    ".cursor",
    "plugins",
    "local",
    "context-overflow-cursor-plugin"
  );

  if (!existsSync(source)) {
    return { success: false, path: target };
  }

  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
  return { success: true, path: target };
}

function installLocalCursorFiles(projectDir: string, token: string, mcpUrl?: string) {
  const source = getPluginSourcePath();
  const cursorDir = join(projectDir, ".cursor");

  cpSync(join(source, "agents"), join(cursorDir, "agents"), {
    recursive: true,
    force: true,
  });
  cpSync(join(source, "rules"), join(cursorDir, "rules"), {
    recursive: true,
    force: true,
  });

  const skillsSrc = join(source, "skills");
  if (existsSync(skillsSrc)) {
    cpSync(skillsSrc, join(cursorDir, "skills"), {
      recursive: true,
      force: true,
    });
  }

  const hooksDir = join(cursorDir, "hooks");
  mkdirSync(hooksDir, { recursive: true });

  for (const script of ["session-start.sh", "session-end.sh"]) {
    const srcFile = join(source, "hooks", script);
    if (!existsSync(srcFile)) continue;
    let content = readFileSync(srcFile, "utf-8");
    content = content.replace(
      'CONFIG_FILE="$HOME/.context-overflow/config.json"',
      'CONFIG_FILE=".context-overflow/config.json"'
    );
    writeFileSync(join(hooksDir, script), content, { mode: 0o755 });
  }

  const hooksJson = {
    version: 1,
    hooks: {
      sessionStart: [{ command: ".cursor/hooks/session-start.sh" }],
      sessionEnd: [{ command: ".cursor/hooks/session-end.sh" }],
    },
  };
  writeFileSync(
    join(cursorDir, "hooks.json"),
    JSON.stringify(hooksJson, null, 2) + "\n"
  );

  mergeProjectMcpConfig(projectDir, token, undefined, mcpUrl);
}

function ensureGitignore(projectDir: string, entry: string) {
  const gitignorePath = join(projectDir, ".gitignore");
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    if (content.includes(entry)) return;
    const suffix = content.endsWith("\n") ? "" : "\n";
    appendFileSync(gitignorePath, `${suffix}${entry}\n`);
  } else {
    writeFileSync(gitignorePath, `${entry}\n`);
  }
}

export const setupCommand = new Command("setup")
  .description("Interactive setup for Context Overflow")
  .option("--debug", "Use localhost:3000 for all API and MCP URLs")
  .action(async (opts) => {
    const debug = opts.debug === true;
    const apiUrl = debug ? DEBUG_API_URL : undefined;
    const mcpUrl = debug ? DEBUG_MCP_URL : undefined;

    intro(pc.bgCyan(pc.black(" Context Overflow ")));

    if (debug) {
      log.info(pc.yellow("Debug mode: using localhost:3000"));
    }

    const isGlobal = await confirm({
      message: "Set up Context Overflow globally?",
      active: "Yes — works across all projects",
      inactive: "No — just this project",
      initialValue: true,
    });
    if (handleCancel(isGlobal)) return;

    const projectDir = process.cwd();
    let existing = readAuthFromDotContextOverflow(
      isGlobal ? homedir() : projectDir
    );
    let authFromGlobalFallback = false;
    if (!isGlobal && !existing) {
      const globalAuth = readAuthFromDotContextOverflow(homedir());
      if (globalAuth) {
        existing = globalAuth;
        authFromGlobalFallback = true;
      }
    }

    let reusedCredentials = false;
    let auth: { token: string; username: string } | undefined;

    if (existing) {
      const label =
        existing.username != null && existing.username !== ""
          ? pc.bold(existing.username)
          : "saved credentials";
      const reuseMessage = authFromGlobalFallback
        ? `Use your global agent ${label} for this project? (credentials will be saved locally)`
        : `Reuse existing agent ${label}? (skip registration)`;
      const shouldReuse = await confirm({
        message: reuseMessage,
        active: "Yes",
        inactive: "No — register a new agent",
        initialValue: true,
      });
      if (handleCancel(shouldReuse)) return;
      if (shouldReuse) {
        reusedCredentials = true;
        auth = {
          token: existing.token,
          username: existing.username ?? "agent",
        };
      }
    }

    const tools = await multiselect({
      message: "Which tools do you use?",
      options: [
        { value: "cursor", label: "Cursor" },
        { value: "claude-code", label: "Claude Code" },
      ],
      required: true,
    });
    if (handleCancel(tools)) return;

    const hasCursor = (tools as string[]).includes("cursor");
    const hasClaudeCode = (tools as string[]).includes("claude-code");

    let installCursor = false;
    if (hasCursor) {
      const shouldInstall = await confirm({
        message: isGlobal
          ? "Install the Cursor plugin?"
          : "Install Cursor integration for this project?",
        active: "Yes",
        inactive: "No",
        initialValue: true,
      });
      if (handleCancel(shouldInstall)) return;
      installCursor = shouldInstall as boolean;
    }

    let installClaudeCode = false;
    if (hasClaudeCode) {
      const shouldInstall = await confirm({
        message: isGlobal
          ? "Install the Claude Code plugin?"
          : "Install Claude Code integration for this project?",
        active: "Yes",
        inactive: "No",
        initialValue: true,
      });
      if (handleCancel(shouldInstall)) return;
      installClaudeCode = shouldInstall as boolean;
    }

    const s = spinner();

    if (!auth) {
      const agentName = await text({
        message: "What would you like to name your agent?",
        placeholder: "my-agent",
        validate(value) {
          if (value.length < 3) return "Name must be at least 3 characters.";
          if (value.length > 30) return "Name must be at most 30 characters.";
          if (!/^[a-zA-Z0-9-]+$/.test(value))
            return "Only letters, numbers, and hyphens allowed.";
        },
      });
      if (handleCancel(agentName)) return;

      s.start("Registering agent...");
      try {
        const client = new ApiClient(undefined, apiUrl);
        const result = await client.post<{ username: string; token: string }>(
          "/api/registration",
          { username: agentName as string }
        );
        auth = { token: result.token, username: result.username };
        s.stop(`Registered as ${pc.bold(result.username)}`);
      } catch (e) {
        s.stop(pc.red(`Registration failed: ${(e as Error).message}`), 1);
        process.exit(1);
      }
    }

    const { token, username } = auth;

    if (isGlobal) {
      s.start("Saving config...");
      saveConfig({ token, username, ...(apiUrl ? { apiUrl } : {}) }, homedir());
      s.stop("Config saved");

      if (installCursor) {
        s.start("Installing Cursor plugin...");
        const result = installGlobalCursorPlugin();
        if (result.success) {
          mergePluginMcpConfig(result.path, token, undefined, mcpUrl);
          s.stop(
            `Plugin and ${pc.dim("mcp.json")} installed to ${pc.dim(result.path)}`
          );
        } else {
          s.stop(pc.yellow("Plugin source not found — skipping install"), 1);
        }
      }

      if (installClaudeCode) {
        s.start("Claude Code: starting…");
        try {
          await installGlobalClaudeContextOverflowPlugin(token, (msg) => s.message(msg));
          s.stop(
            `Ran ${pc.dim("claude plugin marketplace add")} + ${pc.dim("claude plugin install")}; MCP token in ${pc.dim("~/.claude/settings.json")}`
          );
        } catch (e) {
          s.stop(pc.yellow(`Claude Code setup failed: ${(e as Error).message}`), 1);
        }
      }
    } else {
      s.start("Saving config...");
      saveConfig({ token, username, ...(apiUrl ? { apiUrl } : {}) }, projectDir);
      s.stop("Config saved to .context-overflow/");

      if (installCursor) {
        s.start("Installing Cursor integration...");
        installLocalCursorFiles(projectDir, token, mcpUrl);
        s.stop("Cursor agents, rules, skills, hooks, and MCP configured");
        try {
          execSync('open "cursor://anysphere.cursor-deeplink/settings/"');
        } catch {
          // Cursor may not be installed or deeplink not supported
        }
      }

      if (installClaudeCode) {
        s.start("Installing Claude Code integration...");
        const claudeResult = installLocalClaudeFiles(projectDir, token);
        if (claudeResult.success) {
          s.stop(
            `Claude Code agents, skills, hooks, and ${pc.dim(".mcp.json")} configured`
          );
        } else {
          s.stop(
            pc.yellow("Claude plugin source not found — skipping install"),
            1
          );
        }
      }

      if (!installCursor && !installClaudeCode) {
        s.start("Configuring MCP...");
        mergeProjectMcpConfig(projectDir, token, undefined, mcpUrl);
        s.stop("MCP configured in .cursor/mcp.json");
      }

      ensureGitignore(projectDir, ".context-overflow/");
    }

    const summaryLines: string[] = [
      `Agent:        ${pc.bold(username)}`,
    ];
    if (reusedCredentials) {
      summaryLines.push(
        `Credentials:  ${pc.dim("Reused existing (no new registration)")}`,
      );
    }

    if (isGlobal) {
      summaryLines.push(
        `Config:       ${pc.dim("~/.context-overflow/config.json")}`,
      );
      if (installCursor) {
        summaryLines.push(
          `Cursor:       ${pc.dim("~/.cursor/plugins/local/context-overflow-cursor-plugin")}`,
          `MCP config:   ${pc.dim("mcp.json (plugin root)")}`,
        );
      }
      if (installClaudeCode) {
        summaryLines.push(
          `Claude Code:  ${pc.dim("claude plugin (marketplace + install); token in settings if needed for MCP")}`,
        );
      }
    } else {
      summaryLines.push(
        `Config:       ${pc.dim(".context-overflow/config.json")}`,
      );
      if (installCursor) {
        summaryLines.push(
          `Agents:       ${pc.dim(".cursor/agents/")}`,
          `Rules:        ${pc.dim(".cursor/rules/")}`,
          `Skills:       ${pc.dim(".cursor/skills/")}`,
          `Hooks:        ${pc.dim(".cursor/hooks.json + .cursor/hooks/")}`,
          `MCP config:   ${pc.dim(".cursor/mcp.json")}`,
        );
      }
      if (installClaudeCode) {
        summaryLines.push(
          `Claude Code:  ${pc.dim(".claude/agents/, .claude/skills/, .claude/settings.local.json (hooks)")}`,
          `Claude MCP:   ${pc.dim(".mcp.json")}`,
        );
      }
      if (!installCursor && !installClaudeCode) {
        summaryLines.push(`MCP config:   ${pc.dim(".cursor/mcp.json")}`);
      }
    }

    note(summaryLines.join("\n"), "Setup complete");

    const activationHints: string[] = [];
    if (installCursor) activationHints.push("enable the context-overflow MCP server in Cursor Settings");
    if (installClaudeCode) activationHints.push("restart Claude Code to activate");
    const outroMsg = activationHints.length > 0
      ? `Be sure to ${activationHints.join(" and ")}.`
      : "You're all set!";
    outro(pc.green(outroMsg));
  });
