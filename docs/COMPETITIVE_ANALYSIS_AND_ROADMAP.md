# Competitive Analysis & Product Roadmap

**Date:** January 2, 2026
**Document Type:** Specification-Driven Development (SDD)
**Status:** Strategic Planning

---

## Executive Summary

This document provides a head-to-head comparison of our Academic Writing Platform against four major competitors: **Paperpal**, **Elicit**, **SciSpace**, and **Jenni.ai**. Based on this analysis, we propose a strategic roadmap to extend our platform to serve **all science disciplines** while building features that differentiate us in the market.

---

## 1. Head-to-Head Feature Comparison

### 1.1 Feature Matrix

| Feature Category | Our Platform | Paperpal | Elicit | SciSpace | Jenni.ai |
|-----------------|--------------|----------|--------|----------|----------|
| **RESEARCH & DISCOVERY** |
| Paper Database Access | PubMed only | 250M+ articles | 138M+ papers | 280M+ papers | No native search |
| Semantic Search | ❌ | ✅ | ✅ | ✅ | ❌ |
| Clinical Trials Database | ❌ | ❌ | ✅ (545K trials) | ❌ | ❌ |
| AI Research Agent | ❌ | ❌ | ✅ | ✅ (Deep Review) | ❌ |
| Literature Review Automation | ❌ | ❌ | ✅ (Systematic) | ✅ (Deep Review) | ❌ |
| PDF Chat/Analysis | ❌ | ✅ | ✅ | ✅ (CoPilot) | ✅ |
| **WRITING & EDITING** |
| Rich Text Editor | ✅ TipTap | ✅ Web + Plugins | ❌ | ✅ | ✅ |
| AI Autocomplete | ❌ | ✅ | ❌ | ✅ | ✅ |
| Grammar/Language Check | ❌ | ✅ (3x better) | ❌ | ❌ | ❌ |
| Consistency Checker | ❌ | ✅ | ❌ | ❌ | ❌ |
| Academic Translation | ❌ | ✅ (28 languages) | ❌ | ❌ | ❌ |
| Templates | ✅ (6 academic) | ✅ | ❌ | ❌ | ❌ |
| **CITATIONS & REFERENCES** |
| Citation Styles | Author-year only | 10,000+ styles | N/A | ✅ | 2,600+ styles |
| Auto-citation from Search | ✅ (PubMed) | ✅ | ✅ | ✅ | ❌ |
| Citation Manager Integration | ❌ | ❌ | ❌ | ❌ | ❌ (PDF upload) |
| Reference List Generation | ❌ | ✅ | ✅ | ✅ | ✅ |
| **AI MODELS** |
| Multi-LLM Support | ✅ (14 models) | Proprietary | Proprietary | Proprietary | Proprietary |
| Free Model Options | ✅ (11 free) | Limited | Limited | Limited | 200 words/day |
| Model Transparency | ✅ | ❌ | ✅ | ❌ | ❌ |
| **EXPORT & INTEGRATION** |
| DOCX Export | ✅ | ✅ | ❌ | ❌ | ✅ |
| PDF Export | ✅ | ✅ | ❌ | ❌ | ❌ |
| LaTeX Export | ❌ | ✅ (Overleaf) | ❌ | ❌ | ✅ |
| Word Plugin | ❌ | ✅ | ❌ | ❌ | ❌ |
| Google Docs Plugin | ❌ | ✅ | ❌ | ❌ | ❌ |
| **COMPLIANCE & QUALITY** |
| Plagiarism Check | ❌ | ✅ (Turnitin) | ❌ | ✅ | ❌ |
| AI Content Detection | ❌ | ✅ | ❌ | ✅ | ❌ |
| Journal Compliance Check | ❌ | ✅ (30+ checks) | ❌ | ❌ | ❌ |
| **COLLABORATION** |
| Real-time Collaboration | ❌ | ❌ | ✅ (Premium) | ❌ | ❌ |
| Team Features | ❌ | ❌ | ✅ | ❌ | ❌ |
| **PLATFORM** |
| Mobile Responsive | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dark Mode | ✅ | ❌ | ❌ | ❌ | ❌ |
| Offline Support | ❌ | ❌ | ❌ | ❌ | ❌ |
| Auto-save | ✅ (30s) | ✅ | ✅ | ✅ | ✅ |
| **PRICING** |
| Free Tier | ✅ (Unlimited*) | 5 uses/day | Limited | Generous | 200 words/day |
| Paid Plans | TBD | $139/year | $10/month | $12/month | $20/month |

