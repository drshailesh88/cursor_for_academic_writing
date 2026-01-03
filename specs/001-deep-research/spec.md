# Feature Specification: Deep Research Engine

**Feature Branch**: `001-deep-research`
**Created**: 2026-01-03
**Status**: Complete Specification
**Competitive Benchmark**: GPT Researcher + STORM + Elicit + Consensus + NotebookLM

---

## Overview

A complete, production-ready deep research engine that surpasses every existing tool by combining multi-agent architecture, multi-perspective analysis, iterative learning, smart citation classification, consensus visualization, and seamless writing integration.

---

## Complete Feature Set

### 1. Multi-Agent Research Architecture

The research engine employs 9 specialized AI agents working in concert:

| Agent | Responsibility | Capabilities |
|-------|---------------|--------------|
| **Orchestrator** | Workflow coordination | Manages all agents, handles errors, tracks progress |
| **Clarifier** | Scope definition | Generates clarifying questions, interprets responses |
| **Perspective Analyst** | Multi-viewpoint research | Identifies 3-7 expert perspectives per topic |
| **Search Strategist** | Query optimization | Generates exploration tree, assigns databases |
| **Researcher** (x4) | Parallel execution | Searches assigned sources, extracts findings |
| **Citation Analyst** | Relationship mapping | Classifies citations (support/dispute/mention) |
| **Synthesizer** | Content integration | Merges findings, resolves conflicts, organizes |
| **Quality Reviewer** | Verification | Checks gaps, unsupported claims, contradictions |
| **Writer** | Output generation | Creates academic prose with proper citations |

### 2. Research Modes

| Mode | Duration | Sources | Depth | Breadth | Output |
|------|----------|---------|-------|---------|--------|
| **Quick Scan** | 1-2 min | 5-10 | 1 | 2 | 500-word summary |
| **Standard** | 5 min | 15-25 | 2 | 3 | 1500-word report |
| **Deep Dive** | 10-15 min | 30-50 | 3 | 4 | 3000-word analysis |
| **Exhaustive** | 20-30 min | 75-100 | 4 | 5 | 5000-word review |
| **Systematic Review** | 1-2 hours | 200+ | 5 | 6 | Full literature review |

### 3. Multi-Source Academic Search

| Database | Coverage | Specialization |
|----------|----------|----------------|
| **PubMed/MEDLINE** | 35M+ papers | Biomedical, life sciences |
| **arXiv** | 2.5M+ papers | Physics, CS, math, quantitative |
| **Semantic Scholar** | 225M+ papers | All disciplines, AI-curated |
| **CrossRef** | 140M+ papers | DOI metadata, all publishers |
| **Europe PMC** | 40M+ papers | European research |
| **CORE** | 300M+ papers | Open access aggregator |

**Search Capabilities:**
- Semantic/concept-based search (not just keywords)
- Boolean operators with natural language
- PICO query builder for clinical questions
- Saved search templates
- Cross-database deduplication (>95% accuracy)

### 4. Multi-Perspective Research (STORM-Inspired)

For any research topic, automatically identify and explore multiple expert viewpoints:

**Medical Example - "AI in Radiology":**
- 👨‍⚕️ **Clinician perspective**: Workflow integration, diagnostic accuracy
- 🔬 **Researcher perspective**: Algorithm development, validation methods
- 🏥 **Administrator perspective**: Cost-effectiveness, implementation
- 👤 **Patient perspective**: Trust, communication, outcomes
- ⚖️ **Ethicist perspective**: Bias, accountability, transparency
- 📋 **Regulator perspective**: Approval pathways, safety standards

Each perspective generates unique questions and searches, ensuring comprehensive coverage.

### 5. Tree-Like Exploration Engine

**Configurable Parameters:**
- **Depth**: How many levels to recurse (1-6)
- **Breadth**: Parallel paths per level (2-8)
- **Max Sources**: Upper limit on papers (10-500)
- **Iteration Limit**: Refinement cycles per branch (1-5)

**Visual Exploration Tree:**
```
Research Topic: "CRISPR gene therapy safety"
│
├─── Perspective: Clinical Safety ─────────────────────
│    ├─── Off-target effects (12 papers)
│    │    ├─── Detection methods (8 papers)
│    │    └─── Mitigation strategies (6 papers)
│    ├─── Immune responses (9 papers)
│    └─── Long-term outcomes (5 papers)
│
├─── Perspective: Regulatory ──────────────────────────
│    ├─── FDA guidance (4 papers)
│    ├─── EMA requirements (3 papers)
│    └─── International standards (7 papers)
│
└─── Perspective: Ethical ─────────────────────────────
     ├─── Informed consent (6 papers)
     ├─── Germline editing debates (11 papers)
     └─── Access and equity (8 papers)
```

