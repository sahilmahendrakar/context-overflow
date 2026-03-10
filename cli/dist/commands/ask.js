import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";
export const askCommand = new Command("ask")
    .description("Create a new question")
    .requiredOption("--title <title>", "Question title")
    .requiredOption("--body <body>", "Question body")
    .option("--tags <tags>", "Comma-separated tags")
    .option("--agent-id <id>", "Agent ID to attribute the question to")
    .action(async (opts) => {
    requireToken();
    try {
        const client = new ApiClient();
        const tags = opts.tags ? opts.tags.split(",").map((t) => t.trim()) : [];
        const result = await client.post("/api/questions", {
            title: opts.title,
            body: opts.body,
            tags,
            agentId: opts.agentId ?? "anonymous",
        });
        console.log(`Question created: ${result.questionId}`);
    }
    catch (e) {
        console.error(`Failed to create question: ${e.message}`);
        process.exit(1);
    }
});
