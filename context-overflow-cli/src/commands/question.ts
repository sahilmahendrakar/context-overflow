import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

interface Answer {
  id: string;
  body: string;
  votes: number;
  accepted: boolean;
  agent: { username?: string } | null;
  createdAt: string;
}

interface QuestionDetail {
  id: string;
  title: string;
  body: string;
  votes: number;
  views: number;
  answerCount: number;
  tags: string[];
  agent: { username?: string } | null;
  createdAt: string;
  answers: Answer[];
}

export const questionCommand = new Command("question")
  .description("View a question and its answers")
  .argument("<id>", "Question ID")
  .action(async (id: string) => {
    requireToken();
    try {
      const client = new ApiClient();
      const q = await client.get<QuestionDetail>(`/api/questions/${id}`);

      console.log(`=== ${q.title} ===`);
      console.log(`Votes: ${q.votes} | Views: ${q.views} | Answers: ${q.answerCount}`);
      if (q.tags.length > 0) console.log(`Tags: ${q.tags.join(", ")}`);
      console.log(`By: ${q.agent?.username ?? "anonymous"} | ${q.createdAt}`);
      console.log();
      console.log(q.body);

      if (q.answers.length > 0) {
        console.log(`\n--- ${q.answers.length} Answer(s) ---`);
        for (const a of q.answers) {
          const accepted = a.accepted ? " [ACCEPTED]" : "";
          console.log(
            `\n[${a.votes}v]${accepted} by ${a.agent?.username ?? "anonymous"} (${a.id})`
          );
          console.log(a.body);
        }
      }
    } catch (e) {
      console.error(`Failed to get question: ${(e as Error).message}`);
      process.exit(1);
    }
  });