### 6. Iterative Refinement with Learning Accumulation

At each iteration:
1. **Execute searches** across assigned databases
2. **Extract learnings** - Key findings from new papers
3. **Identify new directions** - Topics discovered that need exploration
4. **Accumulate context** - Build on previous iterations
5. **Generate sub-branches** - Spawn new exploration paths if depth allows

**User-Visible Progress:**
```
Iteration 1: Found 15 papers on off-target effects
  → Learnings: GUIDE-seq most common detection method
  → New direction: Computational prediction tools

Iteration 2: Found 8 papers on prediction tools
  → Learnings: Machine learning improves accuracy 40%
  → New direction: Training data requirements

Iteration 3: Synthesizing findings across 23 papers...
```

### 7. Smart Citation Classification (Scite-Inspired)

For every citation relationship discovered:

| Type | Description | Visual | Example |
|------|-------------|--------|---------|
| **Supporting** | Agrees, confirms, builds upon | 🟢 | "Consistent with Smith et al..." |
| **Disputing** | Challenges, contradicts | 🔴 | "Contrary to Jones et al..." |
| **Mentioning** | Neutral reference | 🔵 | "Smith et al. studied..." |
| **Methodology** | Uses methods from | 🟡 | "Following the protocol of..." |
| **Data Source** | Uses data from | 🟣 | "Using the dataset from..." |

**Citation Statement Search:**
- Find every sentence citing a specific paper
- Track how claims propagate through literature
- Identify contested vs. confirmed findings

### 8. Consensus Visualization (Consensus.app-Inspired)

For yes/no research questions, visualize the state of evidence:

```
┌─────────────────────────────────────────────────────────────┐
│  Question: "Does intermittent fasting improve longevity?"   │
│                                                             │
│  CONSENSUS METER                                            │
│  ████████████████████░░░░░░░░░░  67% Supportive             │
│  ░░░░░░░░░░░░░░░░░░░░████████░░  23% Mixed/Neutral          │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  10% Contradicting          │
│                                                             │
│  Based on: 42 studies (18 RCTs, 15 cohort, 9 reviews)      │
│  Confidence: MODERATE (limited long-term human data)        │
│                                                             │
│  [View Supporting Studies] [View Contradicting Studies]     │
└─────────────────────────────────────────────────────────────┘
```

**Evidence Quality Indicators:**
- Study design hierarchy (RCT > cohort > case study)
- Sample size aggregation
- Replication status
- Recency weighting
- Conflict of interest flags

### 9. Review-Revision Quality Cycles

After initial synthesis, the Quality Reviewer:

1. **Gap Analysis**: Identifies missing coverage areas
2. **Claim Verification**: Checks all claims have supporting citations
3. **Contradiction Detection**: Finds conflicting statements
4. **Balance Check**: Ensures multiple perspectives represented
5. **Quality Scoring**: 0-100 score with breakdown

**If issues found:**
- Generate targeted searches to fill gaps
- Execute additional research
- Merge new findings
- Re-synthesize
- Repeat until quality threshold met (default: 85)

### 10. Output Generation

#### Research Reports

| Format | Use Case | Includes |
|--------|----------|----------|
| **Executive Summary** | Quick overview | Key findings, top 5 sources |
| **Standard Report** | Regular research | Full synthesis, all sources, visualizations |
| **Literature Review** | Paper writing | Structured by theme, comprehensive citations |
| **Systematic Review** | PRISMA-compliant | Search strategy, inclusion criteria, risk of bias |
| **Evidence Brief** | Policy/decision making | Recommendations, certainty of evidence |

#### Additional Outputs

- **Comparison Tables**: Multi-study data extraction
- **Gap Analysis Report**: What's missing in the literature
- **Research Questions**: Generated follow-up investigations
- **Study Characteristics Table**: For systematic reviews
- **PRISMA Flow Diagram**: Paper selection visualization
- **Citation Network Export**: For external visualization tools

#### Citation Export Formats
- BibTeX
- RIS (EndNote/Mendeley)
- Zotero RDF
- CSL-JSON
- Plain text (APA, MLA, Chicago, Vancouver)

### 11. Writing Integration

**Seamless Document Integration:**
- One-click insert synthesis into TipTap editor
- Maintains citation format throughout
- Auto-generates reference list
- Inline citation suggestions while writing
- Citation consistency checking

**Smart Insertion Options:**
- Insert full synthesis
- Insert specific section
- Insert as quote with citation
- Insert comparison table
- Insert findings only (no methodology)

### 12. Research Alerts & Monitoring

