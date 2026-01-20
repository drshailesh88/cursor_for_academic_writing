# Comprehensive Test Suite Specification

**Feature ID:** 005
**Version:** 1.0
**Date:** 2026-01-04
**Priority:** P0 - Critical
**Philosophy:** "A buggy app is not habit-forming. Edge cases win or lose against competition."

---

## 1. Overview

### 1.1 Purpose
Build a comprehensive test suite that validates every feature, edge case, and user flow in the Academic Writing Platform. Tests should catch bugs before users do, enable confident refactoring, and serve as living documentation.

### 1.2 Testing Philosophy
- **Test everything that could break**
- **Edge cases are not optional** - they're where competition is won or lost
- **Academic reputation depends on reliability** - wrong citations or lost work are unacceptable
- **Tests are the safety net** - they reveal existing bugs, not create new ones

### 1.3 Coverage Goals
| Category | Target Coverage | Rationale |
|----------|----------------|-----------|
| Core Infrastructure | 95%+ | Auth, save, load - cannot fail |
| Citation Formatting | 100% | Wrong citations damage academic reputation |
| Export Systems | 90%+ | Corrupted files are unacceptable |
| Content Extraction | 85%+ | Statistical detection must be reliable |
| UI Components | 70%+ | Visual bugs are less critical than data bugs |

---

## 2. Testing Stack

### 2.1 Technologies
```
jest                    - Test runner
@testing-library/react  - React component testing
@testing-library/jest-dom - DOM matchers
jest-environment-jsdom  - Browser environment simulation
ts-jest                 - TypeScript support
msw                     - API mocking (Mock Service Worker)
@faker-js/faker         - Test data generation
```

### 2.2 Test Types
| Type | Purpose | Location | Run Time |
|------|---------|----------|----------|
| Unit | Test individual functions | `__tests__/unit/` | Fast (<1s each) |
| Integration | Test component interactions | `__tests__/integration/` | Medium (1-5s) |
| E2E | Test full user flows | `__tests__/e2e/` | Slow (5-30s) |

### 2.3 Directory Structure
```
__tests__/
├── setup.ts                    # Global test setup
├── mocks/
│   ├── supabase.ts             # Supabase mock
│   ├── api-handlers.ts         # MSW handlers
│   └── test-data.ts            # Faker-based test data
├── unit/
│   ├── supabase/
│   ├── citations/
│   ├── research/
│   ├── writing-analysis/
│   ├── plagiarism/
│   ├── presentations/
│   └── export/
├── integration/
│   ├── auth-flow.test.tsx
│   ├── document-crud.test.tsx
│   ├── citation-workflow.test.tsx
│   └── presentation-generation.test.tsx
└── e2e/
    ├── user-journey.test.tsx
    └── export-workflow.test.tsx
```

---

## 3. Test Categories by Phase

### Phase 0: Core Infrastructure (CRITICAL)

#### 3.0.1 Supabase Authentication
```typescript
// Test cases for lib/supabase/auth.ts
describe('Supabase Authentication', () => {
  // Happy path
  test('signs in with Google successfully')
  test('signs out successfully')
  test('persists auth state across page reload')
  test('creates user profile on first sign-in')
  test('updates lastLogin on subsequent sign-ins')

  // Edge cases
  test('handles Google sign-in popup blocked')
  test('handles network failure during sign-in')
  test('handles Supabase quota exceeded')
  test('handles invalid/expired tokens')
  test('handles concurrent sign-in attempts')
  test('cleans up listeners on unmount')

  // Security
  test('does not expose sensitive auth data')
  test('validates user object structure')
});
```

#### 3.0.2 Document CRUD Operations
```typescript
// Test cases for lib/supabase/documents.ts
describe('Document Operations', () => {
  // Create
  test('creates document with required fields')
  test('creates document with template content')
  test('assigns correct userId to new document')
  test('generates unique document ID')
  test('sets createdAt and updatedAt timestamps')

  // Read
  test('loads document by ID')
  test('returns null for non-existent document')
  test('loads all documents for user')
  test('does not load other users documents')
  test('handles large document content')

  // Update
  test('updates document content')
  test('updates document title')
  test('updates document discipline')
  test('updates updatedAt timestamp on save')
  test('preserves fields not being updated')

  // Delete
  test('deletes document by ID')
  test('deletes associated subcollections')
  test('handles deletion of non-existent document')

  // Edge cases
  test('handles concurrent updates (last write wins)')
  test('handles offline mode gracefully')
  test('validates document schema before save')
  test('handles maximum document size')
  test('handles special characters in content')
  test('handles emoji in content')
  test('handles RTL text content')
});
```

