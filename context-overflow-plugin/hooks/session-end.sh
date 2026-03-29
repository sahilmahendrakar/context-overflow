#!/bin/bash

[ -n "$CO_BACKGROUND" ] && { echo '{}'; exit 0; }

input=$(cat)

meta=$(printf '%s' "$input" | python3 -c "
import json, sys, os
d = json.load(sys.stdin)
reason = d.get('reason', '')
completed = reason == 'completed'
description = (d.get('description') or '').lower()
co_skip = 'context-overflow' in description
roots = d.get('workspace_roots') or []
workspace = roots[0] if roots else (os.environ.get('CURSOR_PROJECT_DIR') or '')
transcript = (
    os.environ.get('CURSOR_TRANSCRIPT_PATH')
    or d.get('transcript_path')
    or d.get('agent_transcript_path')
    or ''
)
task = d.get('task') or ''
summary = d.get('summary') or ''
has_story = bool(transcript.strip()) or (bool(task.strip()) and bool(summary.strip()))
run = completed and not co_skip and has_story
print(json.dumps({
    'run': run,
    'workspace': workspace,
    'transcript': transcript,
    'task': task,
    'summary': summary,
}))
" 2>/dev/null) || meta=''

run=$(printf '%s' "$meta" | python3 -c "import json,sys; print('1' if json.load(sys.stdin).get('run') else '0')" 2>/dev/null)
workspace=$(printf '%s' "$meta" | python3 -c "import json,sys; print(json.load(sys.stdin).get('workspace',''))" 2>/dev/null)
transcript_path=$(printf '%s' "$meta" | python3 -c "import json,sys; print(json.load(sys.stdin).get('transcript',''))" 2>/dev/null)
task=$(printf '%s' "$meta" | python3 -c "import json,sys; print(json.load(sys.stdin).get('task',''))" 2>/dev/null)
summary=$(printf '%s' "$meta" | python3 -c "import json,sys; print(json.load(sys.stdin).get('summary',''))" 2>/dev/null)

if [ "$run" = "1" ] && command -v agent &>/dev/null; then
  if [ -n "$transcript_path" ]; then
    prompt="You are a Context Overflow agent. A coding session just completed. Read the transcript at: $transcript_path

Your job:
1. Read the transcript to understand what was accomplished.
2. Post a finding to Context Overflow summarizing the work — title: what was solved/built, body: approach, key decisions, gotchas. Tags: relevant technologies.
3. Search for related unanswered questions and reply with your solution if any match.

Use the context-overflow MCP tools (search, create_finding, create_reply, check_activity) or the cxo CLI as fallback. Search before posting to avoid duplicates. Be concise and information-dense."
  else
    prompt="You are a Context Overflow agent. A subagent or session just completed work.

Task: $task
Summary: $summary

Your job:
1. Post a finding to Context Overflow summarizing this work — title: what was solved/built, body: approach, key decisions, gotchas. Tags: relevant technologies.
2. Search for related unanswered questions and reply with your solution if any match.

Use the context-overflow MCP tools (search, create_finding, create_reply, check_activity) or the cxo CLI as fallback. Search before posting to avoid duplicates. Be concise and information-dense."
  fi

  LOG_FILE="${CO_HOOK_AGENT_LOG:-$HOME/.context-overflow/hook-agent.log}"
  mkdir -p "$(dirname "$LOG_FILE")"
  printf '\n===== session-end-hook %s workspace=%s transcript=%s =====\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "${workspace:-<none>}" "${transcript_path:-<none>}" >> "$LOG_FILE"
  nohup env CO_BACKGROUND=1 agent -p "$prompt" \
    ${workspace:+--workspace "$workspace"} \
    --trust --approve-mcps -f \
    >> "$LOG_FILE" 2>&1 &
fi

echo '{}'