*Unlimited with free OpenRouter models

---

## 2. Strengths & Weaknesses Analysis

### 2.1 Our Strengths

| Strength | Details | Competitive Advantage |
|----------|---------|----------------------|
| **Multi-LLM Freedom** | 14 models including 11 free options | Users aren't locked to one AI provider |
| **Model Transparency** | Users choose and see which AI they use | Trust and control over AI interactions |
| **Open Architecture** | Self-hostable, customizable | Enterprise/institutional deployment |
| **Academic Templates** | 6 discipline-specific templates | Faster document starts |
| **Dark Mode + Mobile** | Full responsive design | Better UX than most competitors |
| **Real-time Firebase Sync** | Cloud-native with auto-save | Reliable document persistence |
| **PubMed Integration** | Native research search with citations | Medical/life sciences focus |
| **Cost Efficiency** | Free tier with real capabilities | Accessible to students/researchers |

### 2.2 Our Weaknesses

| Weakness | Impact | Priority |
|----------|--------|----------|
| **Limited Database Access** | Only PubMed (life sciences focus) | 🔴 Critical |
| **No Semantic Search** | Can't find conceptually related papers | 🔴 Critical |
| **No PDF Analysis** | Can't chat with uploaded papers | 🔴 Critical |
| **No Literature Review Automation** | Manual synthesis required | 🟠 High |
| **No AI Autocomplete** | Writing assistance limited to chat | 🟠 High |
| **No Grammar/Language Check** | Users need external tools | 🟠 High |
| **Single Citation Style** | Only author-year format | 🟠 High |
| **No Plagiarism Check** | Compliance risk for users | 🟡 Medium |
| **No LaTeX Export** | STEM users need workarounds | 🟡 Medium |
| **No External Integrations** | No Word/Docs/Overleaf plugins | 🟡 Medium |

### 2.3 Competitor-Specific Analysis

#### Paperpal
- **Strengths:** Best-in-class language editing, journal compliance checks, Turnitin integration
- **Weaknesses:** No multi-LLM, expensive, closed ecosystem
- **Threat Level:** 🟠 High for editing-focused users

#### Elicit
- **Strengths:** Best systematic review tooling, clinical trials access, team features
- **Weaknesses:** No writing editor, no export, research-only focus
- **Threat Level:** 🟡 Medium (different use case)

#### SciSpace
- **Strengths:** Massive database (280M), Deep Review AI agent, generous free tier
- **Weaknesses:** Writing features less developed, no real-time collab
- **Threat Level:** 🔴 High for literature review

#### Jenni.ai
- **Strengths:** Best autocomplete, many citation styles, LaTeX export
- **Weaknesses:** No research database, plagiarism concerns, expensive
- **Threat Level:** 🟠 High for writing-focused users

---

## 3. Strategic Positioning

### 3.1 Our Unique Value Proposition

> **"The open, multi-AI academic writing platform that gives researchers control over their tools, their data, and their budget."**

### 3.2 Target Differentiators

1. **AI Model Freedom** - No vendor lock-in, use any LLM
2. **Cost Accessibility** - Powerful free tier with 11 AI models
3. **Self-Hosting Option** - Institutions can deploy privately
4. **Discipline Agnostic** - Works for any science field
5. **Transparent AI** - Users know exactly what AI is used

---

