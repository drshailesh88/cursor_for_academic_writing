# Implementation Plan: Connected Papers Discovery

**Branch**: `003-connected-papers` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-connected-papers/spec.md`

## Summary

Build a Research Rabbit-inspired feature that discovers related papers based on the user's draft content and existing citations. The system will analyze document content to extract key concepts, search for related papers, explain why each recommendation is relevant, and allow users to add recommended papers directly to their manuscript.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**: Existing PubMed client, Vercel AI SDK for concept extraction
**Storage**: Firebase Firestore (recommendations cache)
**Testing**: Manual testing with academic documents
**Target Platform**: Web application (Next.js)
**Project Type**: Web application - extend existing three-panel layout
**Performance Goals**: Recommendations in < 10 seconds, relevance > 80%
**Constraints**: Rate limiting for PubMed, avoid redundant searches
**Scale/Scope**: 5-10 recommendations per request, cache for 24 hours

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Academic Excellence First | PASS | Recommendations enhance research quality |
| Citation Integrity | PASS | All recommendations include proper citation data |
| Multi-LLM Flexibility | PASS | Use existing model for concept extraction |
| Firebase-First Architecture | PASS | Cache recommendations in Firestore |
| Simplicity Over Complexity | PASS | Build on existing PubMed integration |

## Project Structure

### Documentation (this feature)

```text
specs/003-connected-papers/
├── spec.md              # Feature specification
├── plan.md              # This file
└── tasks.md             # Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
# New files to create
lib/
├── recommendations/
│   ├── concept-extractor.ts     # Extract key concepts from text
│   ├── recommendation-engine.ts # Generate paper recommendations
│   ├── relevance-scorer.ts      # Score and explain relevance
│   └── citation-analyzer.ts     # Analyze existing citations

components/
├── recommendations/
│   ├── recommendations-panel.tsx    # Main recommendations UI
│   ├── paper-card.tsx              # Individual paper recommendation
│   ├── relevance-badge.tsx         # Show relevance score/explanation
│   ├── connection-viewer.tsx       # Show paper connections
│   └── add-citation-button.tsx     # Add paper to document

app/api/
├── recommendations/
│   └── route.ts                    # Recommendations API endpoint

# Files to modify
lib/firebase/
├── schema.ts                    # Add RecommendationCache type

lib/pubmed/
├── client.ts                    # Add related papers search

components/layout/
├── three-panel-layout.tsx       # Add recommendations panel
```

**Structure Decision**: Extend existing web application. Recommendation logic in `lib/recommendations/`, UI in `components/recommendations/`, API in `app/api/recommendations/`.

## Implementation Phases

### Phase 1: Core Recommendations (P1 - MVP)

**Goal**: User can get paper recommendations based on document content

**Components**:
1. **Concept Extractor** (`lib/recommendations/concept-extractor.ts`)
   - Accept document content as input
   - Use AI to extract key concepts, terms, and topics
   - Return structured list of concepts with weights
   - Handle both short and long documents

2. **Recommendation Engine** (`lib/recommendations/recommendation-engine.ts`)
   - Accept concepts and existing citations
   - Build PubMed search queries from concepts
   - Search for relevant papers
   - Filter out already-cited papers
   - Return ranked list of recommendations

3. **Relevance Scorer** (`lib/recommendations/relevance-scorer.ts`)
   - Calculate relevance score (0-100) for each paper
   - Generate human-readable explanation
   - Consider: keyword match, citation overlap, recency, impact
   - Return scored and explained recommendations

4. **Recommendations API** (`app/api/recommendations/route.ts`)
   - POST endpoint accepting documentContent, existingCitations
   - Extract concepts → Search → Score → Return
   - Cache results in Firestore for 24 hours

5. **Recommendations Panel UI** (`components/recommendations/recommendations-panel.tsx`)
   - "Find Related Papers" button
   - Progress indicator during search
   - List of paper cards with relevance scores
   - Settings toggle for auto-suggest

6. **Paper Card** (`components/recommendations/paper-card.tsx`)
   - Display title, authors, year, journal
   - Relevance score badge with tooltip explanation
   - "Add Citation" button
   - Expandable abstract view

### Phase 2: Citation Actions (P1 - MVP Part 2)

**Goal**: User can add recommended papers to their document

**Components**:
1. **Add Citation Button** (`components/recommendations/add-citation-button.tsx`)
   - "Add Citation" - Insert author-year citation at cursor
   - "Insert with Summary" - Insert brief summary + citation
   - Generate proper citation format

2. **Citation Integration**
   - Interface with TipTap editor for insertion
   - Update document's citation list
   - Prevent duplicate citations

### Phase 3: Paper Connections (P2)

**Goal**: User can explore how papers relate to each other

**Components**:
1. **Citation Analyzer** (`lib/recommendations/citation-analyzer.ts`)
   - For a given paper (PMID), find papers it cites
   - Find papers that cite it
   - Use PubMed's related articles feature
   - Return connection network

2. **Connection Viewer** (`components/recommendations/connection-viewer.tsx`)
   - Simple list view of connected papers
   - Two tabs: "Papers citing this" and "Papers this cites"
   - Click to view abstract and add citation

### Phase 4: Auto-Suggest (P2)

**Goal**: Recommendations update automatically as user writes

**Components**:
1. **Debounced Content Watcher**
   - Watch document content changes
   - Debounce with 30-second delay
   - Trigger recommendation refresh

2. **Settings Toggle**
   - Enable/disable auto-suggest
   - Store preference in user settings

3. **Incremental Updates**
   - Compare new concepts to cached concepts
   - Only re-search if significant changes
   - Merge new recommendations with existing

## Data Model

### RecommendationCache (Firestore)

```typescript
interface RecommendationCache {
  id: string;
  documentId: string;
  userId: string;