#### 3.0.3 Auto-Save System
```typescript
// Test cases for lib/hooks/use-document.ts
describe('Auto-Save', () => {
  test('triggers save after 30 seconds of inactivity')
  test('debounces rapid changes correctly')
  test('does not save if content unchanged')
  test('shows saving indicator during save')
  test('shows saved indicator after successful save')
  test('shows error indicator on save failure')
  test('retries failed saves')
  test('manual save (Cmd+S) works immediately')
  test('prevents navigation with unsaved changes')
  test('handles save during sign-out gracefully')
});
```

---

### Phase 1: Multi-Database Research

#### 3.1.1 PubMed Client
```typescript
// Test cases for lib/pubmed/client.ts
describe('PubMed API Client', () => {
  // Search
  test('searches PubMed with query string')
  test('returns correct number of results')
  test('parses article metadata correctly')
  test('handles empty search results')
  test('handles pagination (retstart, retmax)')

  // Article details
  test('fetches article by PMID')
  test('extracts authors correctly')
  test('extracts abstract correctly')
  test('extracts publication date correctly')
  test('extracts DOI when available')
  test('extracts journal information')

  // Edge cases
  test('handles API rate limiting')
  test('handles network timeout')
  test('handles malformed XML response')
  test('handles articles without abstracts')
  test('handles articles with special characters in title')
  test('handles retracted articles')
});
```

#### 3.1.2 arXiv Client
```typescript
// Test cases for lib/research/arxiv.ts
describe('arXiv API Client', () => {
  test('searches arXiv with query')
  test('parses Atom XML response correctly')
  test('extracts preprint categories')
  test('handles multi-author papers')
  test('extracts PDF link correctly')
  test('handles pagination')
  test('handles special LaTeX characters in titles')
  test('handles network failures gracefully')
});
```

#### 3.1.3 Semantic Scholar Client
```typescript
// Test cases for lib/research/semantic-scholar.ts
describe('Semantic Scholar API', () => {
  test('searches papers by query')
  test('returns citation counts')
  test('returns influential citation count')
  test('fetches paper details by ID')
  test('fetches related papers')
  test('handles papers without DOI')
  test('handles API rate limiting (100 req/5min)')
  test('handles large result sets')
});
```

#### 3.1.4 OpenAlex Client
```typescript
// Test cases for lib/research/openalex.ts
describe('OpenAlex API', () => {
  test('searches works by query')
  test('reconstructs abstract from inverted index')
  test('handles works without abstract')
  test('extracts open access status')
  test('handles cursor pagination')
  test('filters by publication year')
  test('handles concept tagging')
});
```

#### 3.1.5 Unified Search
```typescript
// Test cases for lib/research/index.ts
describe('Unified Search Aggregator', () => {
  test('searches all databases in parallel')
  test('deduplicates results by DOI')
  test('deduplicates by normalized title')
  test('merges metadata from multiple sources')
  test('ranks by relevance and citation count')
  test('handles partial failures gracefully')
  test('respects database priority per discipline')
  test('returns within timeout even if some APIs slow')
});
```

---

### Phase 2: Citation Management

#### 3.2.1 Reference Library
```typescript
// Test cases for lib/citations/library.ts
describe('Reference Library', () => {
  // CRUD
  test('creates reference with all fields')
  test('validates reference type')
  test('validates required fields per type')
  test('updates reference')
  test('deletes reference')

  // Organization
  test('creates folder')
  test('moves reference to folder')
  test('adds label to reference')
  test('removes label from reference')

  // Search
  test('searches by title')
  test('searches by author')
  test('searches by DOI')
  test('filters by type')
  test('filters by year range')

  // Edge cases
  test('handles duplicate DOI detection')
  test('handles references without DOI')
  test('handles very long author lists')
  test('handles special characters in titles')
});
```

