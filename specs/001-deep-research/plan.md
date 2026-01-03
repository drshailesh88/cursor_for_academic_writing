# Implementation Plan: Deep Research Agent

**Branch**: `001-deep-research` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-deep-research/spec.md`

## Summary

Build an integrated deep research agent that allows users to conduct comprehensive literature exploration on any topic. The agent will search PubMed for relevant papers, synthesize findings using the user's selected AI model, and generate a cohesive research report with proper author-year citations. The report can be inserted directly into the user's document.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**: Vercel AI SDK, existing PubMed client, TipTap editor
**Storage**: Firebase Firestore (research sessions), no additional storage needed
**Testing**: Manual testing with real PubMed queries
**Target Platform**: Web application (Next.js)
**Project Type**: Web application - extend existing three-panel layout
**Performance Goals**: Complete research session in under 5 minutes, return 10+ sources
**Constraints**: Streaming responses for synthesis, rate limiting for PubMed API (10 req/sec with API key)
**Scale/Scope**: Single user sessions, up to 50 historical research sessions per user

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Academic Excellence First | PASS | Synthesis will use academic prose style from writing-styles.ts |
| Citation Integrity | PASS | All sources will have proper author-year citations from PubMed |
| Multi-LLM Flexibility | PASS | Reuse existing model selector from chat interface |
| Firebase-First Architecture | PASS | Research sessions stored in Firestore with user isolation |
| Simplicity Over Complexity | PASS | Extend existing patterns, no new complex abstractions |

## Project Structure

### Documentation (this feature)

```text
specs/001-deep-research/
├── spec.md              # Feature specification
├── plan.md              # This file
└── tasks.md             # Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
# New files to create
lib/
├── research/
│   ├── research-agent.ts        # Main research orchestration
│   ├── research-synthesizer.ts  # AI synthesis logic
│   └── research-types.ts        # TypeScript interfaces

components/
├── research/
│   ├── deep-research-panel.tsx  # Main research UI
│   ├── research-progress.tsx    # Progress indicators
│   ├── research-results.tsx     # Display synthesized report
│   ├── research-settings.tsx    # Date range, source type filters
│   └── research-history.tsx     # Past research sessions

app/api/
├── research/
│   └── route.ts                 # Research API endpoint (streaming)

# Files to modify
lib/firebase/
├── schema.ts                    # Add ResearchSession, ResearchSource types
├── documents.ts                 # Add research session CRUD operations

components/layout/
├── three-panel-layout.tsx       # Add research panel toggle/tab
```

**Structure Decision**: Extend existing web application structure. Research logic in `lib/research/`, UI in `components/research/`, API in `app/api/research/`.

## Implementation Phases

### Phase 1: Core Research Engine (P1 - MVP)

**Goal**: User can enter a topic and receive a synthesized research report

**Components**:
1. **Research Agent** (`lib/research/research-agent.ts`)
   - Accept research topic as input
   - Use existing PubMed client to search for papers
   - Fetch top 20 results, analyze abstracts
   - Return structured research sources

2. **Research Synthesizer** (`lib/research/research-synthesizer.ts`)
   - Take research sources as input
   - Use selected AI model to synthesize findings
   - Generate cohesive narrative with citations
   - Stream response to UI

3. **Research API** (`app/api/research/route.ts`)
   - POST endpoint accepting topic, model, and optional filters
   - Stream synthesis results using Vercel AI SDK
   - Return structured source list alongside synthesis

4. **Research Panel UI** (`components/research/deep-research-panel.tsx`)
   - Input field for research topic
   - Model selector (reuse from chat interface)
   - Progress indicators during research
   - Display synthesized report with expandable sources
   - "Insert into Document" button

### Phase 2: Research Customization (P2)

**Goal**: User can configure date ranges and source types

**Components**:
1. **Research Settings** (`components/research/research-settings.tsx`)
   - Date range picker (start year, end year)
   - Source type checkboxes (clinical trials, reviews, meta-analyses)
   - Focus area tags (optional topic refinement)

2. **Enhanced PubMed Search**
   - Modify search queries to include date filters
   - Add publication type filters to existing PubMed client

### Phase 3: Research History (P3)

**Goal**: User can view and revisit past research sessions

**Components**:
1. **Firebase Schema Extension** (`lib/firebase/schema.ts`)
   - Add ResearchSession interface
   - Add to user's sub-collection

2. **Research History UI** (`components/research/research-history.tsx`)
   - List view of past sessions with topic and date
   - Click to view full report
   - "Continue Research" to expand on previous session

3. **Research CRUD Operations** (`lib/firebase/documents.ts`)
   - saveResearchSession()
   - getUserResearchSessions()
   - getResearchSession()
   - deleteResearchSession()

## Data Model

### ResearchSession (Firestore)

```typescript
interface ResearchSession {
  id: string;
  userId: string;
  topic: string;
  model: string;                 // AI model used
  sources: ResearchSource[];
  synthesis: string;             // Full synthesized report
  parameters: {
    dateRange?: { startYear: number; endYear: number };
    sourceTypes?: string[];
    focusAreas?: string[];
  };
  createdAt: Timestamp;
  wordCount: number;
}

interface ResearchSource {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  citation: string;              // "(Smith et al., 2023)" format
  relevanceScore?: number;
}
```

### Firestore Collection Structure

```
users/{userId}/researchSessions/{sessionId}
```

## API Contract

### POST /api/research

**Request**:
```typescript
{
  topic: string;
  model: 'openai' | 'anthropic' | 'google' | ...;
  parameters?: {
    dateRange?: { startYear: number; endYear: number };
    sourceTypes?: string[];
    maxSources?: number;
  };
}
```

**Response** (streamed):
```typescript
{
  sources: ResearchSource[];      // Sent first
  synthesis: string;              // Streamed after sources
}
```

## UI Integration

### Three-Panel Layout Enhancement

Add a "Research" tab/button to the right panel alongside "Chat". When activated:
- Replace chat interface with research panel
- Maintain document context for insertion

### Research Flow

```
1. User clicks "Deep Research" button/tab
2. Research panel appears with topic input
3. User enters topic, optionally configures settings
4. User clicks "Start Research"
5. Progress indicators show: "Searching PubMed..." → "Analyzing 15 papers..." → "Synthesizing findings..."
6. Report appears with collapsible source list
7. User clicks "Insert into Document"
8. Report content inserted at cursor position with proper formatting
```

## Dependencies

### Existing (no changes needed)
- `lib/pubmed/client.ts` - PubMed search functionality
- `@ai-sdk/*` packages - AI model integration
- `lib/prompts/writing-styles.ts` - Academic prose style prompts

### New Dependencies (none required)
- All functionality can be built with existing dependencies

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| PubMed API rate limiting | Use existing API key (10 req/sec), batch requests |
| Long synthesis times | Stream response, show progress, allow cancellation |
| Poor synthesis quality | Use strong system prompt with academic style guidelines |
| Large context windows | Summarize abstracts before synthesis if needed |

## Success Metrics

- Research session completes in < 5 minutes
- Returns 10+ relevant sources
- Synthesis quality rated "good" or better
- Insert functionality works seamlessly with TipTap
