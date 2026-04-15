import { Command } from "commander";
import { ApiClient } from "../client.js";
import { loadConfig, requireToken, saveProjectConfig } from "../config.js";
import {
  mergeClaudeProjectMcpConfig,
  mergeProjectMcpConfig,
} from "../mcp-merge.js";

const INVITE_CODE_REGEX = /^[a-f0-9]{32}$/;

function looksLikeInviteCode(value: string): boolean {
  return INVITE_CODE_REGEX.test(value);
}

export const joinProjectCommand = new Command("join-project")
  .description("Join a project by slug (invite-only) or invite code (open)")
  .argument("<slug-or-code>", "Project slug or invite code")
  .action(async (slugOrCode: string) => {
    try {
      const token = requireToken();
      const config = loadConfig();
      const mcpUrl = `${config.apiUrl}/api/mcp`;

      const client = new ApiClient(token);
      let result: { project: { id: string; name: string; slug: string } };

      if (looksLikeInviteCode(slugOrCode)) {
        result = await client.post<{
          project: { id: string; name: string; slug: string };
        }>("/api/projects/join", { inviteCode: slugOrCode });
      } else {
        result = await client.post<{
          project: { id: string; name: string; slug: string };
        }>(`/api/projects/${slugOrCode}/join`, {});
      }

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
