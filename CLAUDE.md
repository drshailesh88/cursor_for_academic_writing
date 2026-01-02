# Claude Code Instructions

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

---

## 🎯 Project Overview

**Academic Writing Platform** - AI-powered academic writing system with PubMed research integration, multi-LLM support, and professional document export capabilities.

**Current Status:** Firebase integration complete, export features pending
**Tech Stack:** Next.js 14, TypeScript, TipTap Editor, Firebase, Vercel AI SDK
**Port:** 2550

---

## 📚 Essential Documentation

Before making changes, review:
- `README.md` - Project overview and setup
- `HANDOVER.md` - Complete implementation status and architecture
- `FIREBASE_SETUP.md` - Firebase configuration guide

---

## 🏗️ Architecture Principles

### Core Philosophy
1. **Academic Excellence** - Authentic scholarly prose, not corporate marketing speak
2. **Citation Integrity** - Proper author-year citations, PubMed integration
3. **Multi-LLM Flexibility** - Support OpenAI, Anthropic, Google, OpenRouter, xAI
4. **Firebase-First** - Real-time sync, auto-save, user authentication
5. **Professional Export** - DOCX and PDF with proper formatting

### Key Patterns
- **Auto-save:** 30-second debounced saves to Firestore
- **Three-panel layout:** Document list | Editor | AI Chat
- **Client-side Firebase:** Real-time updates and auth
- **Server-side Admin SDK:** For future server operations

---

## 💻 Coding Standards

### TypeScript
- Strict mode enabled
- No `any` types - use proper type definitions
- Interfaces for props, types for data structures
- Import types from `@/lib/firebase/schema`

### File Naming
- Components: `kebab-case.tsx`
- Hooks: `use-kebab-case.ts`
- Utils: `kebab-case.ts`
- All lowercase, hyphen-separated

### Component Structure
```typescript
'use client'; // Only if uses hooks/state

// Imports: external → firebase → components → types
import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Document } from '@/lib/firebase/schema';

interface ComponentProps {
  // Props with JSDoc if complex
}

export function ComponentName({ props }: ComponentProps) {
  // 1. Hooks first
  // 2. Effects
  // 3. Event handlers
  // 4. Early returns
  // 5. Main render
}
```

### Import Order
```typescript
// 1. React/Next
import { useState, useEffect } from 'react';

// 2. External libraries
import { Editor } from '@tiptap/react';

// 3. Firebase/lib
import { useAuth } from '@/lib/firebase/auth';

// 4. Components
import { Button } from '@/components/ui/button';

// 5. Types
import { Document } from '@/lib/firebase/schema';
```

---

## ✍️ Writing Style (Academic Prose)

### Tone: Eric Topol-inspired
- **Conversational yet authoritative** - Like a mentor explaining to a colleague
- **Data-driven but accessible** - Cite studies naturally: "A 2023 meta-analysis (Smith et al.) found..."
- **Cautiously optimistic** - "Early evidence suggests..." not "Revolutionary breakthrough!"
- **Nuanced** - Acknowledge limitations and conflicting data

### Avoid
- ❌ Marketing speak: "game-changing," "revolutionary," "breakthrough"
- ❌ Absolute claims: "proves," "definitively shows," "always"
- ❌ Passive voice overuse: "It was found that..." → "Researchers found..."
- ❌ Jargon without explanation

### Prefer
- ✅ Active voice: "The study demonstrated..."
- ✅ Precise language: "increased by 23%" not "greatly increased"
- ✅ Natural citations: "Recent work by Zhang and colleagues (2024) indicates..."
- ✅ Clear transitions: "However," "Moreover," "In contrast,"

### Example Transformation
**Before (Marketing):**
> This groundbreaking AI technology revolutionizes medical diagnosis with unprecedented accuracy!

**After (Academic):**
> Recent advances in deep learning architectures have shown promise in medical image classification. A 2024 study (Chen et al.) reported 94% diagnostic accuracy on chest X-rays, though validation across diverse populations remains necessary.

