# Ralph Loop Prompts for Spec-Driven Development

This document contains optimized prompts for Ralph Wiggum loops to build the Academic Writing Platform features autonomously.

## Usage

Copy a prompt and run it with:
```
/ralph-loop "PROMPT" --completion-promise "PROMISE" --max-iterations N
```

---

## Phase 1: Deep Research Engine

### Loop 1.1: Multi-Agent Orchestration System

```
/ralph-loop "
## Task: Build the Deep Research Multi-Agent System

You are implementing the core agent system for Deep Research based on specs/001-deep-research/spec.md.

### Requirements

Implement these 9 agents in lib/deep-research/agents/:

1. **OrchestratorAgent** (orchestrator-agent.ts)
   - Coordinates all other agents
   - Manages research session state
   - Routes tasks to appropriate agents
   - Handles error recovery

2. **ClarifierAgent** (clarifier-agent.ts)
   - Analyzes initial research topic
   - Generates 3-5 clarifying questions
   - Refines topic based on user answers

3. **PerspectiveAnalystAgent** (perspective-analyst-agent.ts)
   - Creates 3-7 expert perspectives (STORM-inspired)
   - Each perspective has a role, focus areas, and questions

4. **SearchStrategistAgent** (search-strategist-agent.ts)
   - Creates search strategies for each database
   - Generates keyword variations and boolean queries
   - Prioritizes sources based on research mode

5. **ResearcherAgent** (researcher-agent.ts)
   - Executes searches across databases
   - Analyzes papers for relevance
   - Extracts key findings and data points

6. **CitationAnalystAgent** (citation-analyst-agent.ts)
   - Classifies citations (supporting/disputing/mentioning)
   - Builds citation graph
   - Identifies consensus patterns

7. **SynthesizerAgent** (synthesizer-agent.ts)
   - Combines findings into coherent narrative
   - Ensures balanced representation of evidence
   - Creates structured sections

8. **QualityReviewerAgent** (quality-reviewer-agent.ts)
   - Reviews synthesis for accuracy
   - Checks citation coverage
   - Identifies gaps and biases

9. **WriterAgent** (writer-agent.ts)
   - Generates final research report
   - Formats with proper citations
   - Creates executive summary

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
- npm run lint (no lint errors)

When ALL agents are implemented with passing tests, output:
<promise>AGENTS_COMPLETE</promise>
" --completion-promise "AGENTS_COMPLETE" --max-iterations 40
```

### Loop 1.2: Academic Database Search Integration

```
/ralph-loop "
## Task: Build Academic Database Search Providers

Implement search providers for 6 academic databases in lib/deep-research/sources/.

### Requirements

Based on the SearchProvider interface in sources/types.ts, implement:

1. **PubMedProvider** (pubmed-provider.ts)
   - Use NCBI E-utilities API
   - Handle esearch and efetch endpoints
   - Parse XML responses
   - Existing code reference: lib/pubmed/client.ts

2. **SemanticScholarProvider** (semantic-scholar-provider.ts)
   - Use Semantic Scholar Academic Graph API
   - Handle paper search and details
   - Get citing and referenced papers

3. **ArxivProvider** (arxiv-provider.ts)
   - Use arXiv API
   - Parse Atom feed responses
   - Handle preprint metadata

4. **CrossRefProvider** (crossref-provider.ts)
   - Use CrossRef REST API
   - Search by DOI and metadata
   - Get citation counts

5. **EuropePMCProvider** (europe-pmc-provider.ts)
   - Use Europe PMC REST API
   - Handle full-text availability
   - Parse structured abstracts

6. **UnifiedSearchService** (unified-search-service.ts)
   - Aggregates results from all providers
   - Deduplicates by DOI/title
   - Ranks by relevance
   - Handles provider failures gracefully

### Technical Requirements

- Implement SearchProvider interface for each
- Use fetch API for HTTP requests
- Add proper error handling and retries
- Rate limit requests appropriately
- Cache results when possible
- Log search metrics

### Testing Requirements

Write tests in tests/deep-research/sources/:
- Mock API responses for each provider
- Test search, details, citations endpoints
- Test unified search deduplication
- Test error handling and retries
- Achieve 80%+ coverage

### Verification

- npm run type-check (pass)
- npm run test:run (pass)
- npm run lint (pass)

When ALL providers are implemented with passing tests, output:
<promise>SOURCES_COMPLETE</promise>
" --completion-promise "SOURCES_COMPLETE" --max-iterations 35
```

### Loop 1.3: Tree Exploration System

