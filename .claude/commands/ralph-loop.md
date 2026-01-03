---
description: Start Ralph Wiggum loop - iterative AI development with continuous feedback
arguments: PROMPT [--max-iterations N] [--completion-promise TEXT]
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Ralph Loop Command

You are about to enter a Ralph Wiggum loop - an iterative development methodology where you work on a task repeatedly until completion.

## Setup

Execute the setup script to initialize the loop:

```bash
${CLAUDE_PLUGIN_ROOT}/../scripts/setup-ralph-loop.sh $ARGUMENTS
```

If the script doesn't exist, create the state file manually based on the arguments.

## How Ralph Works

1. **Same prompt, evolving context**: Your prompt stays constant, but files and git history change
2. **Self-referential improvement**: You can read your previous work and improve it
3. **Blocked exits**: The stop hook prevents premature exit until completion
4. **Iteration tracking**: Each loop increments the counter

## Critical Rules

When a completion promise is set, you may ONLY output it when the statement is **completely and unequivocally TRUE**.

The promise format is:
```
<promise>YOUR_COMPLETION_STATEMENT</promise>
```

**DO NOT** output false promises to escape the loop, even if you think you're stuck. Trust the process - iteration leads to completion.

## Best Practices

1. **Read previous work first**: Check git log and modified files at each iteration
2. **Run tests frequently**: Use test output to guide improvements
3. **Commit often**: Small commits help track progress
4. **Be systematic**: Work through requirements methodically
5. **Document blockers**: If truly stuck, document why clearly

## Current Task

Execute the setup and begin working on the task specified in your arguments.