#### 3.2.2 CSL Citation Formatter
```typescript
// Test cases for lib/citations/csl-formatter.ts
describe('CSL Citation Formatter', () => {
  // APA 7th Edition
  describe('APA Style', () => {
    test('formats single author: (Smith, 2024)')
    test('formats two authors: (Smith & Jones, 2024)')
    test('formats 3+ authors: (Smith et al., 2024)')
    test('formats 21+ authors bibliography (first 19...last)')
    test('handles organization as author')
    test('handles no date: (Smith, n.d.)')
    test('handles same author, same year: 2024a, 2024b')
    test('formats DOI correctly')
    test('formats URL with access date')
  });

  // Vancouver (Numeric)
  describe('Vancouver Style', () => {
    test('formats in-text as [1]')
    test('formats bibliography with numbered list')
    test('abbreviates journal names')
    test('handles page ranges correctly')
  });

  // Chicago
  describe('Chicago Style', () => {
    test('formats author-date in-text')
    test('formats footnote style')
    test('handles Ibid. correctly')
    test('formats bibliography entry')
  });

  // All 10 styles
  test.each([
    'apa', 'mla', 'chicago', 'vancouver',
    'harvard', 'ieee', 'ama', 'nature', 'cell', 'science'
  ])('style %s produces valid output', (style) => {});

  // Edge cases for ALL styles
  describe('Edge Cases', () => {
    test('handles missing author')
    test('handles missing year')
    test('handles missing title')
    test('handles all fields missing except type')
    test('handles unicode in author names')
    test('handles diacritics: é, ü, ñ, ø')
    test('handles CJK characters in titles')
    test('handles very long titles (truncation)')
    test('escapes HTML in output')
  });
});
```

#### 3.2.3 BibTeX Import/Export
```typescript
// Test cases for lib/citations/import-export.ts
describe('BibTeX Import', () => {
  test('parses @article entry')
  test('parses @book entry')
  test('parses @inproceedings entry')
  test('parses @misc entry')
  test('handles LaTeX escapes: \\"{o} → ö')
  test('handles LaTeX commands: \\textit{}')
  test('handles nested braces')
  test('handles multiple entries')
  test('handles malformed BibTeX gracefully')
  test('handles missing required fields')
  test('preserves custom fields')
});

describe('BibTeX Export', () => {
  test('exports valid BibTeX format')
  test('generates unique cite keys')
  test('escapes special characters')
  test('handles all reference types')
});

describe('RIS Import/Export', () => {
  test('parses RIS format correctly')
  test('maps RIS types to CSL types')
  test('exports valid RIS format')
  test('handles EndNote-style RIS')
  test('handles Zotero-style RIS')
});
```

#### 3.2.4 Citation Picker (CWYW)
```typescript
// Test cases for components/citations/citation-dialog.tsx
describe('Citation Picker', () => {
  test('opens on Cmd+Shift+P')
  test('closes on Escape')
  test('searches library as user types')
  test('navigates with arrow keys')
  test('inserts citation on Tab')
  test('shows options panel on Enter')
  test('applies suppress author option')
  test('applies page number option')
  test('applies prefix option')
  test('applies suffix option')
  test('handles empty library')
  test('handles no search results')
});
```

---

### Phase 3A: Writing Analysis

#### 3.3.1 Readability Metrics
```typescript
// Test cases for lib/writing-analysis/analyzers.ts
describe('Readability Metrics', () => {
  // Flesch Reading Ease
  test('calculates Flesch score correctly')
  test('Flesch: 100 = very easy (5th grade)')
  test('Flesch: 0 = very difficult (college graduate)')
  test('handles empty text')
  test('handles single word')
  test('handles text without sentences')

  // Flesch-Kincaid Grade Level
  test('calculates grade level correctly')
  test('maps to US grade levels accurately')

  // Gunning Fog
  test('calculates Fog index correctly')
  test('identifies complex words correctly')

  // Edge cases
  test('handles text with numbers')
  test('handles text with abbreviations')
  test('handles text with URLs')
  test('handles text with citations')
  test('handles non-English characters')
});
```

#### 3.3.2 Style Analysis
```typescript
// Test cases for writing style detection
describe('Style Analysis', () => {
  // Passive voice
  test('detects "was found"')
  test('detects "has been shown"')
  test('detects "were analyzed"')
  test('does not flag "is important"')
  test('calculates passive percentage correctly')

  // Adverbs
  test('detects -ly adverbs')
  test('excludes common exceptions (only, really)')
  test('calculates adverb density')

  // Sentence variety
  test('calculates length variation')
  test('detects repeated beginnings')
  test('flags monotonous rhythm')

  // Academic style
  test('detects first-person pronouns')
  test('calculates formality score')
  test('detects informal contractions')
});
```

#### 3.3.3 Vocabulary Analysis
```typescript
describe('Vocabulary Analysis', () => {
  test('counts unique words')
  test('calculates vocabulary richness')
  test('detects repeated words')
  test('detects clichés')
  test('detects hedging words')
  test('detects filler words')
  test('handles stemming correctly')
  test('handles hyphenated words')
});
```

