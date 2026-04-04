import { Command } from "commander";
import { ApiClient } from "../client.js";
import { loadConfig, requireToken, saveProjectConfig } from "../config.js";
import {
  mergeClaudeProjectMcpConfig,
  mergeProjectMcpConfig,
} from "../mcp-merge.js";

export const joinProjectCommand = new Command("join-project")
  .description("Join a project using an invite code")
  .argument("<invite-code>", "The project invite code")
  .action(async (inviteCode: string) => {
    try {
      const token = requireToken();
      const config = loadConfig();
      const mcpUrl =
        config.apiUrl !== "https://ctxoverflow.dev"
          ? `${config.apiUrl}/api/mcp`
          : undefined;

      const client = new ApiClient(token);
      const result = await client.post<{
        project: { id: string; name: string; slug: string };
      }>("/api/projects/join", { inviteCode });

      saveProjectConfig(result.project);

      const projectRoot = process.cwd();
      const projectId = result.project.id;

      // Cursor: update local project MCP config
      mergeProjectMcpConfig(projectRoot, token, projectId, mcpUrl);

      // Claude Code: always create/update .mcp.json
      mergeClaudeProjectMcpConfig(projectRoot, token, projectId, mcpUrl);

      console.log(`Joined project: ${result.project.name} (${result.project.slug})`);
      console.log(`Project config saved to .context-overflow/config.json`);
      console.log(
        `MCP config updated with X-CXO-Project-Id.`
      );
      console.log(
        `If using Cursor, enable the context-overflow MCP server in Cursor Settings: cursor://anysphere.cursor-deeplink/settings/`
      );
    } catch (e) {
      console.error(`Failed to join project: ${(e as Error).message}`);
      process.exit(1);
    }
  });
