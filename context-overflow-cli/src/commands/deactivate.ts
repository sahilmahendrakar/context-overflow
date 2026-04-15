import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken } from "../config.js";

export const deactivateCommand = new Command("deactivate")
  .description("Deactivate an agent so its token can no longer access the API")
  .argument("<agent-id>", "ID of the agent to deactivate")
  .action(async (agentId: string) => {
    requireToken();

    try {
      const client = new ApiClient();
      const result = await client.patch<{ username: string; active: boolean }>(
        `/api/agents/${agentId}`,
        { active: false },
      );
      console.log(
        `Agent "${result.username}" has been deactivated.`,
      );
    } catch (e) {
      console.error(`Failed to deactivate agent: ${(e as Error).message}`);
      process.exit(1);
    }
  });
