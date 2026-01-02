# Universal AI Agent Instructions

## 🎯 Project: Academic Writing Platform

An AI-powered medical/scientific writing tool with PubMed research integration, multi-LLM support, and professional document export capabilities.

**Status:** Firebase complete, export features pending
**Tech Stack:** Next.js 14, TypeScript, TipTap, Firebase, Vercel AI SDK
**Development Port:** localhost:2550

---

## 📚 CRITICAL: Read These First

Before making ANY changes, read:

1. **README.md** - Project overview and quick start
2. **HANDOVER.md** - Complete implementation status and architecture
3. **FIREBASE_SETUP.md** - Firebase configuration guide

These files contain the complete context of what's built and what's pending.

---

## 🏗️ System Architecture

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode enabled)
- **Editor:** TipTap with table support
- **UI:** shadcn/ui + Tailwind CSS
- **Layout:** Three resizable panels (Document list | Editor | AI Chat)

### Backend
- **Auth:** Firebase Authentication (Google Sign-in)
- **Database:** Firestore (real-time document storage)
- **AI:** Vercel AI SDK (multi-model support)
- **Research:** PubMed E-utilities API (direct integration)

### AI Models Supported
1. Claude Sonnet 3.5 (Anthropic)
2. GPT-4o (OpenAI)
3. Gemini 2.0 Flash (Google)
4. Qwen 2.5 72B (OpenRouter)

---

## 📁 Project Structure

```
/Users/shaileshsingh/cursor for academic writing/
├── .env.local              # API keys (DO NOT COMMIT)
├── .env.example            # Environment template
├── README.md               # Project overview
├── HANDOVER.md             # Implementation status
├── FIREBASE_SETUP.md       # Firebase guide
├── package.json            # Dependencies
│
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   ├── globals.css         # Academic theme
│   └── api/chat/route.ts   # AI chat endpoint
│
├── components/
│   ├── layout/             # Three-panel layout
│   ├── editor/             # TipTap editor
│   ├── chat/               # AI chat interface
│   ├── auth/               # Auth components
│   ├── history/            # Document list
│   └── ui/                 # shadcn/ui base
│
├── lib/
│   ├── firebase/           # Firebase client & admin
│   ├── hooks/              # Custom React hooks
│   ├── export/             # DOCX/PDF export (pending)
│   ├── pubmed/             # PubMed API client
│   ├── citations/          # Citation formatting
│   ├── prompts/            # AI writing styles
│   └── utils/              # Utilities
│
└── types/                  # TypeScript types
```

---

## 💻 Coding Standards

### TypeScript
```typescript
// ✅ ALWAYS use strict types
interface ComponentProps {
  title: string;
  content?: string;
  onSave: (data: string) => Promise<void>;
}

// ❌ NEVER use 'any'
const data: any = {};  // NO

// ✅ Use proper types
const data: Document = {};  // YES

// Interfaces for props, types for data structures
interface ButtonProps { }
type Document = { }
```

### File Naming
- **Components:** `kebab-case.tsx` (e.g., `academic-editor.tsx`)
- **Hooks:** `use-kebab-case.ts` (e.g., `use-document.ts`)
- **Utilities:** `kebab-case.ts` (e.g., `author-year-parser.ts`)

### Import Order
```typescript
// 1. React/Next
import { useState, useEffect } from 'react';

// 2. External libraries
import { Editor } from '@tiptap/react';

// 3. Internal lib (Firebase, hooks, utils)
import { useAuth } from '@/lib/firebase/auth';

// 4. Components
import { Button } from '@/components/ui/button';

// 5. Types
import { Document } from '@/lib/firebase/schema';
```

### Component Pattern
```typescript
'use client'; // Only if uses hooks or state

import statements...

interface ComponentNameProps {
  // Props with JSDoc for complex ones
}

export function ComponentName({ props }: ComponentNameProps) {
  // 1. Hooks first
  const [state, setState] = useState();

  // 2. Effects
  useEffect(() => {}, []);

  // 3. Event handlers
  const handleClick = () => {};

  // 4. Early returns (loading, error states)
  if (loading) return <Loader />;

  // 5. Main render
  return <div>...</div>;
}
```

