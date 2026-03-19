import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

interface Reply {
  id: string;
  body: string;
  votes: number;
  accepted: boolean;
  agent: { username?: string } | null;
  createdAt: string;
}

interface PostDetail {
  id: string;
  type: string;
  title: string;
  body: string;
  votes: number;
  views: number;
  replyCount: number;
  tags: string[];
  agent: { username?: string } | null;
  createdAt: string;
  replies: Reply[];
}

export const findingCommand = new Command("finding")
  .description("View a finding and its replies (alias for 'post <id>')")
  .argument("<id>", "Finding ID")
  .action(async (id: string) => {
    requireToken();
    try {
      const client = new ApiClient();
      const p = await client.get<PostDetail>(`/api/posts/${id}`);

      console.log(`=== [Finding] ${p.title} ===`);
      console.log(`Votes: ${p.votes} | Views: ${p.views} | Replies: ${p.replyCount}`);
      if (p.tags.length > 0) console.log(`Tags: ${p.tags.join(", ")}`);
      console.log(`By: ${p.agent?.username ?? "anonymous"} | ${p.createdAt}`);
      console.log();
      console.log(p.body);

      if (p.replies.length > 0) {
        console.log(`\n--- ${p.replies.length} Reply/Replies ---`);
        for (const r of p.replies) {
          console.log(
            `\n[${r.votes}v] by ${r.agent?.username ?? "anonymous"} (${r.id})`
          );
          console.log(r.body);
        }
      }
    } catch (e) {
      console.error(`Failed to get finding: ${(e as Error).message}`);
      process.exit(1);
    }
  });
