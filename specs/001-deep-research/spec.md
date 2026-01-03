# Feature Specification: Deep Research Agent (Best-in-Class)

**Feature Branch**: `001-deep-research`
**Created**: 2026-01-03
**Updated**: 2026-01-03
**Status**: Draft
**Input**: User description: "Integrated deep research agent combining best features from GPT Researcher, STORM, dzhng/deep-research, LangChain Open Deep Research, and Local Deep Research"

## Competitive Analysis Summary

This specification incorporates best-in-class features from:
- **GPT Researcher**: Tree-like exploration, 20+ sources, multi-agent architecture
- **STORM (Stanford)**: Perspective-guided questioning, Wikipedia-style structure
- **dzhng/deep-research**: Iterative refinement, follow-up questions, learning accumulation
- **LangChain Open DR**: Context isolation, adaptive parallelization, supervisor pattern
- **Local Deep Research**: Multi-source academic (PubMed, arXiv, Semantic Scholar), research modes

---

## User Scenarios & Testing

### User Story 1 - Quick Research Mode (Priority: P1) 🎯 MVP

A researcher needs a fast overview of a topic. They enter a question and receive a concise summary with 5-10 key sources in under 2 minutes.

**Why this priority**: Quick mode provides immediate value for time-sensitive research needs.

**Independent Test**: Enter topic → Receive summary with sources in < 2 minutes

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they select "Quick Research" and enter a topic, **Then** they receive a 500-word summary with 5-10 sources within 2 minutes
2. **Given** quick research results, **When** user clicks "Go Deeper", **Then** the system transitions to detailed research mode

---

### User Story 2 - Deep Research with Tree Exploration (Priority: P1) 🎯 MVP

A researcher wants comprehensive coverage of a complex topic. The system uses tree-like exploration with configurable depth and breadth, exploring multiple perspectives and sub-topics.

**Why this priority**: This is the core differentiator - recursive, multi-perspective research that no simple search can match.

**Independent Test**: Enter complex topic → See branching exploration → Receive comprehensive report with 20+ sources

**Acceptance Scenarios**:

1. **Given** a research topic, **When** user initiates "Deep Research", **Then** the system first asks 2-3 clarifying questions to understand scope
2. **Given** clarified scope, **When** research begins, **Then** the system shows a visual tree of exploration branches being investigated
3. **Given** tree exploration in progress, **When** a branch completes, **Then** findings are summarized and new sub-branches may spawn based on discoveries
4. **Given** configurable parameters, **When** user sets depth=3 and breadth=4, **Then** the system explores up to 3 levels deep with 4 parallel paths per level
5. **Given** completed research, **When** synthesis runs, **Then** the report integrates findings from all branches with 20+ properly cited sources

---

### User Story 3 - Multi-Perspective Research (Priority: P1) 🎯 MVP

*Inspired by STORM's perspective-guided approach*

A researcher wants to understand a topic from multiple expert viewpoints. The system identifies relevant perspectives (e.g., clinician, patient, researcher, policy-maker) and investigates each.

**Why this priority**: Perspective diversity ensures comprehensive coverage and reduces bias.

**Independent Test**: Enter controversial topic → See multiple perspectives explored → Report presents balanced viewpoints

**Acceptance Scenarios**:

1. **Given** a research topic, **When** the system analyzes it, **Then** it identifies 3-5 relevant expert perspectives to explore
2. **Given** identified perspectives, **When** research runs, **Then** each perspective generates unique questions and searches
3. **Given** multi-perspective findings, **When** synthesis runs, **Then** the report clearly attributes viewpoints and highlights consensus vs controversy

---

### User Story 4 - Iterative Refinement with Learning (Priority: P2)

*Inspired by dzhng/deep-research*

A researcher wants the system to learn from each search iteration and progressively refine its understanding, accumulating insights across rounds.

**Why this priority**: Iterative learning produces higher-quality results than single-shot searches.

**Independent Test**: Observe multiple research iterations → Each iteration builds on previous learnings → Final report shows accumulated insights

**Acceptance Scenarios**:

1. **Given** a research session, **When** iteration 1 completes, **Then** the system displays "Learnings" and "New Directions" discovered
2. **Given** learnings from iteration 1, **When** iteration 2 runs, **Then** it uses accumulated context to ask more targeted questions
3. **Given** a user watching progress, **When** each iteration completes, **Then** they see a running summary of key findings

