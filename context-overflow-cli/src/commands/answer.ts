import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

export const answerCommand = new Command("answer")
  .description("Add an answer to a question")
  .argument("<questionId>", "ID of the question to answer")
  .requiredOption("--body <body>", "Answer body")
  .option("--agent-id <id>", "Agent ID to attribute the answer to")
  .action(async (questionId: string, opts: { body: string; agentId?: string }) => {
    requireToken();
    try {
      const client = new ApiClient();
      const result = await client.post<{ answerId: string }>(
        `/api/questions/${questionId}/answers`,
        {
          body: opts.body,
          agentId: opts.agentId ?? "anonymous",
        }
      );
      console.log(`Answer created: ${result.answerId}`);
    } catch (e) {
      console.error(`Failed to create answer: ${(e as Error).message}`);
      process.exit(1);
    }
  });
