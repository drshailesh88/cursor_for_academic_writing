#!/bin/bash
# Ralph Wiggum Loop Setup Script
# Creates state file for iterative AI development loops

set -euo pipefail

# Default values
MAX_ITERATIONS=0
COMPLETION_PROMISE=""
PROMPT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --completion-promise)
      COMPLETION_PROMISE="$2"
      shift 2
      ;;
    --help|-h)
      cat << 'EOF'
Ralph Wiggum Loop Setup

Usage: setup-ralph-loop.sh "PROMPT" [OPTIONS]

Options:
  --max-iterations N        Maximum iterations (0 = unlimited, default: 0)
  --completion-promise TEXT  Phrase that signals task completion
  --help, -h                Show this help message

Examples:
  setup-ralph-loop.sh "Build a REST API" --completion-promise "DONE" --max-iterations 20
  setup-ralph-loop.sh "Fix all tests" --completion-promise "ALL_TESTS_PASS"

WARNING: Ralph runs infinitely by default. Always set --max-iterations for safety.
EOF
      exit 0
      ;;
    *)
      if [[ -z "$PROMPT" ]]; then
        PROMPT="$1"
      else
        PROMPT="$PROMPT $1"
      fi
      shift
      ;;
  esac
done

# Validate prompt
if [[ -z "$PROMPT" ]]; then
  echo "Error: No prompt provided"
  echo "Usage: setup-ralph-loop.sh \"PROMPT\" [--max-iterations N] [--completion-promise TEXT]"
  exit 1
fi

# Create state directory if needed
mkdir -p .claude

# Create state file
RALPH_STATE_FILE=".claude/ralph-loop.local.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "$RALPH_STATE_FILE" << EOF
---
iteration: 1
max_iterations: ${MAX_ITERATIONS}
completion_promise: "${COMPLETION_PROMISE}"
started_at: "${TIMESTAMP}"
---

# Ralph Loop Task

${PROMPT}

---

## Instructions

You are in a Ralph Wiggum loop. Work on the task above iteratively.

- Read your previous work (files, git log) at each iteration
- Make incremental progress toward the goal
- Run tests to verify your work
- Commit changes frequently

When the task is COMPLETE, output:
\`\`\`
<promise>${COMPLETION_PROMISE}</promise>
\`\`\`

Only output the promise when it is TRUE. Do not exit the loop prematurely.
EOF

echo "🔄 Ralph loop initialized!"
echo "   Task: ${PROMPT:0:50}..."
echo "   Max iterations: ${MAX_ITERATIONS:-unlimited}"
echo "   Completion promise: ${COMPLETION_PROMISE:-none}"
echo ""
echo "The loop will continue until you output <promise>${COMPLETION_PROMISE}</promise>"
echo "To cancel: /cancel-ralph"