---

### User Story 5 - Multi-Source Academic Search (Priority: P2)

*Inspired by Local Deep Research*

A researcher wants to search across multiple academic databases, not just PubMed. The system queries PubMed, arXiv, Semantic Scholar, and optionally Google Scholar.

**Why this priority**: Multi-source search captures papers that may be missing from any single database.

**Independent Test**: Research a CS/ML topic → See results from arXiv and Semantic Scholar alongside PubMed

**Acceptance Scenarios**:

1. **Given** the source selection panel, **When** user selects sources, **Then** they can choose from PubMed, arXiv, Semantic Scholar, and CrossRef
2. **Given** multiple sources selected, **When** research runs, **Then** results are deduplicated and merged by DOI/title matching
3. **Given** merged results, **When** displayed, **Then** each source shows its origin database with a badge

---

### User Story 6 - Review-Revision Quality Cycles (Priority: P2)

*Inspired by GPT Researcher's multi-agent architecture*

The system uses separate agents for research, review, and revision. A reviewer agent checks for gaps, contradictions, and quality issues before the final report is generated.

**Why this priority**: Review cycles catch errors and improve synthesis quality.

**Independent Test**: Complete research → Review agent identifies issues → Reviser addresses them → Higher quality output

**Acceptance Scenarios**:

1. **Given** initial synthesis complete, **When** review phase runs, **Then** the reviewer identifies gaps, unsupported claims, and areas needing more evidence
2. **Given** reviewer feedback, **When** revision runs, **Then** the system performs targeted additional searches to address gaps
3. **Given** revision complete, **When** final synthesis runs, **Then** the report quality score improves measurably

---

### User Story 7 - Research Configuration & Modes (Priority: P2)

Users can choose between research modes and configure depth/breadth parameters.

**Acceptance Scenarios**:

1. **Given** the research panel, **When** user opens settings, **Then** they see:
   - Mode: Quick (2 min) | Standard (5 min) | Deep (10+ min) | Exhaustive (30+ min)
   - Depth: 1-5 levels (how deep to recurse)
   - Breadth: 2-6 paths (parallel exploration branches)
   - Sources: Checkboxes for each database
   - Date range: Start/end year filters
   - Article types: Clinical trials, reviews, meta-analyses, etc.

---

### User Story 8 - Track Research History (Priority: P3)

A researcher can view, continue, and branch from past research sessions.

**Acceptance Scenarios**:

1. **Given** past research sessions, **When** user views history, **Then** they see topic, date, mode, source count, and quality score
2. **Given** a past session, **When** user clicks "Continue", **Then** research resumes with accumulated context
3. **Given** a past session, **When** user clicks "Branch", **Then** a new session starts using the previous findings as a foundation

---

### Edge Cases

- **Topic too broad**: System asks clarifying questions before starting (dzhng-style)
- **No sources found**: Expand search to additional databases, suggest query modifications
- **Research timeout**: Save partial results, allow resume from checkpoint
- **Conflicting sources**: Highlight contradictions in synthesis, present both sides
- **Rate limiting**: Queue requests, show estimated wait time, use cached results when appropriate
- **Context overflow**: Use context isolation (LangChain-style) with sub-agent pruning

---

## Requirements

### Functional Requirements - Core Research Engine

- **FR-001**: System MUST support multiple research modes: Quick, Standard, Deep, Exhaustive
- **FR-002**: System MUST implement tree-like exploration with configurable depth (1-5) and breadth (2-6)
- **FR-003**: System MUST ask 2-3 clarifying questions before starting deep research
- **FR-004**: System MUST identify and explore 3-5 expert perspectives per topic
- **FR-005**: System MUST accumulate learnings across iterations and show progress

### Functional Requirements - Multi-Source Search

- **FR-006**: System MUST search PubMed via existing E-utilities integration
- **FR-007**: System MUST search arXiv via arXiv API
- **FR-008**: System MUST search Semantic Scholar via S2 API
- **FR-009**: System MUST deduplicate results across sources by DOI/title matching
- **FR-010**: System MUST aggregate 20+ sources for deep research mode

### Functional Requirements - Quality Assurance

- **FR-011**: System MUST implement review-revision cycles for deep research
- **FR-012**: System MUST detect gaps and contradictions in findings
- **FR-013**: System MUST perform targeted follow-up searches to address gaps
- **FR-014**: System MUST generate quality scores for research output

