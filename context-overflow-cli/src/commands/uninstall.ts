import { Command } from "commander";
import {
  intro,
  outro,
  confirm,
  select,
  spinner,
  note,
  cancel,
  log,
  isCancel,
} from "@clack/prompts";
import pc from "picocolors";
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  GLOBAL_CURSOR_PLUGIN_DIR,
  GLOBAL_CURSOR_PLUGIN_DIR_LEGACY,
  CONTEXT_OVERFLOW_CLAUDE_MARKETPLACE_NAME,
  CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID,
  detectClaudeCodeInstall,
  detectProjectClaudeLocalInstall,
  hasClaudeContextOverflowInSettings,
  removeClaudeCodeSettings,
  removeClaudeProjectContextOverflowHooks,
  removeContextOverflowFromClaudeProjectMcp,
} from "../mcp-merge.js";
import { uninstallGlobalClaudeContextOverflowPlugin } from "../claude-plugin-cli.js";

const GLOBAL_CONFIG_DIR = join(homedir(), ".context-overflow");

/** Paths under `.cursor/` installed by `installLocalCursorFiles` (mirror plugin layout). */
const LOCAL_CURSOR_INSTALLED_PATHS = [
  "agents/context-overflow.md",
  "rules/co-when-stuck.mdc",
  "rules/co-task-start.mdc",
  "rules/co-task-end.mdc",
  "skills/context-overflow/SKILL.md",
  "hooks/session-start.sh",
  "hooks/session-end.sh",
];

/** Paths under `.claude/` installed by `installLocalClaudeFiles`. */
const LOCAL_CLAUDE_INSTALLED_PATHS = [
  "agents/context-overflow.md",
  "skills/context-overflow/SKILL.md",
  "hooks/session-start.sh",
  "hooks/session-end.sh",
];

const CLEANABLE_CURSOR_DIRS = ["agents", "rules", "skills", "hooks"];

const CLEANABLE_CLAUDE_DIRS = ["agents", "skills", "hooks"];

function handleCancel(value: unknown): value is symbol {
  if (isCancel(value)) {
    cancel("Uninstall cancelled.");
    process.exit(0);
  }
  return false;
}

function detectGlobal(): boolean {
  return (
    existsSync(join(GLOBAL_CONFIG_DIR, "config.json")) ||
    existsSync(GLOBAL_CURSOR_PLUGIN_DIR) ||
    existsSync(GLOBAL_CURSOR_PLUGIN_DIR_LEGACY) ||
    detectClaudeCodeInstall()
  );
}

