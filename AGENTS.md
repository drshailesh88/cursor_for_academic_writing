# Universal AI Agent Instructions

## Project: Academic Writing Platform

An AI-powered academic writing system with multi-database research integration, plagiarism detection, collaboration features, and professional document export.

**Status:** All 6 Phases Complete (50 features)
**Tech Stack:** Next.js 14, TypeScript, TipTap, Firebase, Vercel AI SDK
**Port:** localhost:2550

---

## Read These First

Before making ANY changes, read:

1. **HANDOVER.md** - Complete implementation status (50 features, 6 phases)
2. **CLAUDE.md** - Coding standards and architecture
3. **FIREBASE_SETUP.md** - Firebase configuration guide

---

## Completed Phases Overview

| Phase | Features | Key Files |
|-------|----------|-----------|
| **1** | Multi-Database Research | `lib/research/`, PubMed, arXiv, Semantic Scholar, OpenAlex |
| **2** | Citation Management | `lib/citations/`, 10 CSL styles, BibTeX/RIS import |
| **3A** | Writing Analysis | `lib/writing-analysis/`, readability, style metrics |
| **3B** | AI Writing + Detection | `lib/ai-writing/`, `lib/ai-detection/`, 16 AI actions |
| **4** | Plagiarism Detection | `lib/plagiarism/`, fingerprinting, similarity |
| **5** | Enhanced PDF Export | `lib/export/pdf.ts`, TOC, line numbers, watermarks |
| **6** | Collaboration | `lib/collaboration/`, comments, versions, sharing, track changes |

---

## Architecture

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Editor:** TipTap with extensions (tables, track changes)
- **UI:** shadcn/ui + Tailwind CSS
- **Layout:** Three resizable panels

### Backend
- **Auth:** Firebase Authentication (Google Sign-in)
- **Database:** Firestore with subcollections
- **AI:** Vercel AI SDK (14 models supported)
- **Research:** 4 academic databases

### AI Models (14 total)
```
Premium: Claude Sonnet 3.5, GPT-4o, Gemini 2.0 Flash
Free (OpenRouter): Llama 3.3 70B, Qwen 2.5 72B, DeepSeek V3, + more
```

---

## Project Structure

```
app/
├── layout.tsx                    # Root layout with Toaster
├── page.tsx                      # Main page with AuthGuard
├── globals.css                   # Academic theme + track changes
├── shared/[token]/page.tsx       # Share link validation
└── api/
    ├── chat/route.ts             # AI chat (14 models)
    └── ai-writing/route.ts       # AI writing assistance

components/
├── layout/three-panel-layout.tsx # Main layout + Share button
├── editor/academic-editor.tsx    # TipTap + Plagiarism toggle
├── chat/chat-interface.tsx       # AI chat + discipline selector
├── plagiarism/plagiarism-panel.tsx
├── collaboration/
│   ├── comments-sidebar.tsx      # Comments with filters
│   ├── version-history-panel.tsx # Version restore
│   ├── share-dialog.tsx          # Link/email sharing
│   └── track-changes-*.tsx       # Track changes UI
└── writing-analysis/
    ├── analysis-panel.tsx        # 4-tab analysis
    └── ai-detection-panel.tsx    # GPTZero-style detection

lib/
├── firebase/                     # Auth, Firestore, schema
├── hooks/
│   ├── use-document.ts           # Document management
│   ├── use-plagiarism.ts         # Plagiarism detection
│   ├── use-comments.ts           # Real-time comments
│   ├── use-versions.ts           # Version history
│   ├── use-sharing.ts            # Document sharing
│   └── use-track-changes.ts      # Track changes
├── research/                     # 4 database clients
├── citations/                    # CSL, import/export
├── plagiarism/                   # Fingerprinting, similarity
├── collaboration/                # Comments, versions, sharing
└── export/                       # DOCX, PDF
```

---

## Coding Standards

### TypeScript
```typescript
// Always use strict types - NO 'any'
interface ComponentProps {
  title: string;
  onSave: (data: string) => Promise<void>;
}

// Interfaces for props, types for data
interface ButtonProps { }
type Document = { }
```