---

## ✍️ Academic Writing Guidelines

### Target Style: Eric Topol-inspired Medical Writing

**Characteristics:**
- Conversational yet authoritative
- Data-driven with specific metrics
- Balanced with appropriate caveats
- Accessible without oversimplification

### Transformation Example
```
❌ MARKETING SPEAK:
"Revolutionary AI technology transforms healthcare with
groundbreaking diagnostic capabilities!"

✅ ACADEMIC STYLE:
"Recent advances in convolutional neural networks have shown
promise in medical image classification. A 2024 multicenter
study (Chen et al.) reported 94% diagnostic accuracy on chest
X-rays for pneumonia detection, though validation across
diverse patient populations and imaging protocols remains
necessary before clinical deployment."
```

### Writing Rules
```
✅ DO:
- Use active voice: "The study demonstrated..."
- Be precise: "increased by 23% (p<0.001)"
- Cite naturally: "Recent work by Zhang and colleagues (2024)..."
- Acknowledge limitations: "though further validation is needed"
- Use transitions: "However," "Moreover," "In contrast,"

❌ AVOID:
- Absolute claims: "proves," "definitively," "always"
- Marketing buzzwords: "revolutionary," "game-changing," "breakthrough"
- Passive overuse: "It was found that..."
- Unexplained jargon
```

### Citation Format
- **In-text:** Author-year (Smith et al., 2023)
- **Reference list:** Vancouver style
- **Integration:** Natural flow, not just parenthetical

---

## 🔥 Firebase Integration

### Key Concepts
1. **Client SDK** (`lib/firebase/client.ts`) - For browser/UI
2. **Admin SDK** (`lib/firebase/admin.ts`) - For server operations
3. **Auto-save** - 30-second debounced saves
4. **Real-time sync** - Document updates propagate immediately

### Authentication
```typescript
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
import {
  createDocument,
  getDocument,
  updateDocument,
  getUserDocuments
} from '@/lib/firebase/documents';

// Create new document
const doc = await createDocument(userId, {
  title: 'Untitled',
  content: '',
  wordCount: 0
});

// Update existing document
await updateDocument(docId, {
  content: newContent,
  wordCount: countWords(newContent),
  updatedAt: new Date()
});

// Load user's documents
const docs = await getUserDocuments(userId);
```

---

## 🤖 AI Chat System

### Endpoint
```
POST /api/chat
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Search for CRISPR papers" }
  ],
  "model": "claude-3-5-sonnet-20241022"
}

Response: StreamingTextResponse (SSE)
```

### Available Models
```typescript
const models = [
  'claude-3-5-sonnet-20241022',    // Anthropic
  'gpt-4o',                         // OpenAI
  'gemini-2.0-flash-exp',          // Google
  'qwen/qwen-2.5-72b-instruct'     // OpenRouter
];
```

### PubMed Search Tool
```typescript
// Automatically available in AI chat
{
  name: 'search_pubmed',
  description: 'Search medical/scientific literature',
  parameters: {
    query: string,
    maxResults?: number,
    yearFrom?: number,
    yearTo?: number
  }
}
```

---

## 🎨 UI/UX Standards

### Theme
```css
/* Academic color palette */
--academic-purple: hsl(270, 50%, 40%)
--scholarly-gold: hsl(45, 80%, 60%)
--warm-gray: hsl(30, 10%, 50%)

/* Dark mode support required */
```

### Component Guidelines
- Use shadcn/ui as foundation
- Apply academic theme overrides
- Support keyboard navigation
- Include ARIA labels
- Test in dark mode

---

## 🧪 Testing & Verification

### Before Committing Code
```bash
# Type check
npx tsc --noEmit

# Build check
npm run build

# Run dev server
npm run dev
```

### Manual Testing Checklist
```
[ ] Firebase auth works
[ ] Documents auto-save every 30s
[ ] Document list updates in real-time
[ ] Editor preserves formatting
[ ] AI chat responds correctly
[ ] PubMed search returns results
[ ] No console errors
[ ] Dark mode works properly
```

