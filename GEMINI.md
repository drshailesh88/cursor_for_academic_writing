# Gemini AI Instructions

## 🎯 Project Context

You are assisting with the **Academic Writing Platform** - an AI-powered tool for medical/scientific writing with PubMed integration, multi-LLM support, and professional document export.

**Current Status:** Firebase complete, export features pending
**Tech:** Next.js 14, TypeScript, TipTap, Firebase, Vercel AI SDK
**Port:** localhost:2550

---

## 📚 Essential Reading

**CRITICAL:** Read these files before starting any task:
1. `README.md` - Project overview
2. `HANDOVER.md` - Complete implementation status
3. `FIREBASE_SETUP.md` - Firebase configuration

These files contain the full context of what's built and what needs work.

---

## 🏗️ Architecture Overview

### Tech Stack
```
Frontend:
- Next.js 14 (App Router)
- TypeScript (strict mode)
- TipTap editor
- shadcn/ui + Tailwind CSS
- React Resizable Panels

Backend:
- Firebase Auth (Google Sign-in)
- Firestore (documents storage)
- Vercel AI SDK (multi-LLM)
- PubMed E-utilities API

AI Models:
- Claude Sonnet 3.5 (Anthropic)
- GPT-4o (OpenAI)
- Gemini 2.0 Flash (Google)
- Qwen 2.5 72B (OpenRouter)
```

### Key Features
1. **Three-panel layout:** Document list | Rich text editor | AI chat
2. **Auto-save:** 30-second debounced saves to Firestore
3. **PubMed integration:** Direct search and citation retrieval
4. **Multi-LLM chat:** Switch between 4 AI models
5. **Firebase sync:** Real-time document updates

---

## 💻 Development Guidelines

### TypeScript Standards
```typescript
// Always use strict types
interface ComponentProps {
  title: string;
  onSave: (content: string) => Promise<void>;
}

// No 'any' types
// ❌ const data: any = ...
// ✅ const data: Document = ...

// Use interfaces for props, types for data
interface ButtonProps { ... }
type Document = { ... }
```

### File Organization
```
components/
  ├── layout/          # Layout components
  ├── editor/          # TipTap editor
  ├── chat/            # AI chat interface
  ├── auth/            # Authentication
  ├── history/         # Document list
  └── ui/              # shadcn/ui components

lib/
  ├── firebase/        # Firebase client & admin
  ├── hooks/           # Custom React hooks
  ├── export/          # DOCX/PDF export (pending)
  ├── pubmed/          # PubMed API client
  └── utils/           # Utilities

app/
  ├── api/chat/        # AI chat endpoint
  ├── page.tsx         # Main page
  └── layout.tsx       # Root layout
```

### Naming Conventions
- **Files:** kebab-case.tsx (e.g., `three-panel-layout.tsx`)
- **Components:** PascalCase (e.g., `ThreePanelLayout`)
- **Hooks:** use prefix (e.g., `useDocument`)
- **Types:** PascalCase (e.g., `DocumentSchema`)

---

## ✍️ Academic Writing Style

### Target: Eric Topol-inspired Medical Writing

**Characteristics:**
- Conversational yet authoritative
- Data-driven with specific numbers
- Balanced with nuance
- Accessible without being simplistic

**Example:**
```
❌ Marketing speak:
"Revolutionary AI breakthrough transforms medical diagnosis!"

✅ Academic style:
"Recent advances in deep learning have shown promise in medical
image classification. A 2024 study (Chen et al.) reported 94%
diagnostic accuracy on chest X-rays, though validation across
diverse populations remains necessary."
```

### Citation Style
- **In-text:** Author-year format (Smith et al., 2023)
- **Reference list:** Vancouver style
- **Natural integration:** "Recent work by Zhang and colleagues (2024)..."

### Writing Guidelines
```
✅ DO:
- Use active voice: "The study demonstrated..."
- Be precise: "increased by 23%"
- Acknowledge limitations
- Cite specific data points
- Use natural transitions

❌ AVOID:
- Marketing language: "game-changing," "revolutionary"
- Absolute claims: "proves," "always"
- Passive voice overuse: "It was found that..."
- Unexplained jargon
```

---

## 🔥 Firebase Integration

### Authentication
```typescript
// Client-side auth hook
import { useAuth } from '@/lib/firebase/auth';

function Component() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <button onClick={signIn}>Sign In</button>;

  return <div>Welcome {user.displayName}</div>;
}
```

### Document Operations
```typescript
// CRUD operations
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getUserDocuments
} from '@/lib/firebase/documents';

// Create
const doc = await createDocument(userId, {
  title: 'New Document',
  content: '',
  wordCount: 0
});

// Read
const doc = await getDocument(docId);

// Update
await updateDocument(docId, {
  content: newContent,
  wordCount: count,
  updatedAt: new Date()
});

// List
const docs = await getUserDocuments(userId);
```

### Auto-save Pattern
```typescript
// Used in useDocument hook
import { debounce } from 'lodash';

const saveDocument = debounce(async (content: string) => {
  await updateDocument(documentId, {
    content,
    wordCount: countWords(content),
    updatedAt: new Date()
  });
}, 30000); // 30 seconds
```

---

## 🤖 AI Chat Integration

### Chat Endpoint
```typescript
// Location: app/api/chat/route.ts
// Supports 4 models with streaming responses

POST /api/chat
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Search PubMed for CRISPR" }
  ],
  "model": "claude-3-5-sonnet-20241022"
}

Response: StreamingTextResponse
```