### File Naming
- Components: `kebab-case.tsx` (e.g., `plagiarism-panel.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-plagiarism.ts`)
- Types in: `lib/firebase/schema.ts`, `lib/*/types.ts`

### Import Order
```typescript
// 1. React/Next
import { useState, useEffect } from 'react';

// 2. External libraries
import { Editor } from '@tiptap/react';

// 3. Internal lib
import { useAuth } from '@/lib/firebase/auth';

// 4. Components
import { Button } from '@/components/ui/button';

// 5. Types
import { Document } from '@/lib/firebase/schema';
```

---

## Key Features by Phase

### Phase 1: Multi-Database Research
```typescript
// 4 databases with unified search
import { unifiedSearch } from '@/lib/research';

const results = await unifiedSearch('CRISPR gene editing', {
  databases: ['pubmed', 'arxiv', 'semantic-scholar', 'openalex'],
  limit: 20
});
// Returns deduplicated results with DOI matching
```

### Phase 2: Citation Management
```typescript
// Paperpile-style cite-while-you-write
// Keyboard shortcut: Cmd+Shift+P
import { formatCitation, formatBibliography } from '@/lib/citations/csl-formatter';

// 10 styles: APA, MLA, Chicago, Vancouver, Harvard, IEEE, AMA, Nature, Cell
const citation = formatCitation(reference, 'apa-7');
```

### Phase 3: Writing Analysis + AI
```typescript
// Real-time analysis
import { useWritingAnalysis } from '@/lib/hooks/use-writing-analysis';
const { scores, issues } = useWritingAnalysis(content);

// AI writing actions (16 total)
import { useAIWriting } from '@/lib/hooks/use-ai-writing';
const { paraphrase, simplify, formalize } = useAIWriting(editor);
```

### Phase 4: Plagiarism Detection
```typescript
import { usePlagiarism } from '@/lib/hooks/use-plagiarism';
const { result, checkPlagiarism, excludeMatch } = usePlagiarism();

// Detects: exact matches, paraphrasing, uncited quotes, suspicious patterns
```

### Phase 5: Enhanced PDF Export
```typescript
import { exportToPdf } from '@/lib/export/pdf';

await exportToPdf({
  title: 'My Paper',
  content: htmlContent,
  includeLineNumbers: true,
  doubleSpacing: true,
  includeTableOfContents: true,
  watermark: 'DRAFT'
});
```

### Phase 6: Collaboration
```typescript
// Comments
import { useComments } from '@/lib/hooks/use-comments';
const { comments, addComment, resolveComment } = useComments(docId);

// Version History
import { useVersions } from '@/lib/hooks/use-versions';
const { versions, createSnapshot, restoreVersion } = useVersions(docId);

// Sharing
import { useSharing } from '@/lib/hooks/use-sharing';
const { createShareLink, shareWithEmail } = useSharing(docId);

// Track Changes
import { useTrackChanges } from '@/lib/hooks/use-track-changes';
const { isTracking, acceptChange, rejectChange } = useTrackChanges(docId);
```

---

## Firebase Schema

```
/users/{userId}
  - displayName, email, photoURL, createdAt

/documents/{docId}
  - title, content, wordCount, userId, disciplineId
  - createdAt, updatedAt

/documents/{docId}/comments/{commentId}
  - type: 'comment' | 'suggestion' | 'question'
  - content, selectedText, authorId, resolved
  - replies: []

/documents/{docId}/versions/{versionId}
  - type: 'auto' | 'manual' | 'restore-backup'
  - content, wordCount, label, createdBy

/documents/{docId}/shares/{shareId}
  - type: 'link' | 'email'
  - permission: 'view' | 'comment' | 'edit'
  - token, email, password, expiresAt

/documents/{docId}/changes/{changeId}
  - type: 'insertion' | 'deletion'
  - content, position, authorId, status
```

---

## Testing Commands

```bash
# Development
npm run dev              # Start on localhost:2550

# Type checking
npx tsc --noEmit         # Must pass before commit

# Build
npm run build            # Production build
```

### Manual Testing Checklist
```
[ ] Sign in with Google works
[ ] Documents auto-save (30 seconds)
[ ] AI chat responds (14 models)
[ ] PubMed/arXiv search works
[ ] Citation picker (Cmd+Shift+P)
[ ] Writing analysis shows scores
[ ] Plagiarism detection runs
[ ] Comments add/resolve
[ ] Version history restore
[ ] Share link generation
[ ] Track changes accept/reject
[ ] PDF/DOCX export downloads
```

---

## 🔒 Git Workflow (REQUIRED FOR ALL AIs)

> **CRITICAL:** Follow this workflow for ALL code changes. Protects the user's work.
> **Full guide:** See `CLAUDE.md` → "GIT WORKFLOW" section for complete details.

### When to Use Git

✅ **Before** starting any feature
✅ **After** completing a working feature
✅ **End** of each coding session
❌ **Never** commit broken code

### Safety-First Workflow (9 Steps)

```bash
# 1. Check status
git status

# 2. Create backup branch (timestamped)
git checkout -b backup/before-[feature]-$(date +%Y%m%d)
git add -A && git commit -m "backup: Before [feature]"
git checkout main

# 3. Create feature branch
git checkout -b feature/[description]

# 4-5. Make changes, test thoroughly
npm run dev && npx tsc --noEmit

# 6. Commit with clear message
git add -A
git commit -m "feat: [what you added]"
# OR: "fix: [what you fixed]"
# OR: "improve: [what you improved]"

# 7. Switch back to main
git checkout main

# 8. Merge feature
git merge feature/[description]

# 9. Push to GitHub
git push origin main
```

### Emergency Recovery

**If something breaks:**
```bash
# Option 1: Undo last commit (keep changes)
git reset --soft HEAD~1

# Option 2: Abandon ALL changes since last commit
git reset --hard HEAD

# Option 3: Return to backup branch
git branch | grep backup  # List backups
git checkout backup/[name]
```

### AI Assistant Rules

**I MUST:**
- ✅ Create backup branch before ANY changes
- ✅ Work on feature branches, not main
- ✅ Test before committing
- ✅ Use clear commit messages
- ✅ Explain Git commands to user

**I MUST NEVER:**
- ❌ Commit broken code
- ❌ Force-push without warning
- ❌ Delete code without permission
- ❌ Skip testing before merge

### Protected Files (Never Commit)

```gitignore
.env.local          # API keys
node_modules/       # Dependencies
.next/              # Build output
```

**Full detailed guide with examples:** `CLAUDE.md` (400+ lines)

---

## Critical Rules

### Security
- **NEVER commit `.env.local`**
- **NEVER hardcode API keys**
- Validate user input before Firestore
- Check user ownership for documents

### Performance
- Debounce auto-save (30 seconds)
- Debounce analysis (1 second)
- Use Firestore indexes
- Lazy load heavy components

### Code Quality
- No `any` types
- Error handling for all Firebase ops
- Comments explain WHY not WHAT
- Match existing patterns

---

## Multi-AI Collaboration

This project works with multiple AI assistants:

| AI | Best For |
|----|----------|
| **Claude Code** | Complex features, architecture |
| **Gemini** | Research, alternative approaches |
| **Codex/Copilot** | Code completion |
| **ChatGPT** | Research, content generation |

**Documentation:**
- `CLAUDE.md` - Claude-specific instructions
- `GEMINI.md` - Gemini-specific instructions
- `HANDOVER.md` - Complete 50-feature status

---

## Quick Reference

**Project:** Academic Writing Platform
**Port:** 2550
**URL:** http://localhost:2550

**Commands:**
```bash
npm run dev          # Start server
npm run build        # Production build
npx tsc --noEmit     # Type check
```

**Key Files:**
- `HANDOVER.md` - All 50 features documented
- `.env.local` - API keys (never commit)
- `lib/firebase/schema.ts` - Data types

---

**Last Updated:** January 2, 2026
**Status:** All 6 Phases Complete
**Features:** 50 implemented
**Maintained by:** Dr. Shailesh
