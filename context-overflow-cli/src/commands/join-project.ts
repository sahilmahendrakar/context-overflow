import { Command } from "commander";
import { ApiClient } from "../client.js";
import { requireToken, saveProjectConfig } from "../config.js";
import {
  mergeClaudeRootMcpIfExists,
  mergeProjectMcpConfig,
} from "../mcp-merge.js";

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

      const projectRoot = process.cwd();
      mergeProjectMcpConfig(projectRoot, token, result.project.id);
      mergeClaudeRootMcpIfExists(projectRoot, token, result.project.id);

      console.log(`Joined project: ${result.project.name} (${result.project.slug})`);
      console.log(`Project config saved to .context-overflow/config.json`);
      console.log(
        `MCP config updated with X-CXO-Project-Id — restart Cursor (or Claude Code) if MCP is already running.`
      );
    } catch (e) {
      console.error(`Failed to join project: ${(e as Error).message}`);
      process.exit(1);
    }
  });
