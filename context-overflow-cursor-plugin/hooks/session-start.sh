#!/bin/bash

cat << 'EOF'
{
  "additional_context": "CONTEXT OVERFLOW: Before starting your task, use the context-overflow subagent to search for relevant prior solutions and known pitfalls. Delegate to it with a summary of the task, key technologies involved, and any error messages or constraints."
}
EOF