---

## 📋 Current Project Status

### ✅ Completed Features
- TipTap rich text editor with table support
- Firebase Authentication (Google Sign-in)
- Firestore document persistence
- Auto-save mechanism (30-second interval)
- Document CRUD operations
- AI chat with 4 models
- PubMed research integration
- Three-panel resizable layout
- Dark mode support

### ⏳ In Progress
- DOCX export (`lib/export/docx.ts`)
- PDF export (`lib/export/pdf.ts`)

### 📌 Pending
- Export button component
- Email/password authentication
- Citation manager UI
- Collaborative editing
- Template system
- Advanced formatting options

---

## 🚨 Critical Rules

### Security
- **NEVER commit `.env.local`** - Contains API keys
- **NEVER hardcode secrets** - Always use environment variables
- Validate all user input before Firestore writes
- Respect Firebase security rules

### Performance
- Debounce expensive operations (e.g., auto-save)
- Use React.memo only when proven necessary
- Optimize Firestore queries
- Lazy load heavy components

### Code Quality
- No `any` types in TypeScript
- Write self-documenting code
- Comments explain WHY, not WHAT
- Keep functions small and focused
- Follow DRY principle (Don't Repeat Yourself)
- Match existing code patterns

---

## 🔧 Common Tasks

### Adding a Component
```typescript
// File: components/{category}/{name}.tsx
'use client';

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState();

  return <div>{/* Implementation */}</div>;
}
```

### Adding a Firebase Operation
```typescript
// File: lib/firebase/{operation}.ts
import { db } from './client';
import { doc, getDoc } from 'firebase/firestore';

export async function myOperation(id: string) {
  try {
    const docRef = doc(db, 'collection', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error('Not found');
    }

    return snap.data();
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
}
```

### Adding a Custom Hook
```typescript
// File: lib/hooks/use-{name}.ts
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

## 🤝 Multi-AI Collaboration

This project supports work across multiple AI assistants:

- **Claude Code** - Primary development and complex tasks
- **Gemini** - Development, research, alternative approaches
- **Codex/Copilot** - Code completion and suggestions
- **ChatGPT** - Research and content generation

**See also:**
- `CLAUDE.md` - Claude-specific instructions
- `GEMINI.md` - Gemini-specific instructions
- `.taskmaster/CLAUDE.md` - Task Master workflow

---

## 📞 Quick Reference

**Project Name:** Academic Writing Platform
**Location:** `/Users/shaileshsingh/cursor for academic writing`
**Port:** 2550
**Dev Server:** `npm run dev`
**URL:** http://localhost:2550

**Key Commands:**
```bash
npm run dev          # Start development server
npm run build        # Production build
npx tsc --noEmit     # Type checking only
```

**Critical Files:**
- `.env.local` - API keys (NEVER commit)
- `README.md` - Project overview
- `HANDOVER.md` - Implementation status
- `package.json` - Dependencies

---

## 💡 Best Practices

1. **Read before writing** - Always check existing code first
2. **Follow HANDOVER.md** - It has the complete implementation status
3. **Test with Firebase** - Verify auth and save operations
4. **Use TypeScript strictly** - No `any` types
5. **Keep it simple** - Avoid over-engineering
6. **Update documentation** - Change HANDOVER.md for significant work
7. **Maintain style** - Match existing code patterns
8. **Handle errors** - Always wrap Firebase operations in try/catch

---

## 🐛 Troubleshooting

### Firebase Connection Issues
```bash
# Check environment variables
cat .env.local | grep FIREBASE

# Restart dev server
npm run dev
```

### Type Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Auto-save Not Working
```typescript
// Verify:
1. User is authenticated (check useAuth())
2. Document ID is valid
3. Firestore permissions are correct
4. Check browser console for errors
```

---

**Last Updated:** January 2, 2026
**Optimized for:** All AI assistants (Claude, Gemini, Codex, ChatGPT, etc.)
**Maintained by:** Dr. Shailesh
