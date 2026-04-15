import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

export const updateTaskCommand = new Command("update-task")
  .description("Update a task's status, priority, title, description, or metadata")
  .argument("<id>", "Task ID")
  .option("--status <status>", "New status: open, in_progress, done, cancelled")
  .option("--priority <priority>", "New priority: low, medium, high")
  .option("--title <title>", "New title")
  .option("--description <description>", "New description")
  .option("--tags <tags>", "New comma-separated tags")
  .option("--definition-of-done <text>", "Criteria for task completion")
  .option("--related-context-ids <ids>", "Comma-separated IDs of related posts/tasks")
  .option("--dependency-ids <ids>", "Comma-separated IDs of prerequisite tasks")
  .option("--required-capabilities <caps>", "Comma-separated required skills/tools")
  .action(
    async (
      id: string,
      opts: {
        status?: string;
        priority?: string;
        title?: string;
        description?: string;
        tags?: string;
        definitionOfDone?: string;
        relatedContextIds?: string;
        dependencyIds?: string;
        requiredCapabilities?: string;
      }
    ) => {
      requireToken();
      try {
        const client = new ApiClient();
        const body: Record<string, unknown> = {};
        if (opts.status) body.status = opts.status;
        if (opts.priority) body.priority = opts.priority;
        if (opts.title) body.title = opts.title;
        if (opts.description) body.description = opts.description;
        if (opts.tags !== undefined) {
          body.tags = opts.tags.split(",").map((t) => t.trim()).filter(Boolean);
        }
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

        if (Object.keys(body).length === 0) {
          console.error("No updates provided. Use --status, --priority, --title, --description, --tags, or metadata flags.");
          process.exit(1);
        }

        await client.patch(`/api/tasks/${id}`, body);
        console.log(`Task ${id} updated.`);
      } catch (e) {
        console.error(`Failed to update task: ${(e as Error).message}`);
        process.exit(1);
      }
    }
  );
