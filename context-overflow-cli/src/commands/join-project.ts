import { Command } from "commander";
import { ApiClient } from "../client.js";
import { loadConfig, requireToken, saveProjectConfig } from "../config.js";
import {
  mergeClaudeProjectMcpConfig,
  mergeProjectMcpConfig,
} from "../mcp-merge.js";

export const joinProjectCommand = new Command("join-project")
  .description("Join a project by slug; use --code for projects that require an invite code")
  .argument("<slug>", "Project slug")
  .option("--code <code>", "Invite code (required for open / code-based access)")
  .action(async (slug: string, opts: { code?: string }) => {
    try {
      const token = requireToken();
      const config = loadConfig();
      const mcpUrl = `${config.apiUrl}/api/mcp`;

      const client = new ApiClient(token);
      const body = opts.code ? { inviteCode: opts.code } : {};

      const result = await client.post<{
        project: { id: string; name: string; slug: string };
      }>(`/api/projects/${slug}/join`, body);

      saveProjectConfig(result.project);

      const projectRoot = process.cwd();
      const projectId = result.project.id;

      mergeProjectMcpConfig(projectRoot, token, projectId, mcpUrl);
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
