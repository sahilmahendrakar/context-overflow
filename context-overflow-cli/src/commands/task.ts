import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

interface TaskAttemptDetail {
  id: string;
  createdBy: string;
  creator?: { username?: string } | null;
  createdAt: string;
  summary: string;
  contextIds: string[];
  status: string;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tags: string[];
  creator: { username?: string } | null;
  relatedContextIds?: string[];
  definitionOfDone?: string;
  dependencyIds?: string[];
  requiredCapabilities?: string[];
  attempts?: TaskAttemptDetail[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "OPEN",
  in_progress: "IN PROGRESS",
  done: "DONE",
  cancelled: "CANCELLED",
};

const ATTEMPT_STATUS_LABELS: Record<string, string> = {
  success: "SUCCESS",
  fail: "FAIL",
  blocked: "BLOCKED",
  in_progress: "IN PROGRESS",
};

export const taskCommand = new Command("task")
  .description("View a single task")
  .argument("<id>", "Task ID")
  .action(async (id: string) => {
    requireToken();
    try {
      const client = new ApiClient();
      const t = await client.get<TaskDetail>(`/api/tasks/${id}`);

      const status = STATUS_LABELS[t.status] ?? t.status;
      console.log(`=== [Task] ${t.title} ===`);
      console.log(`Status: ${status} | Priority: ${t.priority.toUpperCase()}`);
      if (t.tags.length > 0) console.log(`Tags: ${t.tags.join(", ")}`);
      console.log(`By: ${t.creator?.username ?? "anonymous"} | Created: ${t.createdAt}`);
      if (t.updatedAt !== t.createdAt) console.log(`Updated: ${t.updatedAt}`);
      console.log();
      console.log(t.description);

      if (t.definitionOfDone) {
        console.log();
        console.log(`Definition of Done: ${t.definitionOfDone}`);
      }
      if (t.requiredCapabilities && t.requiredCapabilities.length > 0) {
        console.log(`Required Capabilities: ${t.requiredCapabilities.join(", ")}`);
      }
      if (t.dependencyIds && t.dependencyIds.length > 0) {
        console.log(`Dependencies: ${t.dependencyIds.join(", ")}`);
      }
      if (t.relatedContextIds && t.relatedContextIds.length > 0) {
        console.log(`Related Context: ${t.relatedContextIds.join(", ")}`);
      }

      if (t.attempts && t.attempts.length > 0) {
        console.log();
        console.log(`--- Attempts (${t.attempts.length}) ---`);
        for (const a of t.attempts) {
          const aStatus = ATTEMPT_STATUS_LABELS[a.status] ?? a.status;
          const who = a.creator?.username ?? "anonymous";
          console.log(`  [${aStatus}] ${a.summary} — by ${who} at ${a.createdAt}`);
          if (a.contextIds.length > 0) {
            console.log(`    Context: ${a.contextIds.join(", ")}`);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to get task: ${(e as Error).message}`);
      process.exit(1);
    }
  });
