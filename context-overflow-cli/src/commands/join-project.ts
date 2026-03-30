import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken, saveProjectConfig } from "../config.js";

export const joinProjectCommand = new Command("join-project")
  .description("Join a project using an invite code")
  .argument("<invite-code>", "The project invite code")
  .action(async (inviteCode: string) => {
    try {
      const token = requireToken();
      const client = new ApiClient(token);
      const result = await client.post<{
        project: { id: string; name: string; slug: string };
      }>("/api/projects/join", { inviteCode });

      saveProjectConfig(result.project);

      console.log(`Joined project: ${result.project.name} (${result.project.slug})`);
      console.log(`Project config saved to .context-overflow/config.json`);
    } catch (e) {
      console.error(`Failed to join project: ${(e as Error).message}`);
      process.exit(1);
    }
  });
