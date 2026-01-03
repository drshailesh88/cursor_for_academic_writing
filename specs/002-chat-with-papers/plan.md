# Implementation Plan: Chat with Papers

**Branch**: `002-chat-with-papers` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-chat-with-papers/spec.md`

## Summary

Build a feature that allows users to upload PDF research papers, extract their content, and interactively chat with them. The system will parse PDFs to extract text and metadata, identify paper sections (abstract, methods, results, etc.), and enable Q&A grounded in the paper's content using the user's selected AI model.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**: pdf-parse (PDF extraction), Vercel AI SDK, Firebase Storage
**Storage**: Firebase Storage (PDFs), Firestore (metadata, extracted text)
**Testing**: Manual testing with sample academic PDFs
**Target Platform**: Web application (Next.js)
**Project Type**: Web application - extend existing three-panel layout
**Performance Goals**: PDF processing in < 60 seconds, chat responses in < 5 seconds
**Constraints**: PDF size limit 50MB, client-side upload with server-side processing
**Scale/Scope**: Up to 100 papers per user library

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Academic Excellence First | PASS | Extractions maintain academic context and accuracy |
| Citation Integrity | PASS | Paper metadata extracted for proper citations |
| Multi-LLM Flexibility | PASS | Reuse existing model selector for paper chat |
| Firebase-First Architecture | PASS | PDFs in Storage, metadata in Firestore |
| Simplicity Over Complexity | PASS | Use established PDF parsing library |

## Project Structure

### Documentation (this feature)

```text
specs/002-chat-with-papers/
├── spec.md              # Feature specification
├── plan.md              # This file
└── tasks.md             # Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
# New files to create
lib/
├── pdf/
│   ├── pdf-parser.ts            # PDF text extraction
│   ├── section-detector.ts      # Identify paper sections
│   └── metadata-extractor.ts    # Extract title, authors, etc.
├── papers/
│   ├── paper-service.ts         # Paper CRUD operations
│   └── paper-chat.ts            # Paper-specific chat logic

components/
├── papers/
│   ├── paper-upload.tsx         # Upload dropzone/button
│   ├── paper-panel.tsx          # Main paper interaction UI
│   ├── paper-chat.tsx           # Chat interface for papers
│   ├── paper-sections.tsx       # Section viewer/navigator
│   ├── paper-library.tsx        # List of user's papers
│   └── extraction-buttons.tsx   # Quick extract actions

app/api/
├── papers/
│   ├── upload/route.ts          # Handle PDF upload
│   ├── extract/route.ts         # Extract text from uploaded PDF
│   └── chat/route.ts            # Paper-specific chat endpoint

# Files to modify
lib/firebase/
├── schema.ts                    # Add UploadedPaper, PaperSection types
├── storage.ts                   # NEW: Firebase Storage operations

components/layout/
├── three-panel-layout.tsx       # Add papers panel toggle/tab
```

**Structure Decision**: Extend existing web application. PDF processing in `lib/pdf/`, paper management in `lib/papers/`, UI in `components/papers/`, APIs in `app/api/papers/`.

## Implementation Phases

### Phase 1: PDF Upload and Extraction (P1 - MVP Part 1)

**Goal**: User can upload a PDF and see extracted content

**Components**:
1. **PDF Parser** (`lib/pdf/pdf-parser.ts`)
   - Accept PDF buffer/file as input
   - Use pdf-parse library to extract text
   - Return structured text with page breaks

2. **Section Detector** (`lib/pdf/section-detector.ts`)
   - Analyze extracted text for section headers
   - Identify: Abstract, Introduction, Methods, Results, Discussion, Conclusion, References
   - Return section boundaries and content

3. **Metadata Extractor** (`lib/pdf/metadata-extractor.ts`)
   - Extract title (usually first major text block)
   - Extract authors (typically after title)
   - Extract journal, year, DOI if available in header/footer
   - Use AI fallback for ambiguous cases

4. **Upload API** (`app/api/papers/upload/route.ts`)
   - Accept multipart/form-data with PDF file
   - Validate file type and size (< 50MB)
   - Save to Firebase Storage
   - Trigger extraction process
   - Return upload status and paper ID

5. **Firebase Storage** (`lib/firebase/storage.ts`)
   - uploadPaper() - Upload PDF to Storage
   - getPaperUrl() - Get signed download URL
   - deletePaper() - Remove PDF from Storage

6. **Paper Upload UI** (`components/papers/paper-upload.tsx`)
   - Drag-and-drop zone or file picker button
   - Upload progress indicator
   - Error handling for invalid files

7. **Paper Sections UI** (`components/papers/paper-sections.tsx`)
   - Display extracted sections in collapsible cards
   - Show abstract prominently
   - Allow navigation between sections

### Phase 2: Paper Chat (P1 - MVP Part 2)

**Goal**: User can ask questions about uploaded paper

**Components**:
1. **Paper Chat Logic** (`lib/papers/paper-chat.ts`)
   - Build context from paper content
   - Construct prompt with paper text
   - Ground responses in paper content
   - Reference specific sections in answers

2. **Paper Chat API** (`app/api/papers/chat/route.ts`)
   - POST endpoint accepting paperId, question, model
   - Load paper content from Firestore
   - Stream response using Vercel AI SDK
   - Include section references in response

3. **Paper Chat UI** (`components/papers/paper-chat.tsx`)
   - Message list showing Q&A history
   - Input field for questions
   - Model selector
   - Section reference highlights in responses

### Phase 3: Key Information Extraction (P2)

**Goal**: One-click extraction of findings, methods, limitations

**Components**:
1. **Extraction Buttons** (`components/papers/extraction-buttons.tsx`)
   - "Extract Key Findings" button
   - "Summarize Methods" button
   - "List Limitations" button
   - "Get Citation" button

2. **Extraction API** (`app/api/papers/extract/route.ts`)
   - POST endpoint with paperId and extractionType
   - Use AI to extract structured information
   - Return formatted output for insertion

3. **Insert to Document**
   - Generate proper citation for paper
   - Format extracted content for TipTap
   - Insert at cursor position

### Phase 4: Paper Library (P3)

**Goal**: Manage collection of uploaded papers

**Components**:
1. **Paper Service** (`lib/papers/paper-service.ts`)
   - getUserPapers() - List all user's papers
   - getPaper() - Get single paper with content
   - deletePaper() - Remove paper and PDF
   - searchPapers() - Search by title/content

2. **Paper Library UI** (`components/papers/paper-library.tsx`)
   - Grid/list view of papers
   - Show title, authors, upload date
   - Click to open paper panel
   - Delete action with confirmation

## Data Model

### UploadedPaper (Firestore)

```typescript
interface UploadedPaper {
  id: string;
  userId: string;
  fileName: string;
  storagePath: string;           // gs://bucket/users/{userId}/papers/{id}.pdf

  // Extracted metadata
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  doi?: string;

  // Content
  fullText: string;              // Complete extracted text
  sections: PaperSection[];
  wordCount: number;
  pageCount: number;

  // Status
  processingStatus: 'uploading' | 'processing' | 'completed' | 'failed';
  processingError?: string;

  // Timestamps
  uploadedAt: Timestamp;
  processedAt?: Timestamp;
}

interface PaperSection {
  type: 'abstract' | 'introduction' | 'methods' | 'results' | 'discussion' | 'conclusion' | 'references' | 'other';
  title: string;
  content: string;
  startPage?: number;
  endPage?: number;
}

interface PaperChat {
  id: string;
  paperId: string;
  userId: string;
  messages: PaperChatMessage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PaperChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sectionReferences?: string[];  // Which sections were referenced
  timestamp: Timestamp;
}
```

### Firestore Collection Structure

```
users/{userId}/papers/{paperId}
users/{userId}/papers/{paperId}/chats/{chatId}
```

### Firebase Storage Structure

```
users/{userId}/papers/{paperId}.pdf
```

## API Contracts

### POST /api/papers/upload

**Request**: `multipart/form-data` with `file` field

**Response**:
```typescript
{
  paperId: string;
  status: 'processing';
  fileName: string;
}
```

### GET /api/papers/[paperId]

**Response**:
```typescript
{
  paper: UploadedPaper;
  status: 'completed' | 'processing' | 'failed';
}
```

### POST /api/papers/chat

**Request**:
```typescript
{
  paperId: string;
  question: string;
  model: string;
  chatId?: string;  // Continue existing chat
}
```

**Response** (streamed):
```typescript
{
  answer: string;
  sectionReferences: string[];
}
```

### POST /api/papers/extract

**Request**:
```typescript
{
  paperId: string;
  extractionType: 'findings' | 'methods' | 'limitations' | 'citation';
}
```

**Response**:
```typescript
{
  content: string;          // Extracted content
  citation: string;         // "(Author et al., YEAR)" format
  insertableHtml: string;   // Ready for TipTap insertion
}
```

## UI Integration

### Three-Panel Layout Enhancement

Add a "Papers" icon/tab to access paper functionality. Options:
1. **Separate panel mode**: Replace chat panel with paper panel
2. **Modal mode**: Open papers in a modal/drawer
3. **Tab mode**: Add tab alongside chat in right panel

**Recommended**: Tab mode within right panel for consistency

### Paper Interaction Flow

```
1. User clicks "Papers" tab in right panel
2. If no papers: Show upload dropzone
3. If papers exist: Show library with upload button
4. User uploads PDF → Progress bar → Processing indicator
5. Processing complete → Paper appears in library
6. User clicks paper → Full paper panel with:
   - Section navigator on left
   - Chat interface on right
   - Quick extraction buttons at top
7. User asks question → AI responds with section references
8. User extracts findings → "Insert into Document" button
```

## Dependencies

### New Dependencies Required

```bash
npm install --legacy-peer-deps pdf-parse @types/pdf-parse
```

**pdf-parse**: ~380KB, MIT license, widely used for PDF text extraction

### Existing (no changes needed)
- `@ai-sdk/*` packages - AI model integration
- `firebase` - Storage and Firestore
- `lib/prompts/writing-styles.ts` - Academic prose style

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scanned PDFs (no text) | Detect and warn user; future OCR support |
| Large PDFs exceeding context | Chunk text, use section-based context |
| Inaccurate section detection | Fallback to "Other" section, allow manual override |
| Storage costs | Set file size limits, cleanup old papers after 1 year |
| Hallucination in Q&A | Strong grounding prompt, cite specific sections |

## Success Metrics

- PDF upload and processing in < 60 seconds
- Text extraction accuracy > 95%
- Chat responses in < 5 seconds
- 90% grounded responses (no hallucinations)
- Users can access paper library in < 2 seconds
