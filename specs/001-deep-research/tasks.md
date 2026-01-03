# Tasks: Deep Research Agent

**Input**: Design documents from `/specs/001-deep-research/`
**Prerequisites**: plan.md (complete), spec.md (complete)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and type definitions

- [ ] T001 [P] Create `lib/research/` directory structure
- [ ] T002 [P] Create `components/research/` directory structure
- [ ] T003 [P] Create `app/api/research/` directory structure
- [ ] T004 Create research types in `lib/research/research-types.ts`

---

## Phase 2: Foundational (Firebase Schema)

**Purpose**: Extend Firebase schema for research sessions

- [ ] T005 Add ResearchSession interface to `lib/firebase/schema.ts`
- [ ] T006 Add ResearchSource interface to `lib/firebase/schema.ts`
- [ ] T007 Add research session CRUD operations to `lib/firebase/documents.ts`:
  - saveResearchSession()
  - getUserResearchSessions()
  - getResearchSession()
  - deleteResearchSession()

**Checkpoint**: Firebase ready for research data storage

---

## Phase 3: User Story 1 - Start a Deep Research Session (Priority: P1) 🎯 MVP

**Goal**: User enters a topic and receives a synthesized research report with 10+ cited sources

**Independent Test**: Enter research topic → Receive report with PubMed citations

### Implementation for User Story 1

- [ ] T008 [US1] Create research agent in `lib/research/research-agent.ts`:
  - Accept topic as input
  - Use existing PubMed client for search
  - Orchestrate multi-step research process
  - Return structured sources and synthesis

- [ ] T009 [US1] Create research synthesizer in `lib/research/research-synthesizer.ts`:
  - Accept sources array
  - Build synthesis prompt with academic style
  - Generate cohesive narrative with citations
  - Support streaming output

- [ ] T010 [US1] Create research API endpoint in `app/api/research/route.ts`:
  - POST endpoint with topic, model, parameters
  - Validate input
  - Call research agent
  - Stream synthesis response
  - Return sources alongside synthesis

- [ ] T011 [P] [US1] Create research progress component in `components/research/research-progress.tsx`:
  - Display current step (Searching, Analyzing, Synthesizing)
  - Show paper count as discovered
  - Animate between states

- [ ] T012 [P] [US1] Create research results component in `components/research/research-results.tsx`:
  - Display synthesized report
  - Collapsible source list with citations
  - "Insert into Document" button
  - Copy to clipboard option

- [ ] T013 [US1] Create deep research panel in `components/research/deep-research-panel.tsx`:
  - Topic input field
  - Model selector (reuse from chat)
  - Start Research button
  - Progress and results integration
  - State management for research flow

- [ ] T014 [US1] Add research panel toggle to `components/layout/three-panel-layout.tsx`:
  - Add "Research" tab alongside "Chat"
  - Conditional rendering of research vs chat panel
  - Maintain panel state

- [ ] T015 [US1] Implement "Insert into Document" functionality:
  - Interface with TipTap editor
  - Insert HTML content at cursor
  - Preserve formatting and citations

**Checkpoint**: User Story 1 complete - basic deep research works end-to-end

---

## Phase 4: User Story 2 - Configure Research Parameters (Priority: P2)

**Goal**: User can customize date ranges and source types for research

**Independent Test**: Set filters → Results match filter criteria

### Implementation for User Story 2

- [ ] T016 [P] [US2] Create research settings component in `components/research/research-settings.tsx`:
  - Date range picker (start year, end year)
  - Source type checkboxes (clinical trials, reviews, meta-analyses)
  - Focus area tags input
  - Collapsible/expandable panel

- [ ] T017 [US2] Enhance PubMed search in `lib/pubmed/client.ts`:
  - Add date range parameters to searchPubMed()
  - Add publication type filter support
  - Update PubMedSearchOptions interface

- [ ] T018 [US2] Update research agent to accept parameters in `lib/research/research-agent.ts`:
  - Pass dateRange to PubMed search
  - Pass sourceTypes to PubMed search
  - Validate parameters

- [ ] T019 [US2] Update API endpoint to accept parameters in `app/api/research/route.ts`:
  - Extend request body schema
  - Pass parameters to research agent

- [ ] T020 [US2] Integrate settings into research panel in `components/research/deep-research-panel.tsx`:
  - Add settings panel before topic input
  - Pass settings to research API

**Checkpoint**: User Story 2 complete - research filtering works

---

## Phase 5: User Story 3 - Track Research History (Priority: P3)

**Goal**: User can view and revisit past research sessions

**Independent Test**: Complete research → See in history → Click to view

### Implementation for User Story 3

- [ ] T021 [P] [US3] Create research history component in `components/research/research-history.tsx`:
  - List of past sessions with topic and date
  - Click to view full report
  - "Continue Research" button
  - Delete session option

- [ ] T022 [US3] Add session saving to research flow in `lib/research/research-agent.ts`:
  - Save session after synthesis complete
  - Include all sources and parameters
  - Store user ID and timestamps

- [ ] T023 [US3] Create session loading functionality:
  - Load session by ID
  - Display in research results component
  - Pre-fill parameters for "Continue Research"

- [ ] T024 [US3] Add history view toggle to research panel:
  - Toggle between "New Research" and "History"
  - Show history list when selected
  - Smooth transition between views

- [ ] T025 [US3] Implement "Continue Research" feature:
  - Load previous session
  - Pre-fill topic and parameters
  - Append new findings to existing session

**Checkpoint**: User Story 3 complete - full research history functionality

---

## Phase 6: Polish & Integration

**Purpose**: Final improvements and quality checks

- [ ] T026 [P] Add loading states and error handling throughout
- [ ] T027 [P] Add keyboard shortcuts (Enter to start research)
- [ ] T028 [P] Responsive design for research panel
- [ ] T029 Test with various research topics
- [ ] T030 Performance optimization (caching, debouncing)
- [ ] T031 Update HANDOVER.md with feature documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP priority
- **User Story 2 (Phase 4)**: Depends on User Story 1
- **User Story 3 (Phase 5)**: Depends on Foundational
- **Polish (Phase 6)**: Depends on all user stories

### Parallel Opportunities

```bash
# Phase 1 - all parallel:
T001, T002, T003, T004

# Phase 3 - parallel after T008-T010:
T011, T012 (then T013-T015 sequential)

# Phase 4:
T016 parallel with T017-T020

# Phase 5:
T021 can start while T022-T025 are sequential
```

---

## MVP Strategy

**Minimum Viable: User Story 1 only**

1. Complete Phases 1-2 (Setup + Foundational)
2. Complete Phase 3 (User Story 1)
3. Test: Enter topic → Get research report → Insert into document
4. Ship MVP

**Incremental additions**:
- Add User Story 2 for filtering capability
- Add User Story 3 for history tracking
