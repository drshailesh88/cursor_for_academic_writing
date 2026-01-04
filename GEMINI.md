# Gemini AI Instructions

## Project: Academic Writing Platform

An AI-powered academic writing system with multi-database research, plagiarism detection, collaboration features, and professional document export.

**Status:** All 6 Phases Complete (50 features)
**Tech:** Next.js 14, TypeScript, TipTap, Firebase, Vercel AI SDK
**Port:** localhost:2550

---

## Essential Reading

**CRITICAL:** Read these files before starting any task:

1. **HANDOVER.md** - Complete implementation status (50 features, 6 phases)
2. **CLAUDE.md** - Coding standards and architecture
3. **FIREBASE_SETUP.md** - Firebase configuration

---

## What's Been Built (6 Phases)

### Phase 1: Multi-Database Research
- **4 Academic Databases:** PubMed, arXiv, Semantic Scholar, OpenAlex
- **15 Scientific Disciplines** with custom AI prompts
- **Unified Search** with DOI-based deduplication
- Files: `lib/research/`, `lib/prompts/disciplines/`

### Phase 2: Citation Management
- **Paperpile-Style Library:** 30+ reference types
- **Cite-While-You-Write:** Cmd+Shift+P shortcut
- **10 CSL Styles:** APA, MLA, Chicago, Vancouver, Harvard, IEEE, AMA, Nature, Cell
- **Import/Export:** BibTeX, RIS, CSV, JSON
- Files: `lib/citations/`, `components/citations/`

### Phase 3A: Writing Analysis
- **Readability:** Flesch, Flesch-Kincaid, Gunning Fog
- **Style:** Passive voice, adverbs, sentence variety
- **Vocabulary:** Clichés, hedging, filler words
- **Academic Checks:** First-person, formality score
- Files: `lib/writing-analysis/`, `components/writing-analysis/`

### Phase 3B: AI Writing + Detection
- **16 AI Actions:** Paraphrase, simplify, expand, formalize, etc.
- **Floating Toolbar:** Appears on text selection
- **GPTZero-Style Detection:** Burstiness, predictability, vocabulary
- Files: `lib/ai-writing/`, `lib/ai-detection/`, `app/api/ai-writing/`

### Phase 4: Plagiarism Detection
- **N-gram Fingerprinting:** Winnowing algorithm
- **Similarity:** Jaccard, containment, overlap
- **Detection:** Exact, near-exact, paraphrase, mosaic
- **Patterns:** Unicode substitution, invisible characters
- Files: `lib/plagiarism/`, `components/plagiarism/`

### Phase 5: Enhanced PDF Export
- Running headers, page numbers (Page X of Y)
- Optional line numbers, double spacing
- Auto-generated Table of Contents
- Optional watermarks (draft, confidential)
- Files: `lib/export/pdf.ts`

### Phase 6: Collaboration
- **Comments:** Threaded replies, resolve/unresolve, suggestions
- **Version History:** Auto-save every 5 min, restore with backup
- **Sharing:** Link sharing, email sharing, password protection
- **Track Changes:** TipTap marks, accept/reject, batch operations
- Files: `lib/collaboration/`, `components/collaboration/`

---

## Architecture

```
Frontend:
├── Next.js 14 (App Router)
├── TypeScript (strict mode)
├── TipTap (with track changes extensions)
├── shadcn/ui + Tailwind CSS
└── React Resizable Panels

Backend:
├── Firebase Auth (Google Sign-in)
├── Firestore (documents + subcollections)
├── Vercel AI SDK (14 models)
└── 4 Academic Database APIs

AI Models (14 total):
├── Premium: Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Flash
└── Free: Llama 3.3, Qwen 2.5, DeepSeek V3, + more via OpenRouter
```

---

## Key File Locations

```
app/
├── api/chat/route.ts           # AI chat endpoint
├── api/ai-writing/route.ts     # AI writing actions
├── shared/[token]/page.tsx     # Share link validation
└── globals.css                 # Theme + track changes CSS

components/
├── editor/academic-editor.tsx  # Main TipTap editor
├── chat/chat-interface.tsx     # AI chat + model selector
├── plagiarism/plagiarism-panel.tsx
├── writing-analysis/analysis-panel.tsx
└── collaboration/
    ├── comments-sidebar.tsx
    ├── version-history-panel.tsx
    ├── share-dialog.tsx
    ├── track-changes-toolbar.tsx
    └── track-changes-panel.tsx

lib/
├── firebase/                   # Auth, Firestore, schema
├── hooks/                      # 10+ custom hooks
│   ├── use-document.ts
│   ├── use-plagiarism.ts
│   ├── use-comments.ts
│   ├── use-versions.ts
│   ├── use-sharing.ts
│   └── use-track-changes.ts
├── research/                   # 4 database clients
├── citations/                  # CSL formatter, import/export
├── plagiarism/                 # Fingerprint, similarity, detector
├── collaboration/              # Comments, versions, sharing, track-changes
├── writing-analysis/           # Analyzers
├── ai-writing/                 # Action types, prompts
├── ai-detection/               # GPTZero-style detection
└── export/                     # DOCX, enhanced PDF
```

