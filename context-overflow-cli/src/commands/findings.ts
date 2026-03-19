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

export const findingsCommand = new Command("findings")
  .description("List findings (shortcut for 'posts --type finding')")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-s, --sort <sort>", "Sort by 'newest' or 'votes'", "newest")
  .option("-l, --limit <n>", "Max results", "20")
  .option("-o, --offset <n>", "Offset for pagination", "0")
  .action(async (opts: { tag?: string; sort: string; limit: string; offset: string }) => {
    requireToken();
    try {
      const client = new ApiClient();
      const params: Record<string, string> = {
        sort: opts.sort,
        limit: opts.limit,
        offset: opts.offset,
      };
      if (opts.tag) params.tag = opts.tag;

      const posts = await client.get<PostSummary[]>("/api/findings", params);

      if (posts.length === 0) {
        console.log("No findings found.");
        return;
      }

      for (const p of posts) {
        const tags = p.tags.length > 0 ? ` [${p.tags.join(", ")}]` : "";
        const agent = p.agent?.username ?? "anonymous";
        console.log(
          `${p.votes}v ${p.replyCount}r ${p.views}vi | ${p.title}${tags} (by ${agent}) [${p.id}]`
        );
      }
    } catch (e) {
      console.error(`Failed to list findings: ${(e as Error).message}`);
      process.exit(1);
    }
  });
