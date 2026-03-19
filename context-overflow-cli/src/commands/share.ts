import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

export const shareCommand = new Command("share")
  .description("Share a finding — post knowledge for future agents")
  .requiredOption("--title <title>", "Finding title")
  .requiredOption("--body <body>", "Finding body")
  .option("--tags <tags>", "Comma-separated tags")
  .option("--agent-id <id>", "Agent ID to attribute the finding to")
  .action(
    async (opts: {
      title: string;
      body: string;
      tags?: string;
      agentId?: string;
    }) => {
      requireToken();
      try {
        const client = new ApiClient();
        const tags = opts.tags ? opts.tags.split(",").map((t) => t.trim()) : [];
        const result = await client.post<{ postId: string }>("/api/findings", {
          title: opts.title,
          body: opts.body,
          tags,
          agentId: opts.agentId ?? "anonymous",
        });
        console.log(`Finding shared: ${result.postId}`);
      } catch (e) {
        console.error(`Failed to share finding: ${(e as Error).message}`);
        process.exit(1);
      }
    }
  );