---

## Development Standards

### TypeScript
```typescript
// Always strict types - NO 'any'
interface ComponentProps {
  documentId: string;
  onSave: (content: string) => Promise<void>;
}

// Interfaces for props, types for data
interface EditorProps { }
type Document = { }
```

### File Naming
```
Components:  kebab-case.tsx     (share-dialog.tsx)
Hooks:       use-kebab-case.ts  (use-sharing.ts)
Types:       types.ts           (lib/plagiarism/types.ts)
```

### Import Order
```typescript
// 1. React/Next
import { useState, useEffect } from 'react';

// 2. External
import { Editor } from '@tiptap/react';

// 3. Internal lib
import { useAuth } from '@/lib/firebase/auth';
import { usePlagiarism } from '@/lib/hooks/use-plagiarism';

// 4. Components
import { Button } from '@/components/ui/button';

// 5. Types
import type { Document } from '@/lib/firebase/schema';
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
  - content, selectedText, authorId, resolved, replies[]

/documents/{docId}/versions/{versionId}
  - type: 'auto' | 'manual' | 'restore-backup'
  - content, wordCount, label, createdBy, createdAt

/documents/{docId}/shares/{shareId}
  - type: 'link' | 'email'
  - permission: 'view' | 'comment' | 'edit'
  - token, email, password, expiresAt

/documents/{docId}/changes/{changeId}
  - type: 'insertion' | 'deletion'
  - content, position, authorId, status, createdAt
```

---

## Common Tasks

### Using Hooks
```typescript
// Plagiarism detection
import { usePlagiarism } from '@/lib/hooks/use-plagiarism';
const { result, checkPlagiarism, isChecking } = usePlagiarism();
await checkPlagiarism(content);

// Comments
import { useComments } from '@/lib/hooks/use-comments';
const { comments, addComment, resolveComment } = useComments(docId);

// Version history
import { useVersions } from '@/lib/hooks/use-versions';
const { versions, createSnapshot, restoreVersion } = useVersions(docId);

// Sharing
import { useSharing } from '@/lib/hooks/use-sharing';
const { shareLink, createShareLink, copyToClipboard } = useSharing(docId);
```

### Adding a Component
```typescript
// components/feature/my-component.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  documentId: string;
  onAction: () => void;
}

export function MyComponent({ documentId, onAction }: MyComponentProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <Button onClick={onAction} disabled={loading}>
        Action
      </Button>
    </div>
  );
}
```

### Adding a Firebase Operation
```typescript
// lib/firebase/my-operation.ts
import { db } from './client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function myOperation(docId: string, data: MyData) {
  try {
    const docRef = doc(db, 'documents', docId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
}
```

---

## Testing

### Commands
```bash
npm run dev          # Start on localhost:2550
npx tsc --noEmit     # Type check (must pass)
npm run build        # Production build
```

### Checklist
```
[ ] Firebase auth works
[ ] Auto-save triggers (30 seconds)
[ ] AI chat responds
[ ] Database searches return results
[ ] Plagiarism check runs
[ ] Comments work (add/reply/resolve)
[ ] Version restore works
[ ] Share link generates
[ ] Track changes accept/reject
[ ] Export downloads files
```

---

## Critical Rules

### Security
- **NEVER commit `.env.local`**
- **NEVER hardcode secrets**
- Validate user owns document before operations
- Use Firebase security rules

### Performance
- Debounce auto-save (30 sec)
- Debounce analysis (1 sec)
- Use Firestore onSnapshot for real-time
- Lazy load heavy components

### Code Quality
- No `any` types ever
- Error handling for all async ops
- Match existing patterns
- Comments explain WHY not WHAT

---

## Academic Writing Style

### Target: Eric Topol-inspired
```
❌ Marketing:
"Revolutionary AI breakthrough transforms diagnosis!"

✅ Academic:
"Recent advances in deep learning have shown promise in
medical image classification. A 2024 study (Chen et al.)
reported 94% diagnostic accuracy, though validation across
diverse populations remains necessary."
```

### Guidelines
- Active voice: "The study demonstrated..."
- Precise data: "increased by 23% (p<0.001)"
- Natural citations: "Recent work by Zhang and colleagues (2024)..."
- Acknowledge limitations: "though further validation is needed"

---

## Working with Other AIs

| AI | Best For |
|----|----------|
| Claude Code | Complex features, architecture |
| **Gemini** (you) | Research, alternatives, quick tasks |
| Codex/Copilot | Code completion |
| ChatGPT | Research, content |

**Key docs:** `HANDOVER.md` (50 features), `AGENTS.md` (universal guide)

---

## Quick Reference

**Project:** Academic Writing Platform
**Port:** 2550
**URL:** http://localhost:2550

```bash
npm run dev          # Start server
npx tsc --noEmit     # Type check
npm run build        # Build
```

**Critical files:**
- `HANDOVER.md` - All 50 features
- `.env.local` - API keys (never commit)
- `lib/firebase/schema.ts` - Types

---

**Last Updated:** January 2, 2026
**Status:** All 6 Phases Complete
**Features:** 50 implemented
**Optimized for:** Google Gemini
