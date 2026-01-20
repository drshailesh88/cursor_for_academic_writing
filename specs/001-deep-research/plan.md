# Implementation Plan: Deep Research Agent (Best-in-Class)

**Branch**: `001-deep-research` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Enhanced specification combining features from GPT Researcher, STORM, dzhng/deep-research, LangChain Open DR, and Local Deep Research

## Summary

Build a best-in-class deep research agent with:
- **Multi-agent architecture** (Orchestrator, Clarifier, Planner, Researchers, Reviewer, Synthesizer, Writer)
- **Tree-like exploration** with configurable depth and breadth
- **Multi-perspective research** (STORM-inspired)
- **Iterative refinement** with learning accumulation (dzhng-inspired)
- **Multi-source academic search** (PubMed, arXiv, Semantic Scholar)
- **Review-revision quality cycles**
- **Multiple research modes** (Quick, Standard, Deep, Exhaustive)

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**: Vercel AI SDK, existing PubMed client, new arXiv/S2 clients
**Storage**: Supabase Postgres (research sessions, branches, iterations)
**Testing**: Manual testing with academic research queries
**Target Platform**: Web application (Next.js)
**Project Type**: Web application - extend existing three-panel layout
**Performance Goals**: Quick mode < 2 min, Deep mode < 10 min, 20+ sources
**Constraints**: API rate limits, context window management, parallel execution
**Scale/Scope**: Complex multi-agent system with visual progress tracking

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Academic Excellence First | PASS | Multi-perspective ensures comprehensive, balanced coverage |
| Citation Integrity | PASS | All sources properly cited with author-year format |
| Multi-LLM Flexibility | PASS | Model selector for all agents |
| Supabase-First Architecture | PASS | Full session persistence with branches/iterations |
| Simplicity Over Complexity | ADJUSTED | Complexity justified by best-in-class goal |

## Complexity Justification

| Feature | Why Needed | Simpler Alternative Rejected Because |
|---------|------------|-------------------------------------|
| Multi-agent architecture | Specialized agents produce better quality | Single agent can't match GPT Researcher quality |
| Tree exploration | Comprehensive coverage of complex topics | Linear search misses important sub-topics |
| Multi-perspective | STORM shows 25% better organization | Single viewpoint creates blind spots |
| Multi-source | Papers exist in different databases | PubMed-only misses CS/ML papers |

---

## Project Structure

### Source Code Layout

```text
lib/
├── research/
│   ├── agents/                      # Multi-agent system
│   │   ├── orchestrator.ts          # Supervisor agent
│   │   ├── clarifier.ts             # Follow-up questions
│   │   ├── planner.ts               # Tree generation
│   │   ├── researcher.ts            # Search executor
│   │   ├── reviewer.ts              # Quality checker
│   │   ├── synthesizer.ts           # Findings merger
│   │   └── writer.ts                # Report generator
│   │
│   ├── sources/                     # Academic database clients
│   │   ├── pubmed.ts                # Existing (extend)
│   │   ├── arxiv.ts                 # NEW: arXiv API
│   │   ├── semantic-scholar.ts      # NEW: S2 API
│   │   └── deduplicator.ts          # Cross-source dedup
│   │
│   ├── tree/                        # Tree exploration
│   │   ├── tree-builder.ts          # Generate exploration tree
│   │   ├── branch-executor.ts       # Execute single branch
│   │   └── tree-merger.ts           # Merge branch findings
│   │
│   ├── perspectives/                # STORM-inspired
│   │   ├── perspective-identifier.ts
│   │   └── perspective-questions.ts
│   │
│   └── types.ts                     # All research types

components/
├── research/
│   ├── research-panel.tsx           # Main container
│   ├── mode-selector.tsx            # Quick/Standard/Deep/Exhaustive
│   ├── clarification-dialog.tsx     # Follow-up questions UI
│   ├── exploration-tree.tsx         # Visual tree progress
│   ├── perspective-cards.tsx        # Show active perspectives
│   ├── iteration-progress.tsx       # Learnings display
│   ├── source-badges.tsx            # PubMed/arXiv/S2 badges
│   ├── quality-score.tsx            # Report quality indicator
│   ├── research-results.tsx         # Final report display
│   └── research-settings.tsx        # Depth/breadth/sources config

app/api/research/
├── route.ts                         # Main research endpoint
├── clarify/route.ts                 # Get clarifying questions
├── sources/
│   ├── arxiv/route.ts              # arXiv search
│   └── semantic-scholar/route.ts   # S2 search
└── stream/route.ts                  # SSE for progress updates
```

---

## Implementation Phases

### Phase 1: Foundation - Multi-Source Search (Week 1)

**Goal**: Search across PubMed, arXiv, and Semantic Scholar with deduplication

