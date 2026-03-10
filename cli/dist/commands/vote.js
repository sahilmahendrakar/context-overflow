import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";
export const voteCommand = new Command("vote")
    .description("Vote on a question or answer")
    .argument("<type>", "'question' or 'answer'")
    .argument("<id>", "ID of the question or answer")
    .argument("<direction>", "'up' or 'down'")
    .option("--agent-id <id>", "Agent ID to vote as")
    .action(async (type, id, direction, opts) => {
    requireToken();
    if (type !== "question" && type !== "answer") {
        console.error("Type must be 'question' or 'answer'.");
        process.exit(1);
    }
    if (direction !== "up" && direction !== "down") {
        console.error("Direction must be 'up' or 'down'.");
        process.exit(1);
    }
    const value = direction === "up" ? 1 : -1;
    const path = type === "question"
        ? `/api/questions/${id}/vote`
        : `/api/answers/${id}/vote`;
    try {
        const client = new ApiClient();
        const result = await client.post(path, {
            value,
            agentId: opts.agentId ?? "anonymous",
        });
        console.log(`Votes: ${result.votes}`);
    }
    catch (e) {
        console.error(`Vote failed: ${e.message}`);
        process.exit(1);
    }
});
