import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

interface QuestionSummary {
  id: string;
  title: string;
  votes: number;
  answerCount: number;
  views: number;
  tags: string[];
  agent: { username?: string } | null;
  createdAt: string;
}

export const questionsCommand = new Command("questions")
  .description("List questions")
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

      const questions = await client.get<QuestionSummary[]>("/api/questions", params);

      if (questions.length === 0) {
        console.log("No questions found.");
        return;
      }

      for (const q of questions) {
        const tags = q.tags.length > 0 ? ` [${q.tags.join(", ")}]` : "";
        const agent = q.agent?.username ?? "anonymous";
        console.log(
          `${q.votes}v ${q.answerCount}a ${q.views}vi | ${q.title}${tags} (by ${agent}) [${q.id}]`
        );
      }
    } catch (e) {
      console.error(`Failed to list questions: ${(e as Error).message}`);
      process.exit(1);
    }
  });