---

## 🔧 Common Tasks

### Adding a New Feature
1. Check `HANDOVER.md` for existing architecture
2. Create feature branch if using git
3. Update types in `lib/firebase/schema.ts` if needed
4. Implement component in appropriate directory
5. Test with Firebase (sign in, save, load)
6. Update `HANDOVER.md` with changes

### Working with Firebase
- Client SDK: `lib/firebase/client.ts`
- Admin SDK: `lib/firebase/admin.ts`
- Auth: `lib/firebase/auth.ts`
- Documents: `lib/firebase/documents.ts`
- Schema: `lib/firebase/schema.ts`

### Testing Changes
```bash
npm run dev          # Start dev server on localhost:2550
npm run build        # Check for TypeScript errors
npm run type-check   # Type checking only
```

---

## 🚨 Critical Rules

### Security
- **NEVER commit `.env.local`** - Contains API keys
- **NEVER hardcode secrets** - Always use environment variables
- Validate user input before Firestore writes
- Use Firebase security rules (already configured)

### Performance
- Debounce auto-save (current: 30 seconds)
- Use React.memo for expensive components
- Lazy load components where appropriate
- Optimize Firestore queries (use indexes)

### Firebase Best Practices
- **Client-side:** Auth, real-time listeners, user operations
- **Server-side:** Batch operations, admin tasks, sensitive data
- Always include error handling for Firebase operations
- Use transactions for critical updates

---

## 📋 Current Priorities (as of Dec 2025)

### Completed ✅
- TipTap editor with table support
- Firebase auth (Google Sign-in)
- Document CRUD operations
- Auto-save (30-second interval)
- AI chat with 4 models
- PubMed integration
- Three-panel resizable layout

### In Progress ⏳
- DOCX export (`lib/export/docx.ts`)
- PDF export (`lib/export/pdf.ts`)

### Pending 📌
- Export button component
- Additional auth providers (email/password)
- Collaborative editing
- Citation manager UI
- Advanced formatting options

---

## 🔍 Debugging

### Common Issues
1. **Firebase errors on load**
   - Check `.env.local` has all Firebase variables
   - Verify Firebase project is active
   - Check console for specific error

2. **Auto-save not working**
   - Check `useDocument` hook is properly initialized
   - Verify user is authenticated
   - Check Firestore permissions

3. **AI chat not responding**
   - Verify API key in `.env.local`
   - Check `/api/chat/route.ts` for errors
   - Ensure model is available

### Useful Commands
```bash
# Check Firebase connection
npm run dev | grep -i firebase

# Type check without building
npx tsc --noEmit

# View logs
tail -f .next/trace
```

---

## 🎨 UI/UX Guidelines

### Theme
- **Colors:** Deep purple (academic), warm gray (text), scholarly gold (accents)
- **Typography:** Inter for UI, Georgia/serif for editor content
- **Spacing:** Consistent 8px grid
- **Dark mode:** Full support required

### Components
- Use shadcn/ui components as base
- Custom academic theme overrides in `app/globals.css`
- Resizable panels via `react-resizable-panels`
- Icons from `lucide-react`

### Accessibility
- Semantic HTML
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus visible states

---

## 🤝 Working with Other LLMs

This project supports work with multiple AI assistants:
- **Claude** (you!) - Main development and writing
- **Gemini** - Alternative development, research queries
- **Codex/Copilot** - Code completion and suggestions
- **ChatGPT** - Research and content generation

**See also:**
- `GEMINI.md` for Gemini-specific instructions
- `AGENTS.md` for universal AI agent guidelines

---

## 📝 Notes

- Always read existing code before modifying
- Prefer editing over creating new files
- Keep solutions simple and focused
- Don't over-engineer or add unnecessary features
- Document significant architectural decisions
- Update `HANDOVER.md` after major changes

---

**Last Updated:** January 2, 2026
**Project Location:** `/Users/shaileshsingh/cursor for academic writing`
**Maintained by:** Dr. Shailesh
