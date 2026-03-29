#!/bin/bash

DEBUG_LOG="${CO_HOOK_SESSION_END_DEBUG:-$HOME/.context-overflow/session-end-hook.log}"
mkdir -p "$(dirname "$DEBUG_LOG")"

log_debug() {
  printf '%s\n' "$*" >> "$DEBUG_LOG"
}

if [ -n "$CO_BACKGROUND" ]; then
  log_debug "===== $(date -u +"%Y-%m-%dT%H:%M:%SZ") early_exit: CO_BACKGROUND is set ====="
  echo '{}'
  exit 0
fi

input=$(cat)
parse_err=$(mktemp)
trap 'rm -f "$parse_err"' EXIT

meta=$(printf '%s' "$input" | python3 -c "
import json, sys, os
d = json.load(sys.stdin)
reason = d.get('reason', '')
allowed_reasons = frozenset(('completed', 'window_close', 'user_close'))
reason_allowed = reason in allowed_reasons
description = (d.get('description') or '').lower()
co_skip = 'context-overflow' in description
roots = d.get('workspace_roots') or []
workspace = roots[0] if roots else (os.environ.get('CURSOR_PROJECT_DIR') or '')
env_tp = os.environ.get('CURSOR_TRANSCRIPT_PATH') or ''
tp = d.get('transcript_path') or ''
atp = d.get('agent_transcript_path') or ''
transcript = env_tp or tp or atp
if env_tp:
    transcript_source = 'env:CURSOR_TRANSCRIPT_PATH'
elif tp:
    transcript_source = 'payload:transcript_path'
elif atp:
    transcript_source = 'payload:agent_transcript_path'
else:
    transcript_source = 'none'
task = d.get('task') or ''
summary = d.get('summary') or ''
has_story = bool(transcript.strip()) or (bool(task.strip()) and bool(summary.strip()))
run = reason_allowed and not co_skip and has_story
print(json.dumps({
    'run': run,
    'workspace': workspace,
    'transcript': transcript,
    'task': task,
    'summary': summary,
    'debug': {
        'reason': reason,
        'reason_allowed': reason_allowed,
        'co_skip': co_skip,
        'has_story': has_story,
        'transcript_nonempty': bool(transcript.strip()),
        'task_nonempty': bool(task.strip()),
        'summary_nonempty': bool(summary.strip()),
        'transcript_source': transcript_source,
        'workspace_roots_count': len(roots),
    },
}))
" 2>"$parse_err") || true

ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
log_debug "===== session-end-hook $ts ====="
if [ -z "$meta" ]; then
  log_debug "python_parse_failed stderr:"
  cat "$parse_err" >> "$DEBUG_LOG"
else
  printf '%s' "$meta" | python3 -m json.tool >> "$DEBUG_LOG" 2>/dev/null || printf '%s\n' "$meta" >> "$DEBUG_LOG"
fi

if command -v agent &>/dev/null; then
  log_debug "agent_in_path: $(command -v agent)"
else
  log_debug "agent_in_path: (not found)"
fi

run=$(printf '%s' "$meta" | python3 -c "import json,sys; print('1' if json.load(sys.stdin).get('run') else '0')" 2>/dev/null)
[ -z "$run" ] && run=0
workspace=$(printf '%s' "$meta" | python3 -c "import json,sys; print(json.load(sys.stdin).get('workspace',''))" 2>/dev/null)
transcript_path=$(printf '%s' "$meta" | python3 -c "import json,sys; print(json.load(sys.stdin).get('transcript',''))" 2>/dev/null)
task=$(printf '%s' "$meta" | python3 -c "import json,sys; print(json.load(sys.stdin).get('task',''))" 2>/dev/null)
summary=$(printf '%s' "$meta" | python3 -c "import json,sys; print(json.load(sys.stdin).get('summary',''))" 2>/dev/null)

if [ "$run" = "1" ] && command -v agent &>/dev/null; then
  log_debug "launch_agent: yes"
else
  log_debug "launch_agent: no (need run=1 and agent in PATH)"
fi

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
