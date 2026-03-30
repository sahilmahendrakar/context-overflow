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
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { GLOBAL_CURSOR_PLUGIN_DIR } from "../mcp-merge.js";

const GLOBAL_CONFIG_DIR = join(homedir(), ".context-overflow");

const LOCAL_CURSOR_FILES = [
  "agents/context-overflow.md",
  "rules/co-when-stuck.mdc",
  "rules/co-task-start.mdc",
  "rules/co-task-end.mdc",
  "hooks/session-start.sh",
  "hooks/session-end.sh",
];

const LOCAL_CURSOR_DIRS = [
  "skills/context-overflow",
];

const CLEANABLE_CURSOR_DIRS = ["agents", "rules", "skills", "hooks"];

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
    existsSync(GLOBAL_CURSOR_PLUGIN_DIR)
  );
}

function detectLocal(projectDir: string): boolean {
  return existsSync(join(projectDir, ".context-overflow", "config.json"));
}

function removeIfExists(path: string): boolean {
  if (!existsSync(path)) return false;
  rmSync(path, { recursive: true, force: true });
  return true;
}

function unlinkIfExists(path: string): boolean {
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}

function isDirEmpty(path: string): boolean {
  if (!existsSync(path)) return false;
  return readdirSync(path).length === 0;
}

function cleanupGlobal(): string[] {
  const removed: string[] = [];

  if (removeIfExists(GLOBAL_CONFIG_DIR)) {
    removed.push("~/.context-overflow/");
  }
  if (removeIfExists(GLOBAL_CURSOR_PLUGIN_DIR)) {
    removed.push("~/.cursor/plugins/local/context-overflow-plugin/");
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

  if (removeIfExists(join(projectDir, ".context-overflow"))) {
    removed.push(".context-overflow/");
  }

  for (const file of LOCAL_CURSOR_FILES) {
    if (unlinkIfExists(join(cursorDir, file))) {
      removed.push(`.cursor/${file}`);
    }
  }

  for (const dir of LOCAL_CURSOR_DIRS) {
    if (removeIfExists(join(cursorDir, dir))) {
      removed.push(`.cursor/${dir}/`);
    }
  }

  if (unlinkIfExists(join(cursorDir, "hooks.json"))) {
    removed.push(".cursor/hooks.json");
  }

  if (removeContextOverflowFromMcp(projectDir)) {
    removed.push(".cursor/mcp.json (context-overflow server removed)");
  }

  if (removeGitignoreEntry(projectDir, ".context-overflow/")) {
    removed.push(".gitignore (removed .context-overflow/ entry)");
  }

  for (const dir of CLEANABLE_CURSOR_DIRS) {
    const fullPath = join(cursorDir, dir);
    if (isDirEmpty(fullPath)) {
      rmSync(fullPath);
      removed.push(`.cursor/${dir}/ (empty, removed)`);
    }
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
          { value: "global", label: "Global only", hint: "~/.context-overflow + Cursor plugin" },
          { value: "local", label: "Local (this project) only", hint: ".context-overflow + .cursor files" },
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

    if (removeGlobal) {
      s.start("Removing global installation...");
      const removed = cleanupGlobal();
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

    if (allRemoved.length > 0) {
      note(
        allRemoved.map((r) => pc.dim(r)).join("\n"),
        "Removed"
      );
    }

    outro(pc.green("Uninstall complete. Restart Cursor to apply changes."));
  });