#### 1.1 arXiv Client (`lib/research/sources/arxiv.ts`)
```typescript
interface ArxivSearchOptions {
  query: string;
  maxResults?: number;
  categories?: string[];  // cs.AI, cs.LG, etc.
  dateRange?: { start: Date; end: Date };
}

async function searchArxiv(options: ArxivSearchOptions): Promise<ResearchSource[]>
```

#### 1.2 Semantic Scholar Client (`lib/research/sources/semantic-scholar.ts`)
```typescript
interface S2SearchOptions {
  query: string;
  maxResults?: number;
  fields?: string[];
  year?: string;
}

async function searchSemanticScholar(options: S2SearchOptions): Promise<ResearchSource[]>
```

#### 1.3 Cross-Source Deduplicator (`lib/research/sources/deduplicator.ts`)
```typescript
function deduplicateSources(sources: ResearchSource[]): ResearchSource[] {
  // Match by DOI first, then by normalized title
  // Merge metadata from multiple sources
  // Track source origin for badges
}
```

---

### Phase 2: Multi-Agent Architecture (Week 2)

**Goal**: Implement specialized agents with clear responsibilities

#### 2.1 Agent Interfaces (`lib/research/types.ts`)
```typescript
interface Agent {
  name: string;
  role: string;
  execute(input: AgentInput): Promise<AgentOutput>;
}

interface AgentContext {
  topic: string;
  clarifications: string[];
  perspectives: Perspective[];
  branches: ResearchBranch[];
  learnings: string[];
  sources: ResearchSource[];
}
```

#### 2.2 Orchestrator Agent (`lib/research/agents/orchestrator.ts`)
```typescript
class ResearchOrchestrator {
  constructor(
    private clarifier: ClarifierAgent,
    private planner: PlannerAgent,
    private researchers: ResearcherAgent[],
    private reviewer: ReviewerAgent,
    private synthesizer: SynthesizerAgent,
    private writer: WriterAgent
  ) {}

  async research(topic: string, config: ResearchConfig): AsyncGenerator<ProgressUpdate>
}
```

#### 2.3 Clarifier Agent (`lib/research/agents/clarifier.ts`)
- Analyzes topic for ambiguity
- Generates 2-3 clarifying questions
- Waits for user responses before proceeding

#### 2.4 Planner Agent (`lib/research/agents/planner.ts`)
- Identifies 3-5 expert perspectives
- Generates exploration tree based on depth/breadth config
- Assigns sources to each branch

#### 2.5 Researcher Agent (`lib/research/agents/researcher.ts`)
- Executes searches on assigned sources
- Performs iterative refinement within branch
- Accumulates learnings across iterations
- Returns findings with source metadata

#### 2.6 Reviewer Agent (`lib/research/agents/reviewer.ts`)
- Checks for gaps in coverage
- Identifies contradictions
- Flags unsupported claims
- Generates quality score

#### 2.7 Synthesizer Agent (`lib/research/agents/synthesizer.ts`)
- Merges findings from all branches
- Resolves contradictions
- Organizes by perspective

#### 2.8 Writer Agent (`lib/research/agents/writer.ts`)
- Generates final report in academic prose
- Includes proper citations
- Structures with clear sections

---

### Phase 3: Tree Exploration Engine (Week 3)

**Goal**: Implement recursive tree exploration with visual progress

#### 3.1 Tree Builder (`lib/research/tree/tree-builder.ts`)
```typescript
interface ExplorationTree {
  root: ResearchBranch;
  depth: number;
  breadth: number;
  perspectives: Perspective[];
}

function buildExplorationTree(
  topic: string,
  perspectives: Perspective[],
  config: { depth: number; breadth: number }
): ExplorationTree
```

#### 3.2 Branch Executor (`lib/research/tree/branch-executor.ts`)
```typescript
async function executeBranch(
  branch: ResearchBranch,
  context: AgentContext
): AsyncGenerator<BranchUpdate> {
  // Iterative refinement loop
  for (let i = 0; i < maxIterations; i++) {
    const searchResults = await searchSources(branch.queries);
    const learnings = await extractLearnings(searchResults);
    const newDirections = await identifyNewDirections(learnings);

    yield { iteration: i, learnings, sources: searchResults };

    if (shouldSpawnSubBranches(newDirections, context.depth)) {
      // Recursive exploration
      for (const direction of newDirections) {
        yield* executeBranch(createSubBranch(direction), context);
      }
    }
  }
}
```

#### 3.3 Visual Tree Component (`components/research/exploration-tree.tsx`)
- D3.js or React-based tree visualization
- Real-time updates as branches complete
- Color coding for status (pending, active, complete)
- Click to expand branch details

---

### Phase 4: Research Modes & UI (Week 4)

**Goal**: Implement all research modes with polished UI

#### 4.1 Mode Configurations
```typescript
const RESEARCH_MODES = {
  quick: { depth: 1, breadth: 2, maxSources: 10, timeout: 120000 },
  standard: { depth: 2, breadth: 3, maxSources: 20, timeout: 300000 },
  deep: { depth: 3, breadth: 4, maxSources: 30, timeout: 600000 },
  exhaustive: { depth: 4, breadth: 5, maxSources: 50, timeout: 1800000 }
};
```

