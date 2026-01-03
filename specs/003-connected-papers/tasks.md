# Tasks: Connected Papers Discovery

**Input**: Design documents from `/specs/003-connected-papers/`
**Prerequisites**: plan.md (complete), spec.md (complete)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup (Directory Structure)

**Purpose**: Create directory structure for recommendations feature

- [ ] T001 [P] Create `lib/recommendations/` directory structure
- [ ] T002 [P] Create `components/recommendations/` directory structure
- [ ] T003 [P] Create `app/api/recommendations/` directory structure

---

## Phase 2: Foundational (Types & PubMed Extensions)

**Purpose**: Define types and extend PubMed client for related papers

- [ ] T004 Add recommendation types to `lib/firebase/schema.ts`:
  - RecommendationCache interface
  - ExtractedConcept interface
  - PaperRecommendation interface

- [ ] T005 Extend PubMed client in `lib/pubmed/client.ts`:
  - Add getRelatedPapers(pmid) function
  - Use PubMed eLink API for related articles
  - Return structured related paper list

- [ ] T006 Add recommendation cache operations:
  - saveRecommendationCache()
  - getRecommendationCache()
  - isRecommendationCacheValid()

**Checkpoint**: Foundation ready for recommendation features

---

## Phase 3: User Story 1 - Get Paper Recommendations (Priority: P1) 🎯 MVP

**Goal**: User clicks button and receives relevant paper suggestions based on document content

**Independent Test**: Write content → Click "Find Related Papers" → See relevant recommendations with scores

### Implementation for User Story 1

- [ ] T007 [US1] Create concept extractor in `lib/recommendations/concept-extractor.ts`:
  - Accept document content (HTML or text)
  - Use AI to extract key concepts
  - Return weighted concept list
  - Handle short documents gracefully

- [ ] T008 [US1] Create recommendation engine in `lib/recommendations/recommendation-engine.ts`:
  - Accept concepts and existing citations
  - Build PubMed search queries
  - Search for relevant papers
  - Filter already-cited papers
  - Return ranked recommendations

- [ ] T009 [US1] Create relevance scorer in `lib/recommendations/relevance-scorer.ts`:
  - Calculate relevance score (0-100)
  - Generate human-readable explanation
  - Consider: keyword match, recency, citation overlap
  - Return scored recommendations

- [ ] T010 [US1] Create recommendations API in `app/api/recommendations/route.ts`:
  - POST endpoint with documentId, content, citations
  - Check cache first
  - Extract concepts → Search → Score
  - Cache results (24 hours)
  - Return recommendations with explanations

- [ ] T011 [P] [US1] Create paper card component in `components/recommendations/paper-card.tsx`:
  - Display title, authors, year, journal
  - Relevance score badge
  - Expandable abstract
  - "Add Citation" button
  - "Show Connections" button

- [ ] T012 [P] [US1] Create relevance badge component in `components/recommendations/relevance-badge.tsx`:
  - Display score (0-100)
  - Tooltip with explanation
  - Color coding (green/yellow/red)

- [ ] T013 [US1] Create recommendations panel in `components/recommendations/recommendations-panel.tsx`:
  - "Find Related Papers" button
  - Progress indicator
  - List of paper cards
  - Empty state for no results
  - Settings toggle for auto-suggest

- [ ] T014 [US1] Add recommendations to three-panel layout:
  - Add "Related Papers" tab alongside Chat
  - Pass document content to recommendations
  - Maintain recommendations state

**Checkpoint**: User Story 1 complete - manual recommendations work

---

## Phase 4: User Story 4 - Add Recommended Paper to Document (Priority: P1) 🎯 MVP

**Goal**: User can add recommended papers as citations in their document

**Independent Test**: See recommendation → Click "Add Citation" → Citation appears in document

### Implementation for User Story 4

- [ ] T015 [US4] Create add citation button in `components/recommendations/add-citation-button.tsx`:
  - "Add Citation" option
  - "Insert with Summary" option
  - Generate citation format
  - Loading state

- [ ] T016 [US4] Implement citation insertion:
  - Generate author-year citation
  - Interface with TipTap editor
  - Insert at cursor position
  - Add to document's citation list

- [ ] T017 [US4] Handle "Insert with Summary":
  - Generate brief summary via AI
  - Format with citation
  - Insert as paragraph

- [ ] T018 [US4] Update recommendations after adding:
  - Mark paper as "added" in UI
  - Move to bottom of list or hide
  - Refresh recommendations if needed

**Checkpoint**: User Story 4 complete - can add recommendations to document

