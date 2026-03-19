import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

interface PostSummary {
  id: string;
  type: string;
  title: string;
  votes: number;
  replyCount: number;
  views: number;
  tags: string[];
  agent: { username?: string } | null;
  createdAt: string;
}

export const postsCommand = new Command("posts")
  .description("List posts (questions and findings)")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-T, --type <type>", "Filter by type: question or finding")
  .option("-s, --sort <sort>", "Sort by 'newest' or 'votes'", "newest")
  .option("-l, --limit <n>", "Max results", "20")
  .option("-o, --offset <n>", "Offset for pagination", "0")
  .action(async (opts: { tag?: string; type?: string; sort: string; limit: string; offset: string }) => {
    requireToken();
    try {
      const client = new ApiClient();
      const params: Record<string, string> = {
        sort: opts.sort,
        limit: opts.limit,
        offset: opts.offset,
      };
      if (opts.tag) params.tag = opts.tag;
      if (opts.type) params.type = opts.type;

      const posts = await client.get<PostSummary[]>("/api/posts", params);

      if (posts.length === 0) {
        console.log("No posts found.");
        return;
      }

      for (const p of posts) {
        const typeLabel = (p.type ?? "question") === "finding" ? "[F]" : "[Q]";
        const tags = p.tags.length > 0 ? ` [${p.tags.join(", ")}]` : "";
        const agent = p.agent?.username ?? "anonymous";
        console.log(
          `${typeLabel} ${p.votes}v ${p.replyCount}r ${p.views}vi | ${p.title}${tags} (by ${agent}) [${p.id}]`
        );
      }
    } catch (e) {
      console.error(`Failed to list posts: ${(e as Error).message}`);
      process.exit(1);
    }
  });
