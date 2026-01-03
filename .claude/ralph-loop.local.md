---
iteration: 1
max_iterations: 40
completion_promise: "AGENTS_COMPLETE"
started_at: "2026-01-03T08:03:53Z"
---

# Ralph Loop Task


## Task: Build the Deep Research Multi-Agent System

You are implementing the core agent system for Deep Research based on specs/001-deep-research/spec.md.

### Requirements

Implement these 9 agents in lib/deep-research/agents/:

1. **OrchestratorAgent** (orchestrator-agent.ts) - Coordinates all other agents, manages session state, routes tasks, handles error recovery

2. **ClarifierAgent** (clarifier-agent.ts) - Analyzes initial research topic, generates 3-5 clarifying questions, refines topic based on answers

3. **PerspectiveAnalystAgent** (perspective-analyst-agent.ts) - Creates 3-7 expert perspectives (STORM-inspired), each with role, focus areas, and questions

4. **SearchStrategistAgent** (search-strategist-agent.ts) - Creates search strategies for each database, generates keyword variations and boolean queries

5. **ResearcherAgent** (researcher-agent.ts) - Executes searches across databases, analyzes papers for relevance, extracts key findings

6. **CitationAnalystAgent** (citation-analyst-agent.ts) - Classifies citations (supporting/disputing/mentioning), builds citation graph, identifies consensus

7. **SynthesizerAgent** (synthesizer-agent.ts) - Combines findings into coherent narrative, ensures balanced evidence representation

8. **QualityReviewerAgent** (quality-reviewer-agent.ts) - Reviews synthesis for accuracy, checks citation coverage, identifies gaps

9. **WriterAgent** (writer-agent.ts) - Generates final research report, formats with proper citations, creates executive summary

### Technical Requirements
- All agents extend BaseAgent from base-agent.ts
- Use @RegisterAgent decorator for registry
- Each agent has execute(context) method returning AgentResult
- Implement proper TypeScript types from types/index.ts
- Add JSDoc comments for all public methods

### Testing Requirements
Write tests in tests/deep-research/agents/:
- Test each agent's execute method
- Test agent registration in registry
- Test error handling
- Achieve 80%+ coverage for agent files

### Verification
Run these commands and ensure they pass:
- npm run type-check (no TypeScript errors)
- npm run test:run (all tests pass)

When ALL 9 agents are implemented with passing tests, output:
<promise>AGENTS_COMPLETE</promise>


---

## Instructions

You are in a Ralph Wiggum loop. Work on the task above iteratively.

- Read your previous work (files, git log) at each iteration
- Make incremental progress toward the goal
- Run tests to verify your work
- Commit changes frequently

When the task is COMPLETE, output:
```
<promise>AGENTS_COMPLETE</promise>
```

Only output the promise when it is TRUE. Do not exit the loop prematurely.
