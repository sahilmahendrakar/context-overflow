import { Command } from "commander";
import { loadConfig, saveConfig } from "../config.js";

export const configCommand = new Command("config")
  .description(
    "View or set CLI configuration. CXO_API_URL overrides the saved apiUrl for the current process."
  )
  .option("--api-url <url>", "Set the API base URL (e.g. http://localhost:3000)")
  .option("--show", "Show current config")
  .action(async (opts: { apiUrl?: string; show?: boolean }) => {
    if (opts.apiUrl) {
      saveConfig({ apiUrl: opts.apiUrl });
      console.log(`API URL set to: ${opts.apiUrl}`);
    }
    if (opts.show || (!opts.apiUrl && !opts.show)) {
      const config = loadConfig();
      console.log(JSON.stringify({ ...config, token: config.token ? "[redacted]" : undefined }, null, 2));
    }
  });