```
/ralph-loop "
## Task: Build Tree Exploration System

Implement the tree-like research exploration in lib/deep-research/tree/.

### Requirements

Based on ExplorationTree and ExplorationNode types:

1. **TreeBuilder** (tree-builder.ts)
   - Creates exploration tree from root query
   - Manages depth and breadth limits
   - Handles node expansion

2. **NodeExpander** (node-expander.ts)
   - Expands a node by searching and analyzing
   - Generates follow-up queries from findings
   - Identifies knowledge gaps

3. **TreePruner** (tree-pruner.ts)
   - Prunes low-relevance branches
   - Balances exploration vs exploitation
   - Prevents infinite expansion

4. **LearningAccumulator** (learning-accumulator.ts)
   - Accumulates findings across iterations
   - Tracks what's been learned
   - Identifies diminishing returns

5. **TreeVisualizer** (tree-visualizer.ts)
   - Generates tree visualization data
   - Supports interactive exploration
   - Shows progress indicators

### Technical Requirements

- Configurable depth (1-6) and breadth (2-8)
- Async iteration with progress callbacks
- Memory-efficient for large trees
- Serializable to Firestore

### Testing Requirements

- Test tree construction with various depths
- Test node expansion logic
- Test pruning decisions
- Test learning accumulation
- 80%+ coverage

When complete with passing tests, output:
<promise>TREE_COMPLETE</promise>
" --completion-promise "TREE_COMPLETE" --max-iterations 30
```

### Loop 1.4: Perspective System (STORM-inspired)

```
/ralph-loop "
## Task: Build Multi-Perspective Research System

Implement the STORM-inspired perspective system in lib/deep-research/perspectives/.

### Requirements

1. **PerspectiveGenerator** (perspective-generator.ts)
   - Analyzes topic to identify 3-7 expert viewpoints
   - Creates diverse perspectives (clinical, methodological, etc.)
   - Generates focus areas and questions for each

2. **PerspectiveInterviewer** (perspective-interviewer.ts)
   - Simulates expert interview sessions
   - Asks perspective-specific questions
   - Records answers with sources

3. **PerspectiveSynthesizer** (perspective-synthesizer.ts)
   - Combines insights from all perspectives
   - Identifies areas of agreement/disagreement
   - Creates balanced multi-view summary

### Technical Requirements

- Uses LLM for perspective generation
- Each perspective has distinct voice/expertise
- Questions are research-grounded
- Answers cite specific sources

### Testing Requirements

- Test perspective diversity
- Test question generation
- Test synthesis logic
- 80%+ coverage

When complete with passing tests, output:
<promise>PERSPECTIVES_COMPLETE</promise>
" --completion-promise "PERSPECTIVES_COMPLETE" --max-iterations 25
```

### Loop 1.5: Synthesis and Quality Review

```
/ralph-loop "
## Task: Build Synthesis and Quality Review System

Implement the synthesis engine in lib/deep-research/synthesis/.

### Requirements

1. **SynthesisEngine** (synthesis-engine.ts)
   - Combines all research into coherent report
   - Creates structured sections
   - Maintains citation accuracy

2. **ConsensusAnalyzer** (consensus-analyzer.ts)
   - Analyzes yes/no research questions
   - Calculates agreement percentages
   - Visualizes consensus data

3. **QualityChecker** (quality-checker.ts)
   - Reviews for accuracy issues
   - Checks citation coverage
   - Identifies missing perspectives

4. **RevisionManager** (revision-manager.ts)
   - Manages revision cycles
   - Tracks feedback resolution
   - Limits revision iterations

5. **ReportGenerator** (report-generator.ts)
   - Generates final markdown report
   - Creates executive summary
   - Formats citations properly

### Technical Requirements

- Iterative revision until quality threshold
- Proper citation formatting
- Export to multiple formats

### Testing Requirements

- Test synthesis quality
- Test consensus calculation
- Test revision logic
- 80%+ coverage

When complete with passing tests, output:
<promise>SYNTHESIS_COMPLETE</promise>
" --completion-promise "SYNTHESIS_COMPLETE" --max-iterations 30
```

### Loop 1.6: Deep Research API and UI

