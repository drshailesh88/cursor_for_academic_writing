# Tasks: Chat with Papers

**Input**: Design documents from `/specs/002-chat-with-papers/`
**Prerequisites**: plan.md (complete), spec.md (complete)

## Status: ✅ Core Functionality Complete | 🔄 UI Components In Progress | 📊 Tests: 1789 total

**Last Updated**: 2026-01-05

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup (Dependencies & Structure) ✅ COMPLETE

**Purpose**: Install dependencies and create directory structure

- [x] T001 Install pdf-parse dependency: `npm install --legacy-peer-deps pdf-parse @types/pdf-parse`
- [x] T002 [P] Create `lib/pdf/` directory structure
- [x] T003 [P] Create `lib/papers/` directory structure
- [ ] T004 [P] Create `components/papers/` directory structure
- [ ] T005 [P] Create `app/api/papers/` directory structure

---

## Phase 2: Foundational (Firebase Setup) ✅ COMPLETE

**Purpose**: Configure Firebase Storage and Firestore schema

- [x] T006 Create Firebase Storage utilities in `lib/firebase/storage.ts`:
  - uploadPaper() - Upload PDF to Storage
  - getPaperUrl() - Get signed download URL
  - deletePaper() - Remove PDF from Storage

- [x] T007 Add UploadedPaper interface to `lib/firebase/schema.ts`
- [x] T008 Add PaperSection interface to `lib/firebase/schema.ts`
- [x] T009 Add PaperChat interface to `lib/firebase/schema.ts`

- [x] T010 Create paper service in `lib/papers/index.ts`:
  - createPaper() - Create paper document
  - getPaper() - Get paper by ID
  - getUserPapers() - List user's papers
  - updatePaper() - Update paper metadata
  - deletePaper() - Delete paper and file

**Checkpoint**: Firebase ready for paper storage ✅

---

## Phase 3: User Story 1 - Upload and Analyze a Paper (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: User uploads a PDF and sees extracted content with sections

**Independent Test**: Upload PDF → See title, authors, section breakdown

### Implementation for User Story 1 ✅

- [x] T011 [US1] Create PDF parser in `lib/papers/pdf-processor.ts`:
  - Accept PDF buffer/file
  - Use pdf-parse for text extraction
  - Return structured text with page info
  - Handle extraction errors gracefully

- [x] T012 [US1] Create section detector in `lib/papers/processing.ts`:
  - Analyze extracted text for headers
  - Identify standard sections (Abstract, Methods, Results, etc.)
  - Return section boundaries and content
  - Handle non-standard paper formats

- [x] T013 [US1] Create metadata extractor in `lib/papers/metadata.ts`:
  - Extract title from first text block
  - Extract authors
  - Extract journal, year, DOI if present
  - Use AI fallback for ambiguous cases

- [ ] T014 [US1] Create upload API in `app/api/papers/upload/route.ts`:
  - Accept multipart/form-data
  - Validate file type (PDF only)
  - Validate file size (< 50MB)
  - Save to Firebase Storage
  - Create paper document in Firestore
  - Trigger async processing
  - Return paper ID and status

- [ ] T015 [US1] Create extraction API in `app/api/papers/[paperId]/route.ts`:
  - GET endpoint for paper status and content
  - Return processing status
  - Return extracted content when ready

- [ ] T016 [P] [US1] Create paper upload component in `components/papers/paper-upload.tsx`:
  - Drag-and-drop zone
  - File picker button
  - Upload progress indicator
  - Error display for invalid files
  - Success state with paper info

- [ ] T017 [P] [US1] Create paper sections component in `components/papers/paper-sections.tsx`:
  - Display sections as collapsible cards
  - Highlight abstract
  - Show section navigation
  - Copy section text option

- [ ] T018 [US1] Create paper panel in `components/papers/paper-panel.tsx`:
  - Combine upload and sections views
  - Show paper metadata header
  - Toggle between sections and chat
  - Handle loading and error states

- [ ] T019 [US1] Add papers access to three-panel layout:
  - Add "Papers" tab/button to right panel
  - Conditional rendering of papers panel
  - Maintain selected paper state

**Checkpoint**: Core processing complete ✅ | UI components pending 🔄

---

## Phase 4: User Story 2 - Chat with a Paper (Priority: P1) 🎯 MVP

**Goal**: User asks questions about uploaded paper and gets grounded answers

**Independent Test**: Upload PDF → Ask question → Get accurate answer with section references

### Implementation for User Story 2

- [ ] T020 [US2] Create paper chat logic in `lib/papers/paper-chat.ts`:
  - Build context from paper sections
  - Construct grounded chat prompt
  - Include section references in responses
  - Handle long papers (chunking)

