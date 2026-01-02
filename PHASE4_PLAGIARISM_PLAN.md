# Phase 4: Plagiarism Detection System - Implementation Plan

## Research Summary

Based on analysis of leading plagiarism detection tools:

### Industry Leaders Analyzed
| Tool | Database Size | Key Features |
|------|---------------|--------------|
| [Turnitin](https://www.turnitin.com/) | 99+ billion pages, 8M+ publications | Similarity reports, text manipulation detection, AI detection |
| [Copyleaks](https://copyleaks.com/api) | 60 trillion pages, 16K+ journals | API access, webhook callbacks, multi-language (100+), code detection |
| [Scribbr](https://www.scribbr.com/plagiarism-checker/) | 99.3 billion pages (Turnitin-powered) | Self-plagiarism check, quote exclusions |
| [QuillBot](https://quillbot.com/plagiarism-checker) | Large web database | Integrated paraphraser, citation generator, 100+ languages |
| [SciSpace](https://scispace.com/agents/plagiarism-checker-t1h4hdce) | Academic focus | Shingling + embedding hybrid, actionable citation cues |

### Technical Approaches
1. **N-gram Fingerprinting** - Extract overlapping word sequences, compare hashes
2. **Winnowing Algorithm** - Efficient fingerprint selection for large documents
3. **Semantic Similarity** - Word embeddings (Word2Vec) for paraphrase detection
4. **Vector Similarity** - Cosine, Jaccard coefficients for document comparison

---

## Proposed Architecture

### Hybrid Approach: Local + API

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLAGIARISM DETECTION SYSTEM                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────┐ │
│  │  LOCAL ANALYSIS  │    │   EXTERNAL API   │    │   RESULTS  │ │
│  │                  │    │                  │    │   MERGER   │ │
│  │  • N-gram match  │───▶│  • Copyleaks OR  │───▶│            │ │
│  │  • Self-plag     │    │  • PlagiarismCheck   │ • Unified   │ │
│  │  • Quote detect  │    │  • Web sources   │    │    report  │ │
│  │  • Citation check│    │  • Academic DBs  │    │            │ │
│  └──────────────────┘    └──────────────────┘    └────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Hybrid?
1. **Local Analysis** - Fast, free, works offline, catches self-plagiarism
2. **External API** - Access to massive web/academic databases
3. **Cost Control** - Only call API when needed, cache results

---

## Implementation Plan

### Phase 4A: Local Plagiarism Engine (No External API)

#### 4A.1 Core Detection Library
**Location:** `lib/plagiarism/`

```
lib/plagiarism/
├── types.ts              # Type definitions
├── fingerprint.ts        # N-gram fingerprinting & hashing
├── similarity.ts         # Similarity calculation algorithms
├── detector.ts           # Main detection orchestrator
├── self-plagiarism.ts    # Compare against user's own documents
└── citation-check.ts     # Verify quoted text has citations
```

**Key Types:**
```typescript
interface PlagiarismResult {
  overallScore: number;           // 0-100 (0 = no matches)
  originalityScore: number;       // 100 - overallScore
  matches: PlagiarismMatch[];
  selfPlagiarism: SelfPlagMatch[];
  uncitedQuotes: UncitedQuote[];
  stats: {
    totalWords: number;
    matchedWords: number;
    quotedWords: number;
    citedWords: number;
  };
}

interface PlagiarismMatch {
  id: string;
  text: string;                   // Matched text
  startOffset: number;
  endOffset: number;
  similarity: number;             // 0-100
  source: MatchSource;
  type: 'exact' | 'paraphrase' | 'mosaic';
}

interface MatchSource {
  type: 'web' | 'academic' | 'user-document' | 'internal';
  title?: string;
  url?: string;
  author?: string;
  doi?: string;
  publicationDate?: string;
}
```

#### 4A.2 N-gram Fingerprinting Engine
**Algorithm:** Winnowing with k-grams

```typescript
// Core fingerprinting approach
function generateFingerprints(text: string, k: number = 5): Fingerprint[] {
  // 1. Normalize text (lowercase, remove punctuation)
  // 2. Generate k-grams (overlapping word sequences)
  // 3. Hash each k-gram using rolling hash
  // 4. Apply winnowing to select representative fingerprints
  // 5. Return fingerprint set with positions
}

function calculateSimilarity(doc1: Fingerprint[], doc2: Fingerprint[]): number {
  // Jaccard coefficient: |intersection| / |union|
}
```

#### 4A.3 Self-Plagiarism Detection
- Compare current document against user's other documents in Firestore
- Useful for academics reusing their own content
- Highlight matches with links to original documents

#### 4A.4 Citation Verification
- Detect text in quotation marks
- Check if quoted text has corresponding citation
- Flag uncited quotes with suggestions

---

### Phase 4B: External API Integration (Optional)

#### 4B.1 API Provider Options

| Provider | Pricing | API Quality | Best For |
|----------|---------|-------------|----------|
| **Copyleaks** | Credits-based (~$0.01/page) | Excellent docs, webhooks | Production use |
| **PlagiarismCheck** | Per-check pricing | Simple REST | Budget option |
| **Eden AI** | Aggregator | Multiple providers | Flexibility |

**Recommended:** Copyleaks for production (best docs, Node.js SDK, webhooks)

#### 4B.2 API Integration Architecture

```typescript
// API wrapper with fallback
interface PlagiarismAPIProvider {
  name: string;
  submitScan(text: string): Promise<ScanId>;
  getScanResults(scanId: string): Promise<APIResult>;
  getCredits(): Promise<number>;
}

// Webhook handler for async results
// POST /api/plagiarism/webhook
```

#### 4B.3 Caching Strategy
- Cache API results in Firestore (per document version)
- Only re-check when content changes significantly
- Show cached results instantly, offer "Recheck" option

---

### Phase 4C: UI Components

#### 4C.1 Plagiarism Check Panel
**Location:** `components/plagiarism/plagiarism-panel.tsx`

Features:
- Overall originality score (circular gauge)
- Matched sources list with expandable details
- Text highlighting in editor for matched regions
- Self-plagiarism section
- Uncited quotes section

#### 4C.2 Inline Highlights
- Color-coded highlights in TipTap editor
- Red: High similarity (>80%)
- Orange: Moderate similarity (50-80%)
- Yellow: Low similarity (20-50%)
- Click highlight to see source

#### 4C.3 Report Export
- Downloadable PDF report
- Summary statistics
- Source list with URLs
- Highlighted document view

---

### Phase 4D: Academic Database Integration

#### 4D.1 Cross-Reference with Research APIs
Leverage existing research integrations:
- **PubMed** - Check against biomedical abstracts
- **arXiv** - Check against preprints
- **Semantic Scholar** - 200M+ papers
- **OpenAlex** - 250M+ works

#### 4D.2 DOI/Citation Matching
- Extract DOIs from document
- Verify citations exist in databases
- Flag potential citation fabrication

---

## File Structure

```
lib/plagiarism/
├── types.ts                    # Type definitions
├── fingerprint.ts              # N-gram fingerprinting
├── winnowing.ts                # Winnowing algorithm
├── similarity.ts               # Similarity metrics
├── detector.ts                 # Main orchestrator
├── self-plagiarism.ts          # User document comparison
├── citation-check.ts           # Quote/citation verification
├── cache.ts                    # Results caching
└── api/
    ├── copyleaks.ts            # Copyleaks API client
    └── provider.ts             # Provider interface

app/api/plagiarism/
├── check/route.ts              # Submit plagiarism check
├── results/[id]/route.ts       # Get results
└── webhook/route.ts            # API webhook handler

components/plagiarism/
├── plagiarism-panel.tsx        # Main panel component
├── plagiarism-highlights.tsx   # Editor highlight marks
├── match-card.tsx              # Individual match display
├── source-list.tsx             # Source list component
└── report-export.tsx           # Export functionality

lib/hooks/
└── use-plagiarism.ts           # React hook
```

---

## Implementation Order

### Sprint 1: Local Detection (4A) - Core
1. [ ] Create type definitions (`lib/plagiarism/types.ts`)
2. [ ] Implement n-gram fingerprinting (`lib/plagiarism/fingerprint.ts`)
3. [ ] Implement winnowing algorithm (`lib/plagiarism/winnowing.ts`)
4. [ ] Implement similarity calculation (`lib/plagiarism/similarity.ts`)
5. [ ] Build main detector (`lib/plagiarism/detector.ts`)

### Sprint 2: Local Detection (4A) - Features
6. [ ] Self-plagiarism detection (`lib/plagiarism/self-plagiarism.ts`)
7. [ ] Citation verification (`lib/plagiarism/citation-check.ts`)
8. [ ] Caching layer (`lib/plagiarism/cache.ts`)

### Sprint 3: UI Components (4C)
9. [ ] Plagiarism panel component
10. [ ] Editor highlight integration
11. [ ] Match card components
12. [ ] usePlagiarism hook

### Sprint 4: API Integration (4B) - Optional
13. [ ] Copyleaks API client
14. [ ] Webhook handler
15. [ ] API route for checks
16. [ ] Credits display

### Sprint 5: Academic Cross-Reference (4D)
17. [ ] Integration with existing research APIs
18. [ ] DOI verification
19. [ ] Report export (PDF)

---

## Technical Decisions

### 1. N-gram Size
- **Recommendation:** k=5 (5-word sequences)
- Balances between precision (catching matches) and recall (avoiding false positives)
- Configurable per-check

### 2. Similarity Threshold
```typescript
const THRESHOLDS = {
  EXACT: 95,      // Near-identical match
  HIGH: 80,       // Strong similarity
  MODERATE: 50,   // Moderate similarity
  LOW: 20,        // Low similarity (likely coincidental)
};
```

### 3. Quote Detection
- Regex for quoted text: `/"([^"]+)"|'([^']+)'|"([^"]+)"|「([^」]+)」/g`
- Check for citation within 2 sentences before/after

### 4. Performance
- Web Workers for fingerprint generation (CPU-intensive)
- Debounced analysis (5 seconds after last edit)
- Progressive loading for large documents

---

## Environment Variables

```env
# Copyleaks API (optional - for external checks)
COPYLEAKS_API_KEY=your_api_key
COPYLEAKS_EMAIL=your_email

# Or alternative provider
PLAGIARISM_CHECK_API_KEY=your_key
```

---

## Comparison to Competitors

| Feature | Our Implementation | Turnitin | Copyleaks |
|---------|-------------------|----------|-----------|
| Local analysis | ✅ | ❌ | ❌ |
| Self-plagiarism | ✅ | ✅ | ✅ |
| Citation check | ✅ | ❌ | ❌ |
| Academic DBs | ✅ (via existing APIs) | ✅ | ✅ |
| Offline capable | ✅ (local only) | ❌ | ❌ |
| Cost | Free (local) / Pay (API) | Institutional | Credits |
| Privacy | Text stays local | Uploaded | Uploaded |

---

## Risk Mitigation

### 1. False Positives
- Allow users to exclude common phrases, quotes, references
- Provide "Ignore this match" option
- Show context for human judgment

### 2. API Costs
- Clear credit display
- Confirmation before API checks
- Cache aggressively

### 3. Privacy Concerns
- Local-first approach
- Clear disclosure when using external API
- Option to use local-only mode

---

## Success Metrics

1. **Accuracy:** <5% false positive rate on test corpus
2. **Speed:** <3 seconds for local check on 5000-word document
3. **Usability:** Clear, actionable results
4. **Coverage:** Detect exact, paraphrase, and mosaic plagiarism

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 4A: Local Engine | 2-3 sessions | None |
| 4B: API Integration | 1-2 sessions | API key |
| 4C: UI Components | 1-2 sessions | 4A complete |
| 4D: Academic DBs | 1 session | Existing research APIs |

**Total:** 5-8 development sessions

---

## Questions for User

1. **API Provider:** Do you have a preference for external API (Copyleaks, PlagiarismCheck, or other)?
2. **Local-First:** Should we start with local-only (free) and add API later?
3. **Self-Plagiarism:** Is checking against user's own documents a priority?
4. **Citation Check:** Should uncited quotes be flagged as potential plagiarism?
5. **Report Format:** PDF report needed, or just in-app display?

---

**Created:** January 2, 2026
**Status:** Plan Ready for Review