## 4. Multi-Discipline Extension Strategy

### 4.1 Current State: Life Sciences Focus
- PubMed only (biomedical)
- Templates focused on clinical research
- Medical writing prompts

### 4.2 Target State: All Sciences Platform

#### Database Integration Roadmap

| Database | Discipline Coverage | Priority | API Availability |
|----------|-------------------|----------|------------------|
| **arXiv** | Physics, Math, CS, Stats, Bio | 🔴 P0 | ✅ Free API |
| **Semantic Scholar** | All sciences (200M+ papers) | 🔴 P0 | ✅ Free API |
| **CrossRef** | All academic (130M+ DOIs) | 🟠 P1 | ✅ Free API |
| **IEEE Xplore** | Engineering, CS | 🟠 P1 | 💰 Paid API |
| **ADS (NASA)** | Astronomy, Astrophysics | 🟡 P2 | ✅ Free API |
| **ChemRxiv** | Chemistry | 🟡 P2 | ✅ Free API |
| **SSRN** | Social Sciences | 🟡 P2 | Limited |
| **EconLit** | Economics | 🟢 P3 | 💰 Paid |
| **PsycINFO** | Psychology | 🟢 P3 | 💰 Paid |

#### Discipline-Specific Templates

| Discipline | Template Types |
|------------|---------------|
| **Physics/Math** | Research Article, Conference Paper, Thesis Chapter, Problem Set |
| **Computer Science** | Technical Report, Algorithm Paper, System Design, API Docs |
| **Chemistry** | Synthesis Report, Analytical Method, Safety Protocol |
| **Engineering** | Design Document, Feasibility Study, Technical Specification |
| **Earth Sciences** | Field Report, Environmental Assessment, Data Analysis |
| **Social Sciences** | Survey Study, Qualitative Analysis, Policy Brief |
| **Economics** | Working Paper, Economic Analysis, Market Research |

#### Writing Style Adaptations

```typescript
// Discipline-specific writing systems
interface DisciplineConfig {
  id: string;
  name: string;
  databases: string[];
  citationStyle: string;
  terminology: string[];
  conventions: WritingConvention[];
  templates: Template[];
  prompts: SystemPrompt[];
}

const DISCIPLINES: DisciplineConfig[] = [
  {
    id: 'physics',
    name: 'Physics & Astronomy',
    databases: ['arxiv', 'ads', 'semantic-scholar'],
    citationStyle: 'APS', // American Physical Society
    terminology: ['quantum', 'relativistic', 'spectroscopic'...],
    conventions: [...],
  },
  {
    id: 'cs',
    name: 'Computer Science',
    databases: ['arxiv', 'semantic-scholar', 'ieee'],
    citationStyle: 'IEEE',
    terminology: ['algorithm', 'complexity', 'architecture'...],
    conventions: [...],
  },
  // ... more disciplines
];
```

---

## 5. SDD Feature Specifications

### 5.1 Priority 0 (Critical) Features

#### SPEC-001: Multi-Database Search Integration

**Objective:** Enable searching across multiple academic databases beyond PubMed

**Specification:**
```typescript
// lib/research/unified-search.ts

interface UnifiedSearchOptions {
  query: string;
  databases: ('pubmed' | 'arxiv' | 'semantic-scholar' | 'crossref')[];
  maxResults?: number;
  dateRange?: { start: Date; end: Date };
  disciplines?: string[];
  openAccessOnly?: boolean;
}

interface UnifiedSearchResult {
  id: string;
  source: string;
  title: string;
  authors: Author[];
  abstract: string;
  year: number;
  doi?: string;
  url: string;
  citation: string;
  pdfUrl?: string;
  openAccess: boolean;
  citationCount?: number;
}

async function unifiedSearch(options: UnifiedSearchOptions): Promise<{
  results: UnifiedSearchResult[];
  totalBySource: Record<string, number>;
  deduplicated: number;
}>;
```

