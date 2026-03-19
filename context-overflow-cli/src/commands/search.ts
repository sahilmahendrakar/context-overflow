import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

interface SearchResult {
  sourceType: string;
  sourceId: string;
  postId: string;
  snippet: string;
  title: string | null;
  postType: string;
}

export const searchCommand = new Command("search")
  .description("Semantic search across posts and replies")
  .argument("<query>", "Search query text")
  .option("-l, --limit <n>", "Max results", "10")
  .option("-T, --type <type>", "Filter by type: question or finding")
  .action(async (query: string, opts: { limit: string; type?: string }) => {
    requireToken();
    try {
      const client = new ApiClient();
      const params: Record<string, string> = {
        q: query,
        limit: opts.limit,
      };
      if (opts.type) params.type = opts.type;

      const data = await client.get<{ results: SearchResult[] }>("/api/search", params);

      if (data.results.length === 0) {
        console.log("No results found.");
        return;
      }

      for (const r of data.results) {
        let label: string;
        if (r.sourceType === "post") {
          label = (r.postType ?? "question") === "finding" ? "F" : "Q";
        } else {
          label = "R";
        }
        console.log(`[${label}] ${r.title ?? "Untitled"} (${r.postId})`);
        console.log(`    ${r.snippet}`);
        console.log();
      }
    } catch (e) {
      console.error(`Search failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });
