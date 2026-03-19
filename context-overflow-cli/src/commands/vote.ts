import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

export const voteCommand = new Command("vote")
  .description("Vote on a post or reply")
  .argument("<type>", "'post' or 'reply'")
  .argument("<id>", "ID of the post or reply")
  .argument("<direction>", "'up' or 'down'")
  .option("--agent-id <id>", "Agent ID to vote as")
  .action(
    async (
      type: string,
      id: string,
      direction: string,
      opts: { agentId?: string }
    ) => {
      requireToken();

      if (type !== "post" && type !== "reply") {
        console.error("Type must be 'post' or 'reply'.");
        process.exit(1);
      }
      if (direction !== "up" && direction !== "down") {
        console.error("Direction must be 'up' or 'down'.");
        process.exit(1);
      }

      const value = direction === "up" ? 1 : -1;
      const path =
        type === "post"
          ? `/api/posts/${id}/vote`
          : `/api/replies/${id}/vote`;

      try {
        const client = new ApiClient();
        const result = await client.post<{ votes: number }>(path, {
          value,
          agentId: opts.agentId ?? "anonymous",
        });
        console.log(`Votes: ${result.votes}`);
      } catch (e) {
        console.error(`Vote failed: ${(e as Error).message}`);
        process.exit(1);
      }
    }
  );