**Implementation Steps:**
1. Create database clients: `lib/research/arxiv.ts`, `lib/research/semantic-scholar.ts`, `lib/research/crossref.ts`
2. Implement unified search aggregator with deduplication
3. Add discipline-based database recommendations
4. Update chat tool to use unified search
5. Add UI for database selection

**Acceptance Criteria:**
- [ ] Search returns results from at least 3 databases
- [ ] Results are deduplicated by DOI
- [ ] Discipline selection auto-suggests relevant databases
- [ ] Response time < 3 seconds for combined search

---

#### SPEC-002: PDF Upload and Analysis

**Objective:** Allow users to upload PDFs and chat with their content

**Specification:**
```typescript
// lib/pdf/analyzer.ts

interface PDFAnalysis {
  id: string;
  filename: string;
  text: string;
  sections: PDFSection[];
  figures: PDFFigure[];
  tables: PDFTable[];
  references: Reference[];
  metadata: {
    title?: string;
    authors?: string[];
    abstract?: string;
    doi?: string;
  };
  embeddings?: number[][]; // For semantic search
}

interface PDFSection {
  title: string;
  content: string;
  pageNumbers: number[];
  type: 'abstract' | 'introduction' | 'methods' | 'results' | 'discussion' | 'references' | 'other';
}

async function analyzePDF(file: File): Promise<PDFAnalysis>;
async function chatWithPDF(pdfId: string, question: string): Promise<{
  answer: string;
  citations: { section: string; page: number; text: string }[];
}>;
```

**Implementation Steps:**
1. Add PDF.js for client-side parsing
2. Implement section detection using ML
3. Store parsed content in Firestore
4. Add RAG (Retrieval-Augmented Generation) for Q&A
5. Create PDF viewer with chat interface

**Acceptance Criteria:**
- [ ] PDF upload accepts files up to 50MB
- [ ] Section detection accuracy > 85%
- [ ] Chat responses cite specific pages/sections
- [ ] Supports at least 10 PDFs per user (free tier)

---

#### SPEC-003: Semantic Search with Embeddings

**Objective:** Find conceptually related papers, not just keyword matches

**Specification:**
```typescript
// lib/search/semantic.ts

interface SemanticSearchOptions {
  query: string;
  topK?: number;
  minSimilarity?: number;
  filters?: {
    year?: { min: number; max: number };
    disciplines?: string[];
    openAccess?: boolean;
  };
}

interface SemanticSearchResult extends UnifiedSearchResult {
  similarity: number;
  matchedConcepts: string[];
}

async function semanticSearch(options: SemanticSearchOptions): Promise<SemanticSearchResult[]>;
async function findRelatedPapers(paperId: string): Promise<SemanticSearchResult[]>;
async function conceptualGap(papers: string[]): Promise<{
  gaps: string[];
  suggestedQueries: string[];
}>;
```

**Implementation Steps:**
1. Integrate embedding model (OpenAI embeddings or open-source)
2. Build vector index for paper abstracts
3. Implement similarity search
4. Add concept extraction
5. Create "related papers" UI component

**Acceptance Criteria:**
- [ ] Returns conceptually related papers beyond keyword match
- [ ] Similarity scores are meaningful (0-1 scale)
- [ ] Response time < 2 seconds
- [ ] Works offline with cached embeddings

---

### 5.2 Priority 1 (High) Features

#### SPEC-004: AI Writing Autocomplete

**Objective:** Provide inline writing suggestions as users type

**Specification:**
```typescript
// lib/editor/autocomplete.ts

interface AutocompleteConfig {
  enabled: boolean;
  triggerDelay: number; // ms to wait before suggesting
  maxSuggestions: number;
  discipline: string;
  citationStyle: string;
  contextWindow: number; // characters of context
}

interface Suggestion {
  text: string;
  confidence: number;
  type: 'sentence' | 'paragraph' | 'citation' | 'term';
}

async function getAutocompleteSuggestions(
  context: string,
  config: AutocompleteConfig
): Promise<Suggestion[]>;
```

