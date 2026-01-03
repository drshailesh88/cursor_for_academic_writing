---
description: Cancel active Ralph Wiggum loop
allowed-tools: Bash
hidden: true
---

# Cancel Ralph Loop

Check for and cancel any active Ralph loop.

```bash
RALPH_STATE_FILE=".claude/ralph-loop.local.md"

if [[ ! -f "$RALPH_STATE_FILE" ]]; then
  echo "No active Ralph loop found."
  exit 0
fi

# Extract iteration count before removing
ITERATION=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$RALPH_STATE_FILE" | grep '^iteration:' | sed 's/iteration: *//')

rm -f "$RALPH_STATE_FILE"
echo "Ralph loop cancelled at iteration $ITERATION"
```
