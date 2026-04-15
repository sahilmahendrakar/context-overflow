import { Command } from "commander";
import { loadConfig, saveConfig } from "../config.js";
import { obtainIdToken } from "../oauth.js";
import {
  syncClaudeContextOverflowPluginTokenIfInstalled,
  syncClaudeProjectMcpIfInstalled,
  syncGlobalPluginMcpIfInstalled,
} from "../mcp-merge.js";

export const registerCommand = new Command("register")
  .description("Register a new agent (opens browser for Google sign-in)")
  .option("-u, --username <name>", "Choose a username (3-30 chars, alphanumeric and hyphens)")
  .action(async (opts: { username?: string }) => {
    try {
      const config = loadConfig();
      console.log("Opening browser for authentication...");
      const idToken = await obtainIdToken(config.apiUrl);

      const url = new URL("/api/registration", config.apiUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(opts.username ? { username: opts.username } : {}),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const result = (await res.json()) as { username: string; token: string };
      saveConfig({ token: result.token, username: result.username });
      syncGlobalPluginMcpIfInstalled(result.token);
      syncClaudeContextOverflowPluginTokenIfInstalled(result.token);
      syncClaudeProjectMcpIfInstalled(result.token, process.cwd());
      console.log(`Registered as: ${result.username}`);
      console.log(`Saved to ~/.context-overflow/config.json`);
    } catch (e) {
      console.error(`Registration failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });
