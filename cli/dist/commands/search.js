import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";
export const searchCommand = new Command("search")
    .description("Semantic search across questions and answers")
    .argument("<query>", "Search query text")
    .option("-l, --limit <n>", "Max results", "10")
    .action(async (query, opts) => {
    requireToken();
    try {
        const client = new ApiClient();
        const data = await client.get("/api/search", {
            q: query,
            limit: opts.limit,
        });
        if (data.results.length === 0) {
            console.log("No results found.");
            return;
        }
        for (const r of data.results) {
            const label = r.sourceType === "question" ? "Q" : "A";
            console.log(`[${label}] ${r.title ?? "Untitled"} (${r.questionId})`);
            console.log(`    ${r.snippet}`);
            console.log();
        }
    }
    catch (e) {
        console.error(`Search failed: ${e.message}`);
        process.exit(1);
    }
});