---

### Phase 3B: AI Writing Assistance

#### 3.3.4 AI Writing Actions
```typescript
// Test cases for lib/ai-writing/types.ts and API
describe('AI Writing Actions', () => {
  test.each([
    'paraphrase', 'simplify', 'expand', 'shorten',
    'formalize', 'improve-clarity', 'fix-grammar',
    'active-voice', 'academic-tone', 'continue',
    'summarize', 'explain', 'counterargument',
    'add-citations', 'transition', 'conclusion'
  ])('action %s returns valid response', async (action) => {});

  // Output validation
  test('paraphrase changes wording but preserves meaning')
  test('simplify reduces complexity')
  test('expand increases content length')
  test('shorten reduces content length')
  test('formalize removes contractions')
  test('academic-tone adds hedging language')

  // Edge cases
  test('handles empty selection')
  test('handles very long selection')
  test('handles selection with citations')
  test('handles selection with tables')
  test('handles API timeout gracefully')
  test('handles API rate limiting')
});
```

#### 3.3.5 AI Detection
```typescript
// Test cases for lib/ai-detection/detector.ts
describe('AI Detection', () => {
  // Burstiness
  test('calculates sentence length variance')
  test('human text has higher burstiness')
  test('AI text has lower burstiness')

  // Predictability
  test('detects AI-typical phrases')
  test('detects structural patterns')
  test('calculates predictability score')

  // Overall scoring
  test('classifies obvious human text')
  test('classifies obvious AI text')
  test('handles mixed content')
  test('provides confidence score')

  // Edge cases
  test('handles very short text')
  test('handles technical writing')
  test('handles non-English text')
  test('does not flag academic conventions as AI')
});
```

---

### Phase 4: Plagiarism Detection

#### 3.4.1 Fingerprinting
```typescript
// Test cases for lib/plagiarism/fingerprint.ts
describe('Text Fingerprinting', () => {
  test('normalizes text consistently')
  test('generates n-grams correctly')
  test('calculates rolling hash')
  test('winnowing selects consistent fingerprints')
  test('same text produces same fingerprints')
  test('similar text produces overlapping fingerprints')
  test('different text produces different fingerprints')

  // Edge cases
  test('handles punctuation variations')
  test('handles whitespace variations')
  test('handles case variations')
  test('handles very short text')
  test('handles text with numbers')
});
```

#### 3.4.2 Similarity Calculation
```typescript
// Test cases for lib/plagiarism/similarity.ts
describe('Similarity Calculation', () => {
  test('Jaccard similarity: identical = 1.0')
  test('Jaccard similarity: different = 0.0')
  test('containment: subset detection')
  test('overlap coefficient calculation')
  test('clusters contiguous matches')
  test('calculates Levenshtein distance')

  // Thresholds
  test('exact match: 95%+ similarity')
  test('near-exact: 80-95% similarity')
  test('paraphrase: 50-80% similarity')
  test('mosaic: scattered matches')
});
```

#### 3.4.3 Plagiarism Detector
```typescript
// Test cases for lib/plagiarism/detector.ts
describe('Plagiarism Detector', () => {
  // Quote detection
  test('detects double-quoted text')
  test('detects single-quoted text')
  test('detects smart quotes')
  test('detects block quotes')

  // Citation detection
  test('detects author-year citations')
  test('detects numeric citations [1]')
  test('detects footnote citations')

  // Exclusions
  test('excludes quoted text from score')
  test('excludes cited text from score')
  test('excludes common phrases')

  // Pattern detection
  test('detects unicode substitution')
  test('detects invisible characters')
  test('detects style inconsistency')

  // Edge cases
  test('handles empty document')
  test('handles document with only quotes')
  test('handles self-plagiarism detection')
});
```

---

### Phase 5: Export System

#### 3.5.1 DOCX Export
```typescript
// Test cases for lib/export/docx.ts
describe('DOCX Export', () => {
  // Structure
  test('exports valid .docx file')
  test('file can be opened in Word')
  test('file can be opened in Google Docs')

  // Headings
  test('H1 → Heading 1 style')
  test('H2 → Heading 2 style')
  test('H3 → Heading 3 style')

  // Formatting
  test('preserves bold text')
  test('preserves italic text')
  test('preserves underline')
  test('preserves superscript')
  test('preserves subscript')

  // Tables
  test('exports tables correctly')
  test('preserves table borders')
  test('handles merged cells')

  // Edge cases
  test('handles empty document')
  test('handles very large document')
  test('handles special characters')
  test('handles images (if supported)')
  test('handles page breaks')
});
```

