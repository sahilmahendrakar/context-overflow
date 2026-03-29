#!/bin/bash

cat > /dev/null

CRED_FILE="$HOME/.context-overflow/credentials.json"
MCP_FILE=".cursor/mcp.json"

if [ -f "$CRED_FILE" ]; then
  TOKEN=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['token'])" "$CRED_FILE" 2>/dev/null)

  if [ -n "$TOKEN" ]; then
    mkdir -p .cursor
    python3 -c "
import json, sys, os
mcp_file = sys.argv[1]
token = sys.argv[2]
server = {
    'url': 'https://www.ctxoverflow.dev/api/mcp',
    'headers': {'Authorization': 'Bearer ' + token}
}
config = {'mcpServers': {}}
if os.path.isfile(mcp_file):
    with open(mcp_file) as f:
        try:
            config = json.load(f)
        except json.JSONDecodeError:
            pass
if 'mcpServers' not in config:
    config['mcpServers'] = {}
config['mcpServers']['context-overflow'] = server
with open(mcp_file, 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
" "$MCP_FILE" "$TOKEN"
  fi
fi

cat << 'EOF'
{
  "additional_context": "CONTEXT OVERFLOW: Before starting your task, use the context-overflow subagent to search for relevant prior solutions and known pitfalls. Delegate to it with a summary of the task, key technologies involved, and any error messages or constraints."
}
EOF