function detectProjectCursorLocalInstall(projectDir: string): boolean {
  if (existsSync(join(projectDir, ".cursor", "agents", "context-overflow.md"))) {
    return true;
  }

  const hooksPath = join(projectDir, ".cursor", "hooks.json");
  if (existsSync(hooksPath)) {
    try {
      const raw = JSON.parse(readFileSync(hooksPath, "utf-8")) as Record<string, unknown>;
      const hooks = raw.hooks;
      if (hooks && typeof hooks === "object") {
        for (const events of Object.values(hooks as Record<string, unknown>)) {
          if (!Array.isArray(events)) continue;
          for (const ev of events) {
            if (!ev || typeof ev !== "object") continue;
            const cmd = (ev as Record<string, unknown>).command;
            if (typeof cmd === "string" && cmd.includes(".cursor/hooks/session-start.sh")) {
              return true;
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  const mcpFile = join(projectDir, ".cursor", "mcp.json");
  if (existsSync(mcpFile)) {
    try {
      const config = JSON.parse(readFileSync(mcpFile, "utf-8")) as Record<string, unknown>;
      const servers = config.mcpServers as Record<string, unknown> | undefined;
      if (servers && "context-overflow" in servers) return true;
    } catch {
      /* ignore */
    }
  }

  return false;
}

function detectLocal(projectDir: string): boolean {
  return (
    existsSync(join(projectDir, ".context-overflow", "config.json")) ||
    detectProjectClaudeLocalInstall(projectDir) ||
    detectProjectCursorLocalInstall(projectDir)
  );
}

function removeIfExists(path: string): boolean {
  if (!existsSync(path)) return false;
  rmSync(path, { recursive: true, force: true });
  return true;
}

/** Remove a single installed file or directory path without throwing on type mismatch. */
function removeInstalledPathIfExists(path: string): boolean {
  if (!existsSync(path)) return false;
  try {
    const st = statSync(path);
    if (st.isDirectory()) {
      rmSync(path, { recursive: true, force: true });
    } else {
      unlinkSync(path);
    }
  } catch {
    return false;
  }
  return true;
}

function isDirEmpty(path: string): boolean {
  if (!existsSync(path)) return false;
  try {
    const st = statSync(path);
    if (!st.isDirectory()) return false;
    return readdirSync(path).length === 0;
  } catch {
    return false;
  }
}

async function cleanupGlobal(
  onClaudeProgress?: (message: string) => void
): Promise<string[]> {
  const removed: string[] = [];

  if (removeIfExists(GLOBAL_CONFIG_DIR)) {
    removed.push("~/.context-overflow/");
  }
  if (removeIfExists(GLOBAL_CURSOR_PLUGIN_DIR)) {
    removed.push("~/.cursor/plugins/local/context-overflow-cursor-plugin/");
  }
  if (removeIfExists(GLOBAL_CURSOR_PLUGIN_DIR_LEGACY)) {
    removed.push("~/.cursor/plugins/local/context-overflow-plugin/");
  }
  let claudeCliWarning: string | null = null;
  if (detectClaudeCodeInstall() || hasClaudeContextOverflowInSettings()) {
    try {
      const claudeUninstall = await uninstallGlobalClaudeContextOverflowPlugin(
        onClaudeProgress
      );
      if (claudeUninstall.pluginRemoved) {
        removed.push(`Claude Code plugin: uninstalled (${CONTEXT_OVERFLOW_CLAUDE_PLUGIN_ID})`);
      }
      if (claudeUninstall.marketplaceRemoved) {
        removed.push(
          `Claude Code marketplace: removed (${CONTEXT_OVERFLOW_CLAUDE_MARKETPLACE_NAME})`
        );
      }
    } catch (e) {
      claudeCliWarning = (e as Error).message;
    }
  }
  if (removeClaudeCodeSettings()) {
    removed.push("~/.claude/settings.json (context-overflow entries removed)");
  }
  if (claudeCliWarning) {
    removed.push(`Claude plugin CLI: ${claudeCliWarning} (settings cleaned up if present)`);
  }

  return removed;
}

function removeContextOverflowFromMcp(projectDir: string): boolean {
  const mcpFile = join(projectDir, ".cursor", "mcp.json");
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

function removeGitignoreEntry(projectDir: string, entry: string): boolean {
  const gitignorePath = join(projectDir, ".gitignore");
  if (!existsSync(gitignorePath)) return false;

  const content = readFileSync(gitignorePath, "utf-8");
  if (!content.includes(entry)) return false;

  const lines = content.split("\n");
  const filtered = lines.filter((line) => line.trim() !== entry.trim());
  const result = filtered.join("\n").replace(/\n{3,}/g, "\n\n");
  writeFileSync(gitignorePath, result);
  return true;
}

function cleanupLocal(projectDir: string): string[] {
  const removed: string[] = [];
  const cursorDir = join(projectDir, ".cursor");
  const claudeDir = join(projectDir, ".claude");

  for (const rel of LOCAL_CURSOR_INSTALLED_PATHS) {
    const full = join(cursorDir, rel);
    if (removeInstalledPathIfExists(full)) {
      removed.push(`.cursor/${rel}`);
    }
  }

  if (removeInstalledPathIfExists(join(cursorDir, "hooks.json"))) {
    removed.push(".cursor/hooks.json");
  }

  if (removeContextOverflowFromMcp(projectDir)) {
    removed.push(".cursor/mcp.json (context-overflow server removed)");
  }

  for (const rel of LOCAL_CLAUDE_INSTALLED_PATHS) {
    const full = join(claudeDir, rel);
    if (removeInstalledPathIfExists(full)) {
      removed.push(`.claude/${rel}`);
    }
  }

  if (removeClaudeProjectContextOverflowHooks(projectDir)) {
    removed.push(
      ".claude/settings.local.json or .claude/settings.json (context-overflow hooks removed)"
    );
  }

  if (removeContextOverflowFromClaudeProjectMcp(projectDir)) {
    removed.push(".mcp.json (context-overflow server removed)");
  }

  if (removeGitignoreEntry(projectDir, ".context-overflow/")) {
    removed.push(".gitignore (removed .context-overflow/ entry)");
  }

  const rmEmptyDir = (absPath: string, label: string) => {
    if (!isDirEmpty(absPath)) return;
    // Node requires recursive (or rmdirSync) to remove a directory path; plain rmSync() is for files only.
    rmSync(absPath, { recursive: true, force: true });
    removed.push(label);
  };

  rmEmptyDir(
    join(cursorDir, "skills", "context-overflow"),
    ".cursor/skills/context-overflow/ (empty, removed)"
  );
  rmEmptyDir(
    join(claudeDir, "skills", "context-overflow"),
    ".claude/skills/context-overflow/ (empty, removed)"
  );

  for (const dir of CLEANABLE_CURSOR_DIRS) {
    rmEmptyDir(join(cursorDir, dir), `.cursor/${dir}/ (empty, removed)`);
  }

  for (const dir of CLEANABLE_CLAUDE_DIRS) {
    rmEmptyDir(join(claudeDir, dir), `.claude/${dir}/ (empty, removed)`);
  }

  rmEmptyDir(claudeDir, ".claude/ (empty, removed)");

  if (removeIfExists(join(projectDir, ".context-overflow"))) {
    removed.push(".context-overflow/");
  }

  return removed;
}

export const uninstallCommand = new Command("uninstall")
  .description("Remove Context Overflow configuration and files")
  .action(async () => {
    intro(pc.bgCyan(pc.black(" Context Overflow — Uninstall ")));

    const projectDir = process.cwd();
    const hasGlobal = detectGlobal();
    const hasLocal = detectLocal(projectDir);

    if (!hasGlobal && !hasLocal) {
      log.info("No Context Overflow installation detected.");
      outro("Nothing to do.");
      return;
    }

    let removeGlobal = false;
    let removeLocal = false;

    if (hasGlobal && hasLocal) {
      const scope = await select({
        message: "Both global and local installations detected. What would you like to remove?",
        options: [
          { value: "both", label: "Both", hint: "remove everything" },
          { value: "global", label: "Global only", hint: "~/.context-overflow + Cursor/Claude Code plugins" },
          {
            value: "local",
            label: "Local (this project) only",
            hint: ".context-overflow + .cursor / .claude files",
          },
        ],
      });
      if (handleCancel(scope)) return;

      removeGlobal = scope === "global" || scope === "both";
      removeLocal = scope === "local" || scope === "both";
    } else if (hasGlobal) {
      const shouldRemove = await confirm({
        message: "Remove global Context Overflow installation?",
        active: "Yes",
        inactive: "No",
        initialValue: true,
      });
      if (handleCancel(shouldRemove)) return;
      if (!shouldRemove) {
        outro("Uninstall cancelled.");
        return;
      }
      removeGlobal = true;
    } else {
      const shouldRemove = await confirm({
        message: "Remove local Context Overflow installation from this project?",
        active: "Yes",
        inactive: "No",
        initialValue: true,
      });
      if (handleCancel(shouldRemove)) return;
      if (!shouldRemove) {
        outro("Uninstall cancelled.");
        return;
      }
      removeLocal = true;
    }

    const s = spinner();
    const allRemoved: string[] = [];

    try {
      if (removeGlobal) {
        s.start("Removing global installation...");
        const removed = await cleanupGlobal((msg) => s.message(msg));
        allRemoved.push(...removed);
        s.stop(
          removed.length > 0
            ? "Global installation removed"
            : "No global files found to remove"
        );
      }

      if (removeLocal) {
        s.start("Removing local installation...");
        const removed = cleanupLocal(projectDir);
        allRemoved.push(...removed);
        s.stop(
          removed.length > 0
            ? "Local installation removed"
            : "No local files found to remove"
        );
      }
    } catch (e) {
      const err = e as Error;
      s.stop(pc.red("Uninstall failed"), 1);
      console.error(pc.red(err.message));
      if (process.env.DEBUG) {
        console.error(err.stack);
      }
      process.exit(1);
    }

    if (allRemoved.length > 0) {
      note(
        allRemoved.map((r) => pc.dim(r)).join("\n"),
        "Removed"
      );
    }

    outro(pc.green("Uninstall complete. Restart your editor to apply changes."));
  });