**Set up alerts for:**
- New papers matching saved searches
- New citations to tracked papers
- New work by followed authors
- Topic trend changes
- Consensus shifts on tracked questions

**Alert Delivery:**
- In-app notifications
- Email digest (daily/weekly)
- Push notifications (mobile)

### 13. Collaboration Features

**Shared Research Projects:**
- Invite collaborators by email
- Role-based access (owner, editor, viewer)
- Real-time collaboration on research sessions
- Comment threads on findings
- Activity history and audit log

**Research Handoff:**
- Export complete research context
- Import from collaborators
- Version history with rollback

---

## User Interface Components

### Research Panel
```
┌─────────────────────────────────────────────────────────────┐
│  🔬 DEEP RESEARCH                                    [⚙️]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Enter your research question...                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Research Mode:                                             │
│  [Quick] [Standard] [Deep Dive] [Exhaustive] [Systematic]   │
│                                                             │
│  ┌─ Advanced Settings ─────────────────────────────────┐   │
│  │ Depth: [████████░░] 4     Breadth: [██████░░░░] 3   │   │
│  │                                                      │   │
│  │ Sources: ☑️ PubMed ☑️ arXiv ☑️ Semantic Scholar     │   │
│  │          ☑️ CrossRef ☐ Europe PMC ☐ CORE           │   │
│  │                                                      │   │
│  │ Date Range: [2019] to [2024]                        │   │
│  │ Article Types: ☑️ All ☐ RCT ☐ Review ☐ Meta-analysis│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [🚀 Start Research]                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📊 EXPLORATION TREE                        [Expand All]   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Interactive D3.js tree visualization]              │  │
│  │  • Click nodes to see findings                       │  │
│  │  • Color = status (active/complete/pending)          │  │
│  │  • Size = source count                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📈 PROGRESS                                                │
│  Stage: Researching [████████████░░░░░░░░] 65%             │
│  Branch 3/5: Clinical Safety • Iteration 2/3               │
│  Sources found: 47 • Unique after dedup: 38                │
│                                                             │
│  Latest learnings:                                          │
│  • CRISPR-Cas9 shows 0.1% off-target rate in vivo          │
│  • New detection methods improve sensitivity 10x            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📋 RESULTS                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Synthesized report with citations]                 │  │
│  │  Quality Score: 87/100                               │  │
│  │                                                       │  │
│  │  [Insert into Document] [Export PDF] [Export BibTeX] │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Consensus Visualization Panel
```
┌─────────────────────────────────────────────────────────────┐
│  📊 RESEARCH CONSENSUS                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Question: Does meditation reduce anxiety?                  │
│                                                             │
│  ┌─ CONSENSUS METER ───────────────────────────────────┐   │
│  │  🟢 Supporting    ████████████████████░░░░  78%     │   │
│  │  🔵 Neutral       ░░░░░░░░░░░░░░░░░░░░████  15%     │   │
│  │  🔴 Contradicting ░░░░░░░░░░░░░░░░░░░░░░██   7%     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Evidence Breakdown:                                        │
│  • 23 RCTs (18 supporting, 3 neutral, 2 contradicting)     │
│  • 15 meta-analyses (12 supporting, 2 neutral, 1 contra)   │
│  • 8 systematic reviews (all supporting)                    │
│                                                             │
│  Confidence: HIGH                                           │
│  Reason: Multiple high-quality RCTs with consistent results │
│                                                             │
│  [View All Studies] [Export Evidence Table]                 │
└─────────────────────────────────────────────────────────────┘
```

### Citation Network Visualization
```
┌─────────────────────────────────────────────────────────────┐
│  🕸️ CITATION NETWORK                     [Filter] [Export] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │     [Interactive force-directed graph]               │  │
│  │                                                       │  │
│  │     • Node size = citation count                     │  │
│  │     • Node color = publication year                  │  │
│  │     • Edge color = relationship type                 │  │
│  │       🟢 Supporting  🔴 Disputing  🔵 Mentioning     │  │
│  │     • Click node = view paper details               │  │
│  │     • Drag to rearrange                             │  │
│  │     • Scroll to zoom                                │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Selected: Smith et al. 2023                                │
│  Cited by: 45 papers (38 supporting, 5 neutral, 2 disputing)│
│  Cites: 62 papers                                           │
│                                                             │
│  [View Abstract] [Add to Collection] [Find Similar]         │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### ResearchSession
```typescript
interface ResearchSession {
  id: string;
  userId: string;

  // Configuration
  topic: string;
  mode: 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic';
  config: {
    depth: number;
    breadth: number;
    maxSources: number;
    sources: DatabaseSource[];
    dateRange: { start: number; end: number };
    articleTypes: ArticleType[];
  };

  // Clarification
  clarifications: {
    question: string;
    answer: string;
  }[];

  // Perspectives
  perspectives: Perspective[];

  // Exploration Tree
  tree: ExplorationTree;

  // All discovered sources
  sources: ResearchSource[];

  // Citation relationships
  citationGraph: CitationGraph;

  // Consensus data
  consensus?: ConsensusData;

  // Synthesis
  synthesis: {
    content: string;
    qualityScore: number;
    reviewFeedback: ReviewFeedback[];
    revisionCount: number;
  };

  // Metadata
  status: 'clarifying' | 'planning' | 'researching' | 'reviewing' | 'synthesizing' | 'complete';
  progress: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;

  // Collaboration
  collaborators: Collaborator[];
  comments: Comment[];
}
```