#### 3.5.2 PDF Export
```typescript
// Test cases for lib/export/pdf.ts
describe('PDF Export', () => {
  // Structure
  test('exports valid PDF file')
  test('generates correct page count')

  // Features
  test('includes running headers')
  test('includes page numbers')
  test('generates table of contents')
  test('applies 1-inch margins')

  // Options
  test('double spacing option works')
  test('line numbers option works')
  test('watermark option works')

  // Edge cases
  test('handles very long document')
  test('handles tables spanning pages')
  test('handles special characters')
  test('handles Unicode text')
});
```

#### 3.5.3 PPTX Export
```typescript
// Test cases for lib/presentations/export/pptx-export.ts
describe('PPTX Export', () => {
  test('exports valid .pptx file')
  test('file can be opened in PowerPoint')
  test('applies theme colors')
  test('includes speaker notes')
  test('exports charts as images')
  test('handles all slide types')
  test('preserves text formatting')
});
```

---

### Phase 6: Collaboration

#### 3.6.1 Comments System
```typescript
// Test cases for lib/collaboration/comments.ts
describe('Comments', () => {
  test('creates comment on selection')
  test('creates reply to comment')
  test('resolves comment')
  test('unresolves comment')
  test('deletes comment')
  test('syncs in real-time')
  test('handles concurrent comments')
  test('preserves comment positions after edits')
});
```

#### 3.6.2 Version History
```typescript
// Test cases for lib/collaboration/versions.ts
describe('Version History', () => {
  test('creates auto-version every 5 minutes')
  test('creates manual version snapshot')
  test('restores to previous version')
  test('creates backup before restore')
  test('limits version count (keeps 50)')
  test('compares two versions')
});
```

#### 3.6.3 Document Sharing
```typescript
// Test cases for lib/collaboration/sharing.ts
describe('Document Sharing', () => {
  test('generates secure share token')
  test('creates view-only share link')
  test('creates editable share link')
  test('validates share token')
  test('respects expiry date')
  test('password protection works')
  test('revokes share access')
  test('handles invalid tokens')
});
```

#### 3.6.4 Track Changes
```typescript
// Test cases for lib/collaboration/track-changes.ts
describe('Track Changes', () => {
  test('tracks insertions')
  test('tracks deletions')
  test('accepts single change')
  test('rejects single change')
  test('accepts all changes')
  test('rejects all changes')
  test('preserves change authorship')
  test('handles overlapping changes')
});
```

---

### Phase 7: Presentation Generator

#### 3.7.1 Content Extraction
```typescript
// Test cases for lib/presentations/extractors/content-extractor.ts
describe('Content Extraction', () => {
  // Statistics
  test('extracts percentages: "45%"')
  test('extracts p-values: "p < 0.05"')
  test('extracts sample sizes: "n = 100"')
  test('extracts effect sizes: "OR = 2.3"')
  test('extracts confidence intervals: "95% CI"')

  // Citations
  test('extracts author-year citations')
  test('extracts numeric citations')
  test('groups citations for references slide')

  // Structure
  test('identifies sections by headings')
  test('extracts key findings')
  test('identifies methodology sections')

  // Edge cases
  test('handles document without statistics')
  test('handles document without citations')
  test('handles very long documents')
});
```

#### 3.7.2 Visualization Detection
```typescript
// Test cases for lib/presentations/analyzers/visualization-detector.ts
describe('Visualization Detection', () => {
  test('suggests bar chart for category comparisons')
  test('suggests line chart for time series')
  test('suggests pie chart for proportions')
  test('suggests scatter for correlations')
  test('suggests flowchart for processes')
  test('suggests table for detailed data')
  test('handles ambiguous data gracefully')
});
```

#### 3.7.3 Chart Renderer
```typescript
// Test cases for lib/presentations/visualizations/chart-renderer.tsx
describe('SVG Chart Renderer', () => {
  // Chart types
  test('renders bar chart')
  test('renders horizontal bar chart')
  test('renders stacked bar chart')
  test('renders line chart')
  test('renders multi-series line chart')
  test('renders pie chart')
  test('renders donut chart')
  test('renders scatter plot')
  test('renders area chart')
  test('renders box plot')

  // Features
  test('calculates trend line correctly')
  test('displays R² value')
  test('renders axis labels')
  test('renders legend')
  test('applies theme colors')

  // Edge cases
  test('handles empty data')
  test('handles single data point')
  test('handles negative values')
  test('handles very large values')
  test('handles very small values')
});
```