  // Extracted concepts
  concepts: ExtractedConcept[];

  // Recommendations
  recommendations: PaperRecommendation[];

  // Cache metadata
  createdAt: Timestamp;
  expiresAt: Timestamp;         // createdAt + 24 hours
  contentHash: string;          // Hash of source content
}

interface ExtractedConcept {
  term: string;
  weight: number;               // 0-1, importance
  category: 'topic' | 'method' | 'disease' | 'intervention' | 'outcome';
}

interface PaperRecommendation {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  doi?: string;

  // Relevance
  relevanceScore: number;       // 0-100
  relevanceExplanation: string; // "Matches topics: AI, radiology; cites 2 of your references"
  relevanceFactors: {
    topicMatch: number;
    citationOverlap: number;
    recency: number;
    methodMatch: number;
  };

  // Connection type
  connectionType: 'topic_match' | 'cites_your_ref' | 'cited_by_your_ref' | 'same_author';
}
```

### Firestore Collection Structure

```
users/{userId}/recommendationCaches/{documentId}
```

## API Contract

### POST /api/recommendations

**Request**:
```typescript
{
  documentId: string;
  documentContent: string;       // HTML or plain text
  existingCitations: {
    pmids: string[];
    otherCitations: string[];   // For matching by title/author
  };
  options?: {
    maxResults?: number;        // Default 10
    dateRange?: { startYear: number; endYear: number };
    forceRefresh?: boolean;     // Bypass cache
  };
}
```

**Response**:
```typescript
{
  recommendations: PaperRecommendation[];
  concepts: ExtractedConcept[];
  cached: boolean;
  cacheExpiresAt: string;
}
```

### GET /api/recommendations/connections

**Request Query**:
```
pmid: string
type: 'citing' | 'cited_by' | 'related'
```

**Response**:
```typescript
{
  connections: {
    pmid: string;
    title: string;
    authors: string[];
    year: number;
    connectionType: string;
  }[];
}
```

## UI Integration

### Three-Panel Layout Enhancement

Add "Related Papers" as a tab or section within the right panel. Can be:
1. **Tab alongside Chat**: Switch between Chat and Recommendations
2. **Collapsible section**: Below chat interface
3. **Icon button**: Opens recommendations in a slide-out panel

**Recommended**: Tab alongside Chat for equal prominence

### Recommendation Flow

```
1. User is writing in editor
2. User clicks "Find Related Papers" tab/button
3. System extracts concepts from document (2-3 seconds)
4. System searches PubMed and scores results (5-7 seconds)
5. Recommendations appear as cards with scores
6. User hovers over score → Sees explanation tooltip
7. User expands paper → Sees abstract
8. User clicks "Add Citation" → Citation inserted in document
9. User clicks "Show Connections" → Sees citing/cited papers
```

### Auto-Suggest Flow (when enabled)

```
1. User writes new paragraph (100+ words since last analysis)
2. After 30 seconds of no changes:
   a. System re-extracts concepts
   b. Compares to cached concepts
   c. If significant change: refreshes recommendations
   d. New papers highlighted with "New" badge
```

## Dependencies

### Existing (no changes needed)
- `lib/pubmed/client.ts` - PubMed search functionality
- `@ai-sdk/*` packages - AI for concept extraction
- `firebase` - Firestore for caching

### PubMed Client Enhancements

Add to existing `lib/pubmed/client.ts`:
```typescript
// Get papers that cite a given PMID
async function getCitingPapers(pmid: string): Promise<PubMedArticle[]>

// Get related papers using PubMed's elink
async function getRelatedPapers(pmid: string): Promise<PubMedArticle[]>
```

## Concept Extraction Prompt

```typescript
const CONCEPT_EXTRACTION_PROMPT = `
Analyze the following academic document and extract key concepts.

For each concept, provide:
1. The term or phrase
2. A weight from 0-1 indicating importance
3. Category: topic, method, disease, intervention, or outcome

Return as JSON array. Focus on:
- Main research topics and themes
- Methodological approaches mentioned
- Diseases, conditions, or populations studied
- Interventions or treatments discussed
- Outcome measures or endpoints

Document:
{content}
`;
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Irrelevant recommendations | Strong concept extraction, user feedback loop |
| Too many API calls | 24-hour cache, content hash comparison |
| Slow response times | Show progress, load incrementally |
| PubMed rate limits | Batch queries, respect 10 req/sec limit |
| Short documents | Minimum 100 words, fallback to title-based search |

## Success Metrics

- Recommendations generated in < 10 seconds
- 80% of recommendations rated "relevant" by users
- Users add 1+ recommended paper per 10 sessions
- Relevance explanations rated "helpful" by 75% of users
- Auto-suggest updates complete in < 10 seconds