**Implementation Steps:**
1. Add debounced trigger in TipTap editor
2. Create lightweight prompt for completions
3. Implement ghost text preview
4. Add Tab to accept, Escape to dismiss
5. Store user preferences

---

#### SPEC-005: Multi-Style Citation System

**Objective:** Support multiple citation formats (APA, MLA, Chicago, IEEE, Vancouver, etc.)

**Specification:**
```typescript
// lib/citations/formatter.ts

type CitationStyle =
  | 'apa7' | 'apa6'
  | 'mla9' | 'mla8'
  | 'chicago-author-date' | 'chicago-notes'
  | 'ieee' | 'acm'
  | 'vancouver' | 'harvard'
  | 'ama' | 'asa'
  | 'custom';

interface CitationFormatter {
  formatInText(ref: Reference, position: 'parenthetical' | 'narrative'): string;
  formatReference(ref: Reference): string;
  formatBibliography(refs: Reference[]): string;
}

function getCitationFormatter(style: CitationStyle): CitationFormatter;
```

**Implementation Steps:**
1. Integrate citation.js or citeproc-js library
2. Create style selection UI
3. Implement in-text citation insertion
4. Build reference list generator
5. Add export with formatted references

---

#### SPEC-006: Grammar and Language Enhancement

**Objective:** Provide academic writing quality checks

**Specification:**
```typescript
// lib/language/checker.ts

interface LanguageIssue {
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'academic-tone';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  range: { start: number; end: number };
  suggestions: string[];
  rule: string;
}

interface LanguageCheckResult {
  issues: LanguageIssue[];
  score: number; // 0-100
  metrics: {
    readability: number;
    academicTone: number;
    clarity: number;
    conciseness: number;
  };
}

async function checkLanguage(text: string, discipline: string): Promise<LanguageCheckResult>;
```

**Implementation Steps:**
1. Integrate LanguageTool API or similar
2. Add academic-specific rules
3. Create inline issue highlighting
4. Build fix suggestion popover
5. Add document-level metrics panel

---

### 5.3 Priority 2 (Medium) Features

#### SPEC-007: Literature Review Assistant

**Objective:** Help users synthesize multiple papers into coherent reviews

**Specification:**
```typescript
// lib/review/assistant.ts

interface LiteratureReviewRequest {
  papers: string[]; // DOIs or internal IDs
  question: string;
  type: 'narrative' | 'systematic' | 'scoping' | 'meta-analysis';
  sections?: string[]; // e.g., ['introduction', 'methods', 'findings']
}

interface LiteratureReviewResult {
  synthesis: string;
  themes: { name: string; papers: string[]; summary: string }[];
  gaps: string[];
  conflicts: { description: string; papers: string[] }[];
  timeline: { year: number; developments: string[] }[];
  citations: { paperId: string; usedFor: string }[];
}

async function generateLiteratureReview(request: LiteratureReviewRequest): Promise<LiteratureReviewResult>;
```

---

#### SPEC-008: LaTeX Export

**Objective:** Export documents in LaTeX format for STEM workflows

**Specification:**
```typescript
// lib/export/latex.ts

interface LaTeXExportOptions {
  documentClass: 'article' | 'report' | 'book' | 'custom';
  template?: string; // Custom template name
  bibliography: boolean;
  bibStyle: string;
  packages: string[];
}

async function exportToLaTeX(
  content: string,
  options: LaTeXExportOptions
): Promise<{ tex: string; bib?: string }>;
```

---

#### SPEC-009: Plagiarism and AI Detection

**Objective:** Check content for originality and AI-generated text

**Specification:**
```typescript
// lib/compliance/checker.ts

interface OriginalityCheckResult {
  overallScore: number; // 0-100 (100 = fully original)
  aiScore: number; // 0-100 (100 = fully human)
  matches: {
    text: string;
    source: string;
    similarity: number;
    url?: string;
  }[];
  recommendations: string[];
}

async function checkOriginality(text: string): Promise<OriginalityCheckResult>;
```