### CitationGraph
```typescript
interface CitationGraph {
  nodes: {
    id: string;  // PMID, DOI, or arXiv ID
    title: string;
    authors: string[];
    year: number;
    citationCount: number;
    source: DatabaseSource;
  }[];

  edges: {
    from: string;
    to: string;
    type: 'supporting' | 'disputing' | 'mentioning' | 'methodology' | 'data';
    statement?: string;  // The citing sentence
    confidence: number;
  }[];
}
```

### ConsensusData
```typescript
interface ConsensusData {
  question: string;
  questionType: 'yes_no' | 'comparative' | 'descriptive';

  distribution: {
    supporting: number;
    neutral: number;
    contradicting: number;
  };

  breakdown: {
    studyType: string;
    supporting: number;
    neutral: number;
    contradicting: number;
  }[];

  confidence: 'high' | 'moderate' | 'low' | 'very_low';
  confidenceReason: string;

  keyStudies: {
    supporting: ResearchSource[];
    contradicting: ResearchSource[];
  };
}
```

---

## API Specification

### POST /api/research/start

Start a new research session.

**Request:**
```typescript
{
  topic: string;
  mode: 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic';
  config?: {
    depth?: number;
    breadth?: number;
    maxSources?: number;
    sources?: string[];
    dateRange?: { start: number; end: number };
    articleTypes?: string[];
  };
}
```

**Response:** SSE Stream
```typescript
// Clarification needed
{ type: 'clarification', questions: string[] }

// Planning complete
{ type: 'perspectives', perspectives: Perspective[] }

// Branch updates
{ type: 'branch_start', branchId: string, topic: string }
{ type: 'branch_iteration', branchId: string, iteration: number, learnings: string[] }
{ type: 'branch_complete', branchId: string, sources: ResearchSource[] }

// Citation analysis
{ type: 'citation_graph', graph: CitationGraph }

// Consensus (if applicable)
{ type: 'consensus', data: ConsensusData }

// Review
{ type: 'review', feedback: ReviewFeedback }

// Synthesis (streamed)
{ type: 'synthesis_chunk', content: string }

// Complete
{ type: 'complete', session: ResearchSession }
```

### POST /api/research/clarify

Submit answers to clarifying questions.

### GET /api/research/session/:id

Retrieve a research session.

### POST /api/research/continue/:id

Continue a paused or incomplete session.

### POST /api/research/branch/:id

Create a new session branching from an existing one.

### GET /api/research/history

Get user's research history.

### POST /api/research/alert

Create a research alert.

### GET /api/research/export/:id/:format

Export research results in specified format.

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Quick research completion | < 2 minutes |
| Standard research completion | < 5 minutes |
| Deep research completion | < 15 minutes |
| Exhaustive research completion | < 30 minutes |
| Sources aggregated (deep mode) | 30-50 |
| Cross-database deduplication accuracy | > 95% |
| Citation classification accuracy | > 90% |
| Synthesis factual accuracy | > 95% |
| Quality score (average) | > 85/100 |
| User satisfaction | > 4.5/5 |

---

## Dependencies

### Required Packages
```bash
npm install --legacy-peer-deps \
  eventsource-parser \
  fast-xml-parser \
  string-similarity \
  d3 \
  @visx/network \
  react-force-graph
```

### API Keys Required
- `PUBMED_API_KEY` - NCBI E-utilities
- `S2_API_KEY` - Semantic Scholar (free tier)
- `CROSSREF_MAILTO` - CrossRef polite pool

### External APIs
- PubMed E-utilities: https://eutils.ncbi.nlm.nih.gov/
- arXiv API: https://arxiv.org/help/api/
- Semantic Scholar: https://api.semanticscholar.org/
- CrossRef: https://api.crossref.org/
- Europe PMC: https://europepmc.org/RestfulWebService
- CORE: https://core.ac.uk/services/api/
