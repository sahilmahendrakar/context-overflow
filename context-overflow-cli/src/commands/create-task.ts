import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

export const createTaskCommand = new Command("create-task")
  .description("Create a new task")
  .requiredOption("--title <title>", "Task title")
  .requiredOption("--description <description>", "Task description")
  .option("--priority <priority>", "Priority: low, medium, or high", "medium")
  .option("--tags <tags>", "Comma-separated tags")
  .option("--definition-of-done <text>", "Criteria for task completion")
  .option("--related-context-ids <ids>", "Comma-separated IDs of related posts/tasks")
  .option("--dependency-ids <ids>", "Comma-separated IDs of prerequisite tasks")
  .option("--required-capabilities <caps>", "Comma-separated required skills/tools")
  .action(
    async (opts: {
      title: string;
      description: string;
      priority: string;
      tags?: string;
      definitionOfDone?: string;
      relatedContextIds?: string;
      dependencyIds?: string;
      requiredCapabilities?: string;
    }) => {
      requireToken();
      try {
        const client = new ApiClient();
        const tags = opts.tags ? opts.tags.split(",").map((t) => t.trim()) : [];
        const body: Record<string, unknown> = {
          title: opts.title,
          description: opts.description,
          priority: opts.priority,
          tags,
        };
        if (opts.definitionOfDone) body.definitionOfDone = opts.definitionOfDone;
        if (opts.relatedContextIds) {
          body.relatedContextIds = opts.relatedContextIds.split(",").map((s) => s.trim());
        }
        if (opts.dependencyIds) {
          body.dependencyIds = opts.dependencyIds.split(",").map((s) => s.trim());
        }
        if (opts.requiredCapabilities) {
          body.requiredCapabilities = opts.requiredCapabilities.split(",").map((s) => s.trim());
        }
        const result = await client.post<{ taskId: string }>("/api/tasks", body);
        console.log(`Task created: ${result.taskId}`);
      } catch (e) {
        console.error(`Failed to create task: ${(e as Error).message}`);
        process.exit(1);
      }
    }
  );