#### 3.7.4 Flowchart Renderer
```typescript
// Test cases for lib/presentations/visualizations/flowchart-renderer.tsx
describe('SVG Flowchart Renderer', () => {
  test('renders process nodes')
  test('renders decision nodes')
  test('renders connector arrows')
  test('generates PRISMA flow correctly')
  test('generates process flow correctly')
  test('handles various layout directions')
  test('applies theme styling')
});
```

#### 3.7.5 Slide Templates
```typescript
// Test cases for slide template components
describe('Slide Templates', () => {
  test('title slide renders correctly')
  test('content slide renders bullet points')
  test('data slide renders charts')
  test('two-column slide aligns content')
  test('section divider renders centered')
  test('references slide formats citations')
  test('process slide renders flowchart')
  test('all templates apply theme correctly')
});
```

---

## 4. Integration Tests

### 4.1 Authentication Flow
```typescript
describe('Authentication Flow', () => {
  test('complete sign-in → document creation → sign-out')
  test('sign-in → load existing documents → edit → save')
  test('handles session expiry gracefully')
});
```

### 4.2 Document Workflow
```typescript
describe('Document Workflow', () => {
  test('create → edit → auto-save → reload → verify content')
  test('create → add citations → generate bibliography')
  test('create → check plagiarism → export PDF')
});
```

### 4.3 Presentation Workflow
```typescript
describe('Presentation Workflow', () => {
  test('document → generate slides → edit → export PPTX')
  test('document with stats → charts generated correctly')
  test('theme change applies to all slides')
});
```

---

## 5. End-to-End Tests

### 5.1 User Journey: New User
```typescript
describe('New User Journey', () => {
  test(`
    1. Land on homepage
    2. Click sign in
    3. Complete Google auth
    4. See empty document list
    5. Create new document from template
    6. Type content
    7. See auto-save indicator
    8. Add citation
    9. Check writing analysis
    10. Export to PDF
    11. Sign out
  `)
});
```

### 5.2 User Journey: Returning User
```typescript
describe('Returning User Journey', () => {
  test(`
    1. Sign in
    2. See document list
    3. Search for document
    4. Open document
    5. Make edits
    6. Generate presentation
    7. Edit slides
    8. Export to PPTX
  `)
});
```

---

## 6. Edge Cases Matrix

| Category | Edge Case | Expected Behavior |
|----------|-----------|-------------------|
| Auth | Popup blocked | Show error, offer redirect |
| Auth | Network failure | Retry with backoff |
| Document | 1MB+ content | Handle without crash |
| Document | Empty title | Use "Untitled" |
| Document | Special chars in title | Escape for storage |
| Citation | 100+ authors | Truncate with et al. |
| Citation | Missing year | Show "n.d." |
| Export | Empty document | Export with placeholder |
| Export | 100+ pages | Handle pagination |
| Chart | 1000+ data points | Sample or warn |
| Search | API timeout | Show partial results |
| Search | All APIs fail | Show helpful error |

---

## 7. Performance Benchmarks

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Document load | < 500ms | 2s |
| Auto-save | < 1s | 3s |
| Citation format | < 100ms | 500ms |
| Plagiarism check | < 5s | 15s |
| DOCX export | < 2s | 10s |
| PDF export | < 3s | 15s |
| PPTX export | < 5s | 20s |
| Slide generation | < 10s | 30s |

---

## 8. Accessibility Tests

```typescript
describe('Accessibility', () => {
  test('all interactive elements are focusable')
  test('keyboard navigation works throughout')
  test('screen reader announces changes')
  test('color contrast meets WCAG AA')
  test('no keyboard traps')
  test('focus visible on all elements')
});
```

---

## 9. Success Criteria

### Definition of Done
- [ ] All P0 tests pass (0 failures)
- [ ] All P1 tests pass (0 failures)
- [ ] Code coverage > 80% for critical paths
- [ ] No console errors in test runs
- [ ] Tests run in < 5 minutes total
- [ ] All discovered bugs documented and fixed

### Quality Gates
- **Must pass before merge:** All unit tests
- **Must pass before deploy:** All integration tests
- **Run nightly:** E2E tests + performance benchmarks

---

**Document History:**
- v1.0 (2026-01-04): Initial specification
