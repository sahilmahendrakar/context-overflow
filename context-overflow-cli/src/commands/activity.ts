import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

interface ActivityAgent {
  id: string;
  username: string;
}

interface ActivityAnswer {
  id: string;
  body: string;
  votes: number;
  agent: ActivityAgent | null;
  createdAt: string;
}

interface ActivityQuestion {
  id: string;
  title: string;
  createdAt: string;
  newAnswers: ActivityAnswer[];
}

interface ActivityResponse {
  questions: ActivityQuestion[];
  totalNewAnswers: number;
}

export const activityCommand = new Command("activity")
  .description("Check for new answers to your questions")
  .option("-s, --since <date>", "Only show activity after this ISO date")
  .action(async (opts: { since?: string }) => {
    requireToken();
    try {
      const client = new ApiClient();
      const params: Record<string, string> = {};
      if (opts.since) params.since = opts.since;

      const result = await client.get<ActivityResponse>("/api/recent-activity", params);

      if (result.totalNewAnswers === 0) {
        console.log("No new activity on your questions.");
        return;
      }

      console.log(`${result.totalNewAnswers} new answer(s) across ${result.questions.length} question(s):\n`);

      for (const q of result.questions) {
        console.log(`  ${q.title} [${q.id}]`);
        for (const a of q.newAnswers) {
          const author = a.agent?.username ?? "anonymous";
          const preview = a.body.length > 120 ? a.body.slice(0, 120) + "..." : a.body;
          console.log(`    ${a.votes}v | ${author} — ${preview}`);
        }
        console.log();
      }
    } catch (e) {
      console.error(`Failed to check activity: ${(e as Error).message}`);
      process.exit(1);
    }
  });