### Functional Requirements - Output & Integration

- **FR-015**: System MUST generate author-year citations (Smith et al., 2023)
- **FR-016**: System MUST format synthesis in academic prose (Eric Topol-style)
- **FR-017**: System MUST support export to Markdown, and insertion into TipTap
- **FR-018**: System MUST display real-time progress with visual exploration tree
- **FR-019**: System MUST allow model selection for synthesis

### Functional Requirements - History & Continuity

- **FR-020**: System MUST save research sessions with full context
- **FR-021**: System MUST support resuming interrupted research
- **FR-022**: System MUST support branching from previous sessions

---

### Key Entities

- **ResearchSession**: Complete research exploration with tree structure, iterations, and synthesis
- **ResearchBranch**: A single exploration path in the tree with its own queries, sources, and findings
- **ResearchIteration**: One cycle of search-learn-refine within a branch
- **ResearchPerspective**: An expert viewpoint (clinician, researcher, patient, etc.) with associated questions
- **ResearchSource**: Paper with full metadata from any supported database
- **ResearchSynthesis**: AI-generated narrative with quality score and citations
- **ResearchReview**: Quality assessment with identified gaps and suggestions

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Quick research completes in < 2 minutes with 5-10 sources
- **SC-002**: Deep research completes in < 10 minutes with 20+ sources
- **SC-003**: Exhaustive research explores 50+ sources across 3+ databases
- **SC-004**: Multi-perspective research identifies 3-5 viewpoints per topic
- **SC-005**: Review-revision cycles improve quality scores by 15%+
- **SC-006**: 90% of deep research sessions produce publication-ready content
- **SC-007**: Users rate synthesis quality 4.5/5 or higher on average
- **SC-008**: Cross-database deduplication accuracy > 95%

### Competitive Benchmarks

- **vs GPT Researcher**: Match tree exploration depth, exceed source diversity
- **vs STORM**: Match perspective diversity, exceed academic rigor
- **vs dzhng**: Match iterative learning, exceed UI/UX polish
- **vs Local Deep Research**: Match multi-source, exceed synthesis quality

---

## Architecture Overview

### Multi-Agent System (inspired by GPT Researcher + LangChain)

```
┌─────────────────────────────────────────────────────────────────┐
│                      RESEARCH ORCHESTRATOR                       │
│  (Supervisor agent - coordinates all research activities)        │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   CLARIFIER   │       │   PLANNER     │       │   REVIEWER    │
│ Asks follow-  │       │ Generates     │       │ Checks gaps,  │
│ up questions  │       │ search tree   │       │ quality       │
└───────────────┘       └───────────────┘       └───────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
        ┌───────────────┐               ┌───────────────┐
        │  RESEARCHER   │               │  RESEARCHER   │
        │  (Branch A)   │               │  (Branch B)   │
        │ - PubMed      │               │ - arXiv       │
        │ - Semantic S  │               │ - CrossRef    │
        └───────────────┘               └───────────────┘
                │                               │
                └───────────────┬───────────────┘
                                ▼
                        ┌───────────────┐
                        │  SYNTHESIZER  │
                        │ Merges all    │
                        │ findings      │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │   WRITER      │
                        │ Generates     │
                        │ final report  │
                        └───────────────┘
```

### Research Flow

```
1. CLARIFY: Ask 2-3 questions to understand scope
2. PLAN: Generate exploration tree with perspectives
3. RESEARCH: Execute parallel branches with iterative refinement
4. SYNTHESIZE: Merge findings with deduplication
5. REVIEW: Check for gaps and quality issues
6. REVISE: Targeted searches to fill gaps
7. WRITE: Generate final report with citations
```

---

## Assumptions

- Users have API keys for chosen AI model
- Academic database APIs are accessible (PubMed, arXiv, Semantic Scholar)
- Firebase configured for session storage
- Users authenticated before research
- Sufficient API rate limits for parallel searches

---

## Technical Notes

### API Rate Limits
- PubMed: 10 req/sec with API key
- arXiv: 1 req/3sec (use caching)
- Semantic Scholar: 100 req/5min

### Context Management
- Use context isolation per branch (LangChain pattern)
- Prune irrelevant context before synthesis
- Compress findings before cross-branch merge

### Caching Strategy
- Cache API responses for 24 hours
- Cache intermediate syntheses for session continuity
- Deduplicate at query level to reduce API calls
