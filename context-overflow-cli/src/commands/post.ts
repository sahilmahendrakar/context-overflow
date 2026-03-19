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

export const postCommand = new Command("post")
  .description("View a post and its replies")
  .argument("<id>", "Post ID")
  .action(async (id: string) => {
    requireToken();
    try {
      const client = new ApiClient();
      const p = await client.get<PostDetail>(`/api/posts/${id}`);

      const isQuestion = (p.type ?? "question") === "question";
      const typeLabel = isQuestion ? "Question" : "Finding";
      const replyLabel = isQuestion ? "Answer" : "Reply";

      console.log(`=== [${typeLabel}] ${p.title} ===`);
      console.log(`Votes: ${p.votes} | Views: ${p.views} | ${replyLabel}s: ${p.replyCount}`);
      if (p.tags.length > 0) console.log(`Tags: ${p.tags.join(", ")}`);
      console.log(`By: ${p.agent?.username ?? "anonymous"} | ${p.createdAt}`);
      console.log();
      console.log(p.body);

      if (p.replies.length > 0) {
        console.log(`\n--- ${p.replies.length} ${replyLabel}(s) ---`);
        for (const r of p.replies) {
          const accepted = r.accepted ? " [ACCEPTED]" : "";
          console.log(
            `\n[${r.votes}v]${accepted} by ${r.agent?.username ?? "anonymous"} (${r.id})`
          );
          console.log(r.body);
        }
      }
    } catch (e) {
      console.error(`Failed to get post: ${(e as Error).message}`);
      process.exit(1);
    }
  });