#### 4.2 Research Panel UI
- Mode selector with time estimates
- Settings panel (depth, breadth, sources, date range)
- Clarification dialog
- Exploration tree visualization
- Iteration progress with learnings
- Quality score display
- Final report with export options

#### 4.3 Progress Streaming
- Server-Sent Events for real-time updates
- Progress stages: Clarifying → Planning → Researching → Reviewing → Synthesizing → Writing
- Detailed progress within each stage

---

### Phase 5: Review-Revision Cycles (Week 5)

**Goal**: Implement quality assurance with targeted gap-filling

#### 5.1 Review Process
```typescript
interface ReviewResult {
  qualityScore: number;      // 0-100
  gaps: Gap[];               // Missing coverage areas
  contradictions: Contradiction[];
  unsupportedClaims: Claim[];
  suggestions: string[];
}
```

#### 5.2 Revision Process
- For each identified gap, generate targeted search queries
- Execute additional searches
- Merge new findings with existing synthesis
- Re-run review to verify improvement

---

### Phase 6: History & Persistence (Week 6)

**Goal**: Full session management with continue/branch capabilities

#### 6.1 Session Schema
```typescript
interface ResearchSession {
  id: string;
  userId: string;
  topic: string;
  mode: ResearchMode;
  config: ResearchConfig;

  // State
  status: 'clarifying' | 'planning' | 'researching' | 'reviewing' | 'complete';
  clarifications: Clarification[];
  tree: ExplorationTree;
  iterations: ResearchIteration[];

  // Output
  synthesis: string;
  qualityScore: number;
  sources: ResearchSource[];

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

#### 6.2 Continue/Branch Features
- Resume from any checkpoint
- Branch creates new session with inherited context

---

## API Contracts

### POST /api/research

**Request**:
```typescript
{
  topic: string;
  mode: 'quick' | 'standard' | 'deep' | 'exhaustive';
  config?: {
    depth?: number;
    breadth?: number;
    sources?: ('pubmed' | 'arxiv' | 'semantic-scholar')[];
    dateRange?: { startYear: number; endYear: number };
    articleTypes?: string[];
  };
  clarifications?: Record<string, string>;  // Answers to clarifying questions
}
```

**Response** (SSE stream):
```typescript
// Progress events
{ type: 'stage', stage: 'clarifying' | 'planning' | ... }
{ type: 'clarification', questions: string[] }
{ type: 'perspectives', perspectives: Perspective[] }
{ type: 'branch_start', branch: ResearchBranch }
{ type: 'branch_update', branchId: string, iteration: number, learnings: string[] }
{ type: 'branch_complete', branchId: string, sources: ResearchSource[] }
{ type: 'review', result: ReviewResult }
{ type: 'synthesis', content: string }  // Streamed
{ type: 'complete', session: ResearchSession }
```

---

## Dependencies

### New Dependencies Required

```bash
npm install --legacy-peer-deps \
  eventsource-parser \     # SSE parsing
  fast-xml-parser \        # arXiv XML parsing
  string-similarity        # Title matching for dedup
```

### API Keys Required
- PubMed: `PUBMED_API_KEY` (existing)
- Semantic Scholar: `S2_API_KEY` (free tier available)
- arXiv: No key required (rate limited)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Long execution times | Progressive display, save checkpoints |
| API rate limits | Queueing, caching, parallel limit |
| Context overflow | Context isolation per branch, pruning |
| Quality inconsistency | Review-revision cycles, quality scoring |
| Complex UI | Phased rollout, start with minimal tree view |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Quick mode time | < 2 min | Timer in UI |
| Deep mode sources | 20+ | Count in results |
| Cross-DB dedup accuracy | > 95% | Manual validation |
| Quality score improvement | +15% with review | Before/after comparison |
| User satisfaction | 4.5/5 | Feedback form |

---

## Competitive Positioning

| Feature | GPT Researcher | STORM | dzhng | LangChain | Ours |
|---------|---------------|-------|-------|-----------|------|
| Tree exploration | ✅ | ❌ | ❌ | ✅ | ✅ |
| Multi-perspective | ❌ | ✅ | ❌ | ❌ | ✅ |
| Iterative learning | ❌ | ❌ | ✅ | ❌ | ✅ |
| Multi-source academic | ❌ | ❌ | ❌ | ❌ | ✅ |
| Review-revision | ✅ | ❌ | ❌ | ❌ | ✅ |
| Visual progress | ❌ | ❌ | ❌ | ❌ | ✅ |
| Research modes | ❌ | ❌ | ❌ | ❌ | ✅ |

**Our advantage**: Combines ALL best-in-class features in one integrated system with visual progress and academic focus.