---

### 5.4 Priority 3 (Nice to Have) Features

- **SPEC-010:** Real-time Collaboration (WebSocket-based)
- **SPEC-011:** Browser Extensions (Chrome, Firefox)
- **SPEC-012:** Offline Support (PWA with IndexedDB)
- **SPEC-013:** Citation Manager Sync (Zotero, Mendeley API)
- **SPEC-014:** Voice Dictation
- **SPEC-015:** Equation Editor (LaTeX math rendering)

---

## 6. Implementation Phases

### Phase 1: Research Foundation (Weeks 1-4)
- [ ] SPEC-001: Multi-database search (arXiv, Semantic Scholar)
- [ ] SPEC-003: Basic semantic search
- [ ] Discipline selection UI
- [ ] 10+ new templates for non-medical sciences

### Phase 2: Document Intelligence (Weeks 5-8)
- [ ] SPEC-002: PDF upload and analysis
- [ ] SPEC-005: Multi-style citations
- [ ] Reference list generation
- [ ] Document library management

### Phase 3: Writing Enhancement (Weeks 9-12)
- [ ] SPEC-004: AI autocomplete
- [ ] SPEC-006: Grammar checking
- [ ] Writing metrics dashboard
- [ ] Academic tone analyzer

### Phase 4: Advanced Research (Weeks 13-16)
- [ ] SPEC-007: Literature review assistant
- [ ] SPEC-008: LaTeX export
- [ ] Research alerts
- [ ] Paper recommendations

### Phase 5: Compliance & Polish (Weeks 17-20)
- [ ] SPEC-009: Plagiarism/AI detection
- [ ] Journal submission checker
- [ ] Performance optimization
- [ ] Mobile app (React Native)

---

## 7. Success Metrics

| Metric | Current | Target (6 months) |
|--------|---------|-------------------|
| Database coverage | 1 (PubMed) | 4+ (arXiv, Semantic Scholar, CrossRef, PubMed) |
| Disciplines supported | 1 (Life Sciences) | 8+ |
| Citation styles | 1 | 20+ |
| Templates | 6 | 30+ |
| PDF analysis capability | ❌ | ✅ |
| Semantic search | ❌ | ✅ |
| AI autocomplete | ❌ | ✅ |
| User retention (30-day) | TBD | >40% |
| NPS Score | TBD | >50 |

---

## 8. Competitive Response Strategy

### If Paperpal adds multi-LLM:
→ Emphasize our open-source option and institutional deployment

### If Elicit adds writing:
→ Emphasize our superior editor and export capabilities

### If SciSpace adds better writing:
→ Emphasize our model choice and cost advantage

### If Jenni.ai adds research:
→ Emphasize our free tier and systematic review potential

---

## 9. Sources

- [Paperpal - AI Academic Writing Tool](https://paperpal.com/)
- [Elicit - AI Research Assistant](https://elicit.com/)
- [SciSpace - AI Research Agent](https://scispace.com/)
- [Jenni AI - Academic Writer](https://jenni.ai/)
- [Paperpal 2025 Review - The Effortless Academic](https://effortlessacademic.com/paperpal-an-academic-writing-assistant/)
- [Elicit AI Review 2025 - Skywork](https://skywork.ai/skypage/en/Elicit-AI-Review-(2025):-The-Ultimate-Guide-to-the-AI-Research-Assistant/1974387953557499904)
- [SciSpace 2025 Review - The Effortless Academic](https://effortlessacademic.com/scispace-an-all-in-one-ai-tool-for-literature-reviews/)
- [Jenni AI Review 2025 - Skywork](https://skywork.ai/blog/jenni-ai-review-2025-academic-writing-citation-comparison/)

---

**Document Status:** Draft
**Last Updated:** January 2, 2026
**Next Review:** After Phase 1 completion