```
/ralph-loop "
## Task: Build Deep Research API and UI Components

Create the API endpoints and React components for Deep Research.

### API Requirements (app/api/deep-research/)

1. **route.ts** - Main research endpoints
   - POST /api/deep-research - Create new session
   - GET /api/deep-research/[id] - Get session status
   - POST /api/deep-research/[id]/clarify - Submit clarifications
   - POST /api/deep-research/[id]/cancel - Cancel research
   - GET /api/deep-research/[id]/stream - SSE for progress

### UI Components (components/deep-research/)

1. **ResearchLauncher** - Topic input and mode selection
2. **ClarificationDialog** - Asks clarifying questions
3. **ProgressPanel** - Shows real-time progress
4. **AgentActivityFeed** - Shows agent work
5. **SourceList** - Lists discovered sources
6. **CitationGraph** - Visualizes relationships
7. **SynthesisViewer** - Displays final report
8. **ResearchHistory** - Lists past sessions

### Technical Requirements

- Server-sent events for real-time updates
- Proper loading and error states
- Responsive design
- Accessibility compliance

### Testing Requirements

- Test API endpoints
- Test component rendering
- Test user interactions
- 70%+ coverage

When complete with passing tests, output:
<promise>DEEP_RESEARCH_UI_COMPLETE</promise>
" --completion-promise "DEEP_RESEARCH_UI_COMPLETE" --max-iterations 40
```

---

## Phase 2: Understand Your Papers

### Loop 2.1: PDF Processing Engine

```
/ralph-loop "
## Task: Build PDF Processing Engine

Implement PDF processing in lib/understand-papers/processing/.

### Requirements

Based on specs/002-chat-with-papers/spec.md:

1. **PdfUploader** - Handles file upload to Firebase Storage
2. **TextExtractor** - Extracts text from PDFs (pdf-parse)
3. **OcrProcessor** - OCR for scanned documents (Tesseract.js)
4. **SectionIdentifier** - Identifies paper sections
5. **FigureExtractor** - Extracts figures with captions
6. **TableExtractor** - Converts tables to structured data
7. **ReferenceParser** - Parses reference list
8. **MetadataEnricher** - Enriches from CrossRef/PubMed

### Technical Requirements

- Handle PDFs up to 100MB
- Parallel processing for efficiency
- Progress callbacks
- Error recovery

### Testing Requirements

- Test with various PDF types
- Test OCR accuracy
- Test section detection
- 80%+ coverage

When complete with passing tests, output:
<promise>PDF_PROCESSING_COMPLETE</promise>
" --completion-promise "PDF_PROCESSING_COMPLETE" --max-iterations 35
```

### Loop 2.2: Paper Chat System

```
/ralph-loop "
## Task: Build Paper Chat System

Implement paper chat in lib/understand-papers/chat/.

### Requirements

1. **PaperChatEngine** - Main chat orchestration
2. **ContextBuilder** - Builds context from paper content
3. **CitationTracker** - Tracks paragraph-level citations
4. **MultiPaperChat** - Chat with multiple papers
5. **PromptLibrary** - 50+ pre-built prompts

### Technical Requirements

- Citation-aware responses
- Multi-model support
- Streaming responses
- Context window management

When complete with passing tests, output:
<promise>PAPER_CHAT_COMPLETE</promise>
" --completion-promise "PAPER_CHAT_COMPLETE" --max-iterations 30
```

---

## Phase 3: Connected Papers Discovery

### Loop 3.1: Citation Network Engine

```
/ralph-loop "
## Task: Build Citation Network Engine

Implement citation networks in lib/connected-papers/network/.

### Requirements

Based on specs/003-connected-papers/spec.md:

1. **NetworkBuilder** - Creates citation networks
2. **CoCitationAnalyzer** - Co-citation relationships
3. **BibliographicCoupling** - Shared references
4. **SemanticSimilarity** - Embedding-based similarity
5. **NetworkLayout** - Force-directed layout
6. **ClusterDetector** - Identifies paper clusters

### Technical Requirements

- Semantic Scholar API integration
- Efficient graph algorithms
- D3-compatible output

When complete with passing tests, output:
<promise>NETWORK_COMPLETE</promise>
" --completion-promise "NETWORK_COMPLETE" --max-iterations 30
```

---

## Running Ralph Loops

### Recommended Sequence

1. Start with Loop 1.1 (Agents) - foundation for everything
2. Run Loop 1.2 (Sources) - enables real searches
3. Run Loop 1.3 (Tree) - core exploration logic
4. Run Loop 1.4 (Perspectives) - STORM methodology
5. Run Loop 1.5 (Synthesis) - output generation
6. Run Loop 1.6 (API/UI) - user-facing features

### Monitoring Progress

Check Ralph state:
```bash
cat .claude/ralph-loop.local.md
```

View iteration count in the frontmatter.

### Canceling a Loop

```
/cancel-ralph
```

### Tips for Success

1. Each loop focuses on ONE cohesive feature set
2. Tests verify correctness before completion
3. Type checking catches interface mismatches
4. Commit frequently to track progress
5. If stuck, check spec for requirements
