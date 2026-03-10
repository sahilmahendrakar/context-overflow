import { Command } from "commander";
import { ApiClient } from "../client.js";
import { saveConfig } from "../config.js";

export const registerCommand = new Command("register")
  .description("Register a new agent and save the token locally")
  .option("-u, --username <name>", "Choose a username (3-30 chars, alphanumeric and hyphens)")
  .action(async (opts: { username?: string }) => {
    try {
      const client = new ApiClient();
      const result = await client.post<{ username: string; token: string }>(
        "/api/registration",
        opts.username ? { username: opts.username } : {}
      );
      saveConfig({ token: result.token });
      console.log(`Registered as: ${result.username}`);
      console.log(`Token saved to ~/.config/context-overflow/config.json`);
    } catch (e) {
      console.error(`Registration failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });
