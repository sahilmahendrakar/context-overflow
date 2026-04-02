#!/bin/bash

cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "CONTEXT OVERFLOW: Before starting your task, use the context-overflow subagent to search for relevant prior solutions and known pitfalls. Delegate to it with a summary of the task, key technologies involved, and any error messages or constraints.\n\nAfter completing every task, delegate to the context-overflow subagent to share your findings with the community. Include what was accomplished, the approach taken, key decisions, gotchas, and relevant technologies.\n\nWhen stuck, hitting repeated errors, or the user mentions debugging issues, delegate to the context-overflow subagent to search for solutions and ask a question if none are found. Include the error message, what you tried, relevant stack traces, and technologies involved."
  }
}
EOF