---

## Phase 5: User Story 2 - Explore Paper Connections (Priority: P2)

**Goal**: User can see papers that cite or are cited by a recommendation

**Independent Test**: Click "Show Connections" → See citing/cited papers → Add one to document

### Implementation for User Story 2

- [ ] T019 [US2] Create citation analyzer in `lib/recommendations/citation-analyzer.ts`:
  - Use PubMed eLink for citing papers
  - Use paper's references for cited papers
  - Return connection network

- [ ] T020 [US2] Create connections API in `app/api/recommendations/connections/route.ts`:
  - GET endpoint with pmid and type (citing/cited_by/related)
  - Call citation analyzer
  - Return connected papers

- [ ] T021 [P] [US2] Create connection viewer in `components/recommendations/connection-viewer.tsx`:
  - Two tabs: "Papers citing this" and "Papers this cites"
  - List of connected papers
  - Click to view abstract
  - Add citation option

- [ ] T022 [US2] Integrate connection viewer into paper card:
  - "Show Connections" button
  - Slide-out or modal panel
  - Close button

**Checkpoint**: User Story 2 complete - connection exploration works

---

## Phase 6: User Story 3 - Auto-suggest While Writing (Priority: P2)

**Goal**: Recommendations update automatically as user writes

**Independent Test**: Write new paragraph → Wait 30s → See updated recommendations

### Implementation for User Story 3

- [ ] T023 [US3] Create auto-suggest hook in `lib/hooks/use-auto-suggest.ts`:
  - Watch document content changes
  - Debounce with 30-second delay
  - Compare content hash to detect significant changes
  - Trigger recommendation refresh

- [ ] T024 [US3] Add auto-suggest setting:
  - Toggle in recommendations panel
  - Store preference in user settings
  - Default: disabled

- [ ] T025 [US3] Implement incremental updates:
  - Compare new concepts to cached
  - Only re-search if significant changes
  - Merge new recommendations with existing
  - Highlight new papers with "New" badge

- [ ] T026 [US3] Add visual feedback:
  - "Updating recommendations..." indicator
  - Subtle animation for new papers
  - "New" badge styling

**Checkpoint**: User Story 3 complete - auto-suggest works

---

## Phase 7: Polish & Performance

**Purpose**: Optimize performance and handle edge cases

- [ ] T027 [P] Handle short documents (< 100 words):
  - Display minimum content message
  - Suggest writing more before recommending

- [ ] T028 [P] Handle niche topics:
  - Display limited results message
  - Suggest broader search terms

- [ ] T029 [P] Optimize caching:
  - 24-hour cache TTL
  - Content hash for invalidation
  - Preemptive cache refresh

- [ ] T030 [P] Add loading states and error handling
- [ ] T031 Responsive design for recommendations panel
- [ ] T032 Test with various document types
- [ ] T033 Update HANDOVER.md with feature documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - START HERE
- **Foundational (Phase 2)**: Depends on Setup
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 4 (Phase 4)**: Depends on User Story 1 (needs recommendations)
- **User Story 2 (Phase 5)**: Depends on User Story 1
- **User Story 3 (Phase 6)**: Depends on User Story 1
- **Polish (Phase 7)**: Depends on all user stories

### Parallel Opportunities

```bash
# Phase 1 - all parallel:
T001, T002, T003

# Phase 2:
T004 → T005, T006 (T005 and T006 can parallel after T004)

# Phase 3 - core pipeline:
T007 → T008 → T009 → T010 (sequential)
T011, T012 can parallel with above
T013 → T014 after all

# Phase 4:
T015 → T016 → T017 → T018

# Phase 5:
T019 → T020 → T021 → T022

# Phase 6:
T023 → T024 → T025 → T026

# Phase 7 - all parallel:
T027, T028, T029, T030, T031
```

---

## MVP Strategy

**Minimum Viable: User Stories 1 + 4**

1. Complete Phases 1-2 (Setup + Foundational)
2. Complete Phase 3 (Manual Recommendations)
3. Complete Phase 4 (Add to Document)
4. Test: Write content → Get recommendations → Add citation
5. Ship MVP

**Incremental additions**:
- Add User Story 2 for connection exploration
- Add User Story 3 for auto-suggest
- Add Polish phase for edge cases

---

## Integration Notes

This feature builds on existing infrastructure:
- Uses existing PubMed client (extended with eLink)
- Uses existing model selector pattern
- Uses existing TipTap editor integration
- Follows existing panel/tab pattern in three-panel layout
