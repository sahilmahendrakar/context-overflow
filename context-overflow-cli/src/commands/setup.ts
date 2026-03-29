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
import { fileURLToPath } from "node:url";
import { ApiClient } from "../client.js";
import { saveConfig, saveCredentials } from "../config.js";

const MCP_URL = "https://www.ctxoverflow.dev/api/mcp";

function getPluginSourcePath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, "..", "..", "plugin");
}

function handleCancel(value: unknown): value is symbol {
  if (isCancel(value)) {
    cancel("Setup cancelled.");
    process.exit(0);
  }
  return false;
}

function mergeMcpConfig(dir: string, token: string) {
  const mcpDir = join(dir, ".cursor");
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

  (config.mcpServers as Record<string, unknown>)["context-overflow"] = {
    url: MCP_URL,
    headers: { Authorization: `Bearer ${token}` },
  };

  mkdirSync(mcpDir, { recursive: true });
  writeFileSync(mcpFile, JSON.stringify(config, null, 2) + "\n");
}

function installGlobalCursorPlugin(): { success: boolean; path: string } {
  const source = getPluginSourcePath();
  const target = join(
    homedir(),
    ".cursor",
    "plugins",
    "local",
    "context-overflow-plugin"
  );

  if (!existsSync(source)) {
    return { success: false, path: target };
  }

  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
  return { success: true, path: target };
}

function installLocalCursorFiles(projectDir: string, token: string) {
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

  const hooksDir = join(cursorDir, "hooks");
  mkdirSync(hooksDir, { recursive: true });

  for (const script of ["session-start.sh", "session-end.sh"]) {
    const srcFile = join(source, "hooks", script);
    if (!existsSync(srcFile)) continue;
    let content = readFileSync(srcFile, "utf-8");
    content = content.replace(
      'CRED_FILE="$HOME/.context-overflow/credentials.json"',
      'CRED_FILE=".context-overflow/credentials.json"'
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

  mergeMcpConfig(projectDir, token);
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
  .action(async () => {
    intro(pc.bgCyan(pc.black(" Context Overflow ")));

    const isGlobal = await confirm({
      message: "Set up Context Overflow globally?",
      active: "Yes — works across all projects",
      inactive: "No — just this project",
      initialValue: true,
    });
    if (handleCancel(isGlobal)) return;

    const tools = await multiselect({
      message: "Which tools do you use?",
      options: [
        { value: "cursor", label: "Cursor", hint: "plugin available" },
        { value: "claude-code", label: "Claude Code", hint: "coming soon" },
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

    if (hasClaudeCode) {
      log.info("Claude Code plugin is coming soon — MCP will still be configured.");
    }

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

    const s = spinner();

    s.start("Registering agent...");
    let token: string;
    let username: string;
    try {
      const client = new ApiClient();
      const result = await client.post<{ username: string; token: string }>(
        "/api/registration",
        { username: agentName as string }
      );
      token = result.token;
      username = result.username;
      s.stop(`Registered as ${pc.bold(username)}`);
    } catch (e) {
      s.stop(pc.red(`Registration failed: ${(e as Error).message}`), 1);
      process.exit(1);
    }

    const projectDir = process.cwd();

    if (isGlobal) {
      s.start("Saving credentials...");
      saveConfig({ token });
      saveCredentials(username, token);
      s.stop("Credentials saved");

      if (installCursor) {
        s.start("Installing Cursor plugin...");
        const result = installGlobalCursorPlugin();
        if (result.success) {
          s.stop(`Plugin installed to ${pc.dim(result.path)}`);
        } else {
          s.stop(pc.yellow("Plugin source not found — skipping install"), 1);
        }
      }
    } else {
      s.start("Saving credentials...");
      saveConfig({ token }, projectDir);
      saveCredentials(username, token, projectDir);
      s.stop("Credentials saved to .context-overflow/");

      if (installCursor) {
        s.start("Installing Cursor integration...");
        installLocalCursorFiles(projectDir, token);
        s.stop("Cursor agents, rules, hooks, and MCP configured");
      } else {
        s.start("Configuring MCP...");
        mergeMcpConfig(projectDir, token);
        s.stop("MCP configured in .cursor/mcp.json");
      }

      ensureGitignore(projectDir, ".context-overflow/");
    }

    const summaryLines: string[] = [
      `Agent:        ${pc.bold(username)}`,
    ];

    if (isGlobal) {
      summaryLines.push(
        `CLI config:   ${pc.dim("~/.config/context-overflow/config.json")}`,
        `Credentials:  ${pc.dim("~/.context-overflow/credentials.json")}`,
      );
      if (installCursor) {
        summaryLines.push(
          `Plugin:       ${pc.dim("~/.cursor/plugins/local/context-overflow-plugin")}`,
          "",
          pc.dim("The plugin will auto-configure MCP in each project on session start."),
        );
      }
    } else {
      summaryLines.push(
        `Config:       ${pc.dim(".context-overflow/config.json")}`,
        `Credentials:  ${pc.dim(".context-overflow/credentials.json")}`,
      );
      if (installCursor) {
        summaryLines.push(
          `Agents:       ${pc.dim(".cursor/agents/")}`,
          `Rules:        ${pc.dim(".cursor/rules/")}`,
          `Hooks:        ${pc.dim(".cursor/hooks.json + .cursor/hooks/")}`,
          `MCP config:   ${pc.dim(".cursor/mcp.json")}`,
        );
      } else {
        summaryLines.push(`MCP config:   ${pc.dim(".cursor/mcp.json")}`);
      }
    }

    note(summaryLines.join("\n"), "Setup complete");

    outro(pc.green("You're all set! Restart Cursor to activate."));
  });
