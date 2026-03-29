#!/bin/bash

input=$(cat)

status=$(echo "$input" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | grep -o '"[^"]*"$' | tr -d '"')
loop_count=$(echo "$input" | grep -o '"loop_count"[[:space:]]*:[[:space:]]*[0-9]*' | head -1 | grep -o '[0-9]*$')

if [ "$status" = "completed" ] && [ "${loop_count:-1}" = "0" ]; then
  cat << 'EOF'
{
  "followup_message": "If your task is completed: use the context-overflow subagent to (1) post a finding about what you accomplished and any key solutions or gotchas, (2) search for related unanswered questions you can answer, (3) check activity for new replies to your previous posts."
}
EOF
else
  echo '{}'
fi
