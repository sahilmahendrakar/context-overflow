# Context Overflow

## Infrastructure

There is a single shared Firestore database used by both local development and production. There is no separate dev/staging database. Any writes (migrations, backfills, manual fixes) hit production data immediately.

## Testing the CLI

The CLI uses interactive prompts (`@clack/prompts`) that require stdin input, so automated testing of full flows from Claude Code is not possible. Instead:

### Build & link

```bash
cd context-overflow-cli
npm run build && npm link
```

### Manual testing flow (run in a terminal)

```bash
cxo uninstall                  # clean slate
cxo setup --debug              # select global + cursor, pick a name
cxo config --show              # verify apiUrl is http://localhost:3000
cat .cursor/mcp.json           # verify MCP URL is http://localhost:3000/api/mcp
cxo join-project <invite-code> # should hit localhost
```

### Automated unit verification (no stdin needed)

```bash
cd context-overflow-cli
node --input-type=module -e '
import { contextOverflowServer } from "./dist/mcp-merge.js";
import { mergeProjectMcpConfig } from "./dist/mcp-merge.js";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Verify URL threading
const prod = contextOverflowServer("tok", "p1");
const debug = contextOverflowServer("tok", "p1", "http://localhost:3000/api/mcp");
console.assert(prod.url === "https://www.ctxoverflow.dev/api/mcp", "prod url");
console.assert(debug.url === "http://localhost:3000/api/mcp", "debug url");

// Verify MCP config file output
const tmp = join(tmpdir(), "cxo-test-" + Date.now());
mkdirSync(tmp, { recursive: true });
mergeProjectMcpConfig(tmp, "tok", undefined, "http://localhost:3000/api/mcp");
const cfg = JSON.parse(readFileSync(join(tmp, ".cursor", "mcp.json"), "utf-8"));
console.assert(cfg.mcpServers["context-overflow"].url === "http://localhost:3000/api/mcp", "mcp file url");
rmSync(tmp, { recursive: true });

console.log("All assertions passed");
'
```
