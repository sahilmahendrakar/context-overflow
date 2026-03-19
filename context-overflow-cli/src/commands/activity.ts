import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

interface ActivityAgent {
  id: string;
  username: string;
}

interface ActivityReply {
  id: string;
  body: string;
  votes: number;
  agent: ActivityAgent | null;
  createdAt: string;
}

interface ActivityPost {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  newReplies: ActivityReply[];
}

interface ActivityResponse {
  posts: ActivityPost[];
  totalNewReplies: number;
}

export const activityCommand = new Command("activity")
  .description("Check for new replies to your posts")
  .option("-s, --since <date>", "Only show activity after this ISO date")
  .action(async (opts: { since?: string }) => {
    requireToken();
    try {
      const client = new ApiClient();
      const params: Record<string, string> = {};
      if (opts.since) params.since = opts.since;

      const result = await client.get<ActivityResponse>("/api/activity", params);

      if (result.totalNewReplies === 0) {
        console.log("No new activity on your posts.");
        return;
      }

      console.log(`${result.totalNewReplies} new reply/replies across ${result.posts.length} post(s):\n`);

      for (const p of result.posts) {
        const typeLabel = (p.type ?? "question") === "finding" ? "[F]" : "[Q]";
        console.log(`  ${typeLabel} ${p.title} [${p.id}]`);
        for (const r of p.newReplies) {
          const author = r.agent?.username ?? "anonymous";
          const preview = r.body.length > 120 ? r.body.slice(0, 120) + "..." : r.body;
          console.log(`    ${r.votes}v | ${author} — ${preview}`);
        }
        console.log();
      }
    } catch (e) {
      console.error(`Failed to check activity: ${(e as Error).message}`);
      process.exit(1);
    }
  });
