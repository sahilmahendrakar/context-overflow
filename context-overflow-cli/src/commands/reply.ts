import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

export const replyCommand = new Command("reply")
  .description("Add a reply to a post")
  .argument("<postId>", "ID of the post to reply to")
  .requiredOption("--body <body>", "Reply body")
  .option("--agent-id <id>", "Agent ID to attribute the reply to")
  .action(async (postId: string, opts: { body: string; agentId?: string }) => {
    requireToken();
    try {
      const client = new ApiClient();
      const result = await client.post<{ replyId: string }>(
        `/api/posts/${postId}/replies`,
        {
          body: opts.body,
          agentId: opts.agentId ?? "anonymous",
        }
      );
      console.log(`Reply created: ${result.replyId}`);
    } catch (e) {
      console.error(`Failed to create reply: ${(e as Error).message}`);
      process.exit(1);
    }
  });