### PubMed Search Tool
```typescript
// Available in AI chat
{
  name: 'search_pubmed',
  description: 'Search medical literature',
  parameters: {
    query: string,
    maxResults?: number,
    yearFrom?: number,
    yearTo?: number
  }
}

// Returns:
{
  articles: [{
    pmid: string,
    title: string,
    authors: string[],
    journal: string,
    year: number,
    abstract: string,
    doi?: string
  }]
}
```

---

## 🎨 UI/UX Guidelines

### Theme Colors
```css
/* Academic palette */
--academic-purple: hsl(270, 50%, 40%)
--scholarly-gold: hsl(45, 80%, 60%)
--warm-gray: hsl(30, 10%, 50%)

/* Supports dark mode */
.dark {
  --background: hsl(240, 10%, 10%);
  --foreground: hsl(0, 0%, 95%);
}
```

### Component Patterns
```typescript
// Use shadcn/ui as base
import { Button } from '@/components/ui/button';

// Academic theme overrides in globals.css
<Button variant="academic">Save</Button>

// Resizable panels for layout
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
```

### Accessibility
- Use semantic HTML
- Include ARIA labels
- Support keyboard navigation
- Maintain focus states
- Test with screen readers

---

## 🧪 Testing & Debugging

### Before Committing
```bash
# Type check
npx tsc --noEmit

# Build check
npm run build

# Start dev server
npm run dev
```

### Manual Testing Checklist
```
[ ] Firebase auth works (sign in/out)
[ ] Documents save automatically
[ ] Document list shows all docs
[ ] Editor preserves formatting
[ ] AI chat responds correctly
[ ] PubMed search returns results
[ ] No console errors
[ ] Dark mode works
```

### Common Issues

**Firebase not connecting:**
```bash
# Check .env.local has all variables
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# etc.

# Restart dev server
npm run dev
```

**Auto-save not working:**
```typescript
// Check useDocument hook
const { document, saveDocument, loading } = useDocument(docId);

// Verify user is authenticated
const { user } = useAuth();
if (!user) return;

// Check Firestore console for updates
```

**Type errors:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

---

## 📋 Current Priorities

### ✅ Completed
- TipTap editor with tables
- Firebase auth & Firestore
- Auto-save (30s interval)
- Document CRUD
- AI chat (4 models)
- PubMed integration
- Three-panel layout

### ⏳ In Progress
- DOCX export implementation
- PDF export implementation

### 📌 Upcoming
- Export button UI
- Citation manager
- Email/password auth
- Collaborative editing
- Template system

---

## 🔧 Common Tasks

### Adding a New Component
```typescript
// Location: components/{category}/{name}.tsx
'use client';

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState();

  return (
    <div>
      {/* Implementation */}
    </div>
  );
}
```

### Adding a Firebase Operation
```typescript
// Location: lib/firebase/{operation}.ts
import { db } from './client';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

export async function myOperation(id: string) {
  try {
    const docRef = doc(db, 'collection', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Not found');
    }

    return docSnap.data();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### Adding a Custom Hook
```typescript
// Location: lib/hooks/use-{name}.ts
import { useState, useEffect } from 'react';

export function useMyHook(param: string) {
  const [state, setState] = useState();

  useEffect(() => {
    // Effect logic
  }, [param]);

  return { state, setState };
}
```

---

## 🚨 Critical Rules

### Security
- **NEVER commit .env.local** - Contains API keys
- **NEVER hardcode secrets** - Use environment variables
- Validate all user input before Firestore writes
- Use Firebase security rules

### Performance
- Debounce expensive operations (auto-save)
- Use React.memo sparingly
- Optimize Firestore queries
- Lazy load heavy components

### Code Quality
- No `any` types in TypeScript
- Write self-documenting code
- Comments explain WHY not WHAT
- Keep functions focused
- Follow existing patterns

---

## 🤝 Working with Other AI Assistants

This project supports multiple AI tools:
- **Claude Code** - Primary development AI
- **Gemini** (you!) - Development, research
- **Codex/Copilot** - Code completion
- **ChatGPT** - Research, writing

**See also:**
- `CLAUDE.md` for Claude-specific instructions
- `AGENTS.md` for universal AI guidelines

---

## 📞 Quick Reference

**Project:** Academic Writing Platform
**Location:** `/Users/shaileshsingh/cursor for academic writing`
**Port:** 2550
**Dev Server:** `npm run dev`
**Main URL:** http://localhost:2550

**Key Commands:**
```bash
npm run dev          # Start dev server
npm run build        # Production build
npx tsc --noEmit     # Type check only
```

**Environment Files:**
- `.env.local` - Local development (DO NOT COMMIT)
- `.env.example` - Template file

**Key Documentation:**
- `README.md` - Project overview
- `HANDOVER.md` - Implementation status
- `FIREBASE_SETUP.md` - Firebase guide

---

## 💡 Pro Tips

1. **Always read before writing** - Check existing code first
2. **Follow the handover doc** - It has the complete status
3. **Test with Firebase** - Sign in and save to verify
4. **Use TypeScript strictly** - It catches bugs early
5. **Keep it simple** - Don't over-engineer
6. **Update docs** - Change HANDOVER.md if significant

---

**Last Updated:** January 2, 2026
**Optimized for:** Google Gemini models
**Maintained by:** Dr. Shailesh