- [ ] T021 [US2] Create paper chat API in `app/api/papers/chat/route.ts`:
  - POST endpoint with paperId, question, model
  - Load paper content from Firestore
  - Build chat context
  - Stream response using Vercel AI SDK
  - Save chat history

- [ ] T022 [P] [US2] Create paper chat component in `components/papers/paper-chat.tsx`:
  - Message list with Q&A history
  - Input field for questions
  - Model selector
  - Section reference highlighting
  - Streaming response display

- [ ] T023 [US2] Integrate chat into paper panel:
  - Tab/toggle between sections and chat
  - Pass paper context to chat
  - Maintain chat history per paper

**Checkpoint**: User Story 2 complete - Paper chat works with grounded responses

---

## Phase 5: User Story 3 - Extract Key Information (Priority: P2)

**Goal**: One-click extraction of findings, methods, limitations

**Independent Test**: Click "Extract Key Findings" → See bulleted list → Insert into document

### Implementation for User Story 3

- [ ] T024 [US3] Create extraction API in `app/api/papers/extract/route.ts`:
  - POST endpoint with paperId, extractionType
  - Types: findings, methods, limitations, citation
  - Use AI to extract structured info
  - Generate insertable HTML

- [ ] T025 [P] [US3] Create extraction buttons component in `components/papers/extraction-buttons.tsx`:
  - "Extract Key Findings" button
  - "Summarize Methods" button
  - "List Limitations" button
  - "Get Citation" button
  - Loading states for each

- [ ] T026 [US3] Create extraction results display:
  - Show extracted content
  - "Insert into Document" button
  - Copy to clipboard option
  - Edit before insert option

- [ ] T027 [US3] Implement insert functionality:
  - Generate proper citation
  - Format content for TipTap
  - Insert at cursor position

**Checkpoint**: User Story 3 complete - Quick extraction and insertion works

---

## Phase 6: User Story 4 - Manage Paper Library (Priority: P3)

**Goal**: User can view, access, and delete their paper collection

**Independent Test**: Upload papers → View in library → Delete one → Confirm removed

### Implementation for User Story 4

- [ ] T028 [P] [US4] Create paper library component in `components/papers/paper-library.tsx`:
  - Grid/list view of papers
  - Show title, authors, upload date
  - Click to open paper
  - Delete button with confirmation
  - Search/filter papers

- [ ] T029 [US4] Add library view to paper panel:
  - Toggle between library and single paper view
  - "Back to Library" navigation
  - Empty state for no papers

- [ ] T030 [US4] Implement paper deletion:
  - Delete from Firestore
  - Delete PDF from Storage
  - Update library view
  - Confirmation dialog

**Checkpoint**: User Story 4 complete - Full library management

---

## Phase 7: Polish & Edge Cases

**Purpose**: Handle edge cases and improve UX

- [ ] T031 [P] Handle scanned PDFs (no text layer):
  - Detect low text extraction
  - Warn user about quality
  - Future: OCR integration

- [ ] T032 [P] Handle password-protected PDFs:
  - Detect protection
  - Show clear error message

- [ ] T033 [P] Handle large PDFs:
  - Chunked processing
  - Progress updates
  - Memory optimization

- [ ] T034 [P] Add loading states and error handling throughout
- [ ] T035 Responsive design for paper panel
- [ ] T036 Test with various PDF types (single column, two column, etc.)
- [ ] T037 Update HANDOVER.md with feature documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - START HERE
- **Foundational (Phase 2)**: Depends on Setup (T001 for pdf-parse)
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on User Story 1 (needs paper data)
- **User Story 3 (Phase 5)**: Depends on User Story 1 (needs paper data)
- **User Story 4 (Phase 6)**: Depends on Foundational only
- **Polish (Phase 7)**: Depends on all user stories

### Parallel Opportunities

```bash
# Phase 1 - after T001:
T002, T003, T004, T005 (all parallel)

# Phase 2:
T007, T008, T009 (parallel after schema changes)

# Phase 3 - core pipeline:
T011 → T012 → T013 → T014, T015 (sequential)
T016, T017 can parallel with above
T018, T019 after all above

# Phase 4:
T020 → T021 → T022 → T023

# Phase 5:
T024 → T025 → T026 → T027

# Phase 6:
T028 → T029 → T030

# Phase 7 - all parallel:
T031, T032, T033, T034, T035
```

---

## MVP Strategy

**Minimum Viable: User Stories 1 + 2**

1. Complete Phases 1-2 (Setup + Foundational)
2. Complete Phase 3 (Upload and Extraction)
3. Complete Phase 4 (Paper Chat)
4. Test: Upload PDF → Chat with it → Get accurate answers
5. Ship MVP

**Incremental additions**:
- Add User Story 3 for quick extraction
- Add User Story 4 for library management
- Add Polish phase for edge cases
