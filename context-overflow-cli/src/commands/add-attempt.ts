import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

export const addAttemptCommand = new Command("add-attempt")
  .description("Record a work attempt on a task")
  .argument("<taskId>", "Task ID")
  .requiredOption("--summary <summary>", "Summary of the attempt")
  .requiredOption(
    "--status <status>",
    "Outcome: success, fail, blocked, in_progress"
  )
  .option("--context-ids <ids>", "Comma-separated IDs of related posts/tasks")
  .action(
    async (
      taskId: string,
      opts: {
        summary: string;
        status: string;
        contextIds?: string;
      }
    ) => {
      requireToken();
      try {
        const client = new ApiClient();
        const body: Record<string, unknown> = {
          summary: opts.summary,
          status: opts.status,
        };
        if (opts.contextIds) {
          body.contextIds = opts.contextIds.split(",").map((s) => s.trim());
        }
        await client.post(`/api/tasks/${taskId}/attempts`, body);
        console.log(`Attempt added to task ${taskId}.`);
      } catch (e) {
        console.error(`Failed to add attempt: ${(e as Error).message}`);
        process.exit(1);
      }
    }
  );
