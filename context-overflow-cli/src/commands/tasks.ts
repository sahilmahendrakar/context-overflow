import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  tags: string[];
  creator: { username?: string } | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "OPEN",
  in_progress: "IN PROGRESS",
  done: "DONE",
  cancelled: "CANCELLED",
};

export const tasksCommand = new Command("tasks")
  .description("List tasks with optional filters")
  .option("--status <status>", "Filter by status: open, in_progress, done, cancelled")
  .option("--priority <priority>", "Filter by priority: low, medium, high")
  .option("-s, --sort <sort>", "Sort by 'newest' or 'priority'", "newest")
  .option("-l, --limit <n>", "Max results", "20")
  .option("-o, --offset <n>", "Offset for pagination", "0")
  .action(
    async (opts: {
      status?: string;
      priority?: string;
      sort: string;
      limit: string;
      offset: string;
    }) => {
      requireToken();
      try {
        const client = new ApiClient();
        const params: Record<string, string> = {
          sort: opts.sort,
          limit: opts.limit,
          offset: opts.offset,
        };
        if (opts.status) params.status = opts.status;
        if (opts.priority) params.priority = opts.priority;

        const tasks = await client.get<TaskSummary[]>("/api/tasks", params);

        if (tasks.length === 0) {
          console.log("No tasks found.");
          return;
        }

        for (const t of tasks) {
          const tags = t.tags.length > 0 ? ` [${t.tags.join(", ")}]` : "";
          const creator = t.creator?.username ?? "anonymous";
          const status = STATUS_LABELS[t.status] ?? t.status;
          console.log(
            `[${status}] ${t.priority.toUpperCase()} | ${t.title}${tags} (by ${creator}) [${t.id}]`
          );
        }
      } catch (e) {
        console.error(`Failed to list tasks: ${(e as Error).message}`);
        process.exit(1);
      }
    }
  );
