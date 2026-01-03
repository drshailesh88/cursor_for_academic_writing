#!/bin/bash
# Ralph Wiggum Stop Hook
# Intercepts session exit to continue iterative loops

set -euo pipefail

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Check if ralph-loop is active
RALPH_STATE_FILE=".claude/ralph-loop.local.md"

if [[ ! -f "$RALPH_STATE_FILE" ]]; then
  # No active loop - allow exit
  exit 0
fi

# Parse YAML frontmatter
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$RALPH_STATE_FILE" 2>/dev/null || echo "")

if [[ -z "$FRONTMATTER" ]]; then
  echo "Warning: Corrupted ralph-loop state file. Allowing exit." >&2
  rm -f "$RALPH_STATE_FILE"
  exit 0
fi

# Extract values from frontmatter
ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//' || echo "1")
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//' || echo "0")
COMPLETION_PROMISE=$(echo "$FRONTMATTER" | grep '^completion_promise:' | sed 's/completion_promise: *//' | sed 's/^"\(.*\)"$/\1/' || echo "")

# Validate numeric fields
if ! [[ "$ITERATION" =~ ^[0-9]+$ ]]; then
  ITERATION=1
fi
if ! [[ "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  MAX_ITERATIONS=0
fi

# Check max iterations limit
if [[ "$MAX_ITERATIONS" -gt 0 ]] && [[ "$ITERATION" -ge "$MAX_ITERATIONS" ]]; then
  echo "Ralph loop reached max iterations ($MAX_ITERATIONS). Exiting." >&2
  rm -f "$RALPH_STATE_FILE"
  exit 0
fi

# Get the transcript file to check for completion promise
TRANSCRIPT_FILE=".claude/transcript.json"
if [[ -f "$TRANSCRIPT_FILE" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
  # Check if completion promise was output
  if grep -q "<promise>$COMPLETION_PROMISE</promise>" "$TRANSCRIPT_FILE" 2>/dev/null; then
    echo "✅ Ralph loop completed! Promise fulfilled: $COMPLETION_PROMISE" >&2
    rm -f "$RALPH_STATE_FILE"
    exit 0
  fi
fi

# Increment iteration
NEW_ITERATION=$((ITERATION + 1))

# Update state file with new iteration count
sed -i "s/^iteration: .*/iteration: ${NEW_ITERATION}/" "$RALPH_STATE_FILE"

# Extract the original task from the state file
TASK=$(sed -n '/^# Ralph Loop Task$/,/^---$/p' "$RALPH_STATE_FILE" | grep -v '^# Ralph Loop Task$' | grep -v '^---$' | head -20)

# Output JSON to block exit and continue loop
cat << EOF
{
  "decision": "block",
  "reason": "Ralph loop iteration ${NEW_ITERATION}",
  "prompt": "🔄 **Ralph Iteration ${NEW_ITERATION}**${MAX_ITERATIONS:+ of ${MAX_ITERATIONS}}\n\nContinue working on your task. Check git log and modified files to see your previous progress.\n\nTask: ${TASK}\n\nTo complete: output <promise>${COMPLETION_PROMISE}</promise> when done.\nTo cancel: /cancel-ralph"
}
EOF
