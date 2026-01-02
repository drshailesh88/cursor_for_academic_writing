# Task Master AI - Development Workflow

## 🎯 Purpose

Task Master provides structured development workflows for the Academic Writing Platform. These commands and patterns ensure consistent, high-quality development across all AI assistants.

---

## 📋 Task Management

### Creating Tasks
When starting work on a feature or fix:

```
1. Break down the work into specific, actionable tasks
2. Use TodoWrite tool to track tasks
3. Mark tasks as in_progress → completed as you work
4. One task in_progress at a time
```

### Task Granularity
- ✅ Good: "Create DOCX export function in lib/export/docx.ts"
- ✅ Good: "Add export button to top bar"
- ❌ Too broad: "Implement export feature"
- ❌ Too granular: "Import docx library"

---

## 🔄 Development Workflow

### Standard Workflow
```
1. UNDERSTAND
   - Read HANDOVER.md for current status
   - Review related files
   - Understand the architecture

2. PLAN
   - Create TodoWrite task list
   - Identify files to modify/create
   - Note any dependencies

3. IMPLEMENT
   - Write code following standards
   - Test as you go
   - Mark tasks complete

4. VERIFY
   - Run type checking: npx tsc --noEmit
   - Test in browser (localhost:2550)
   - Verify Firebase integration if applicable

5. DOCUMENT
   - Update HANDOVER.md if significant
   - Add comments for complex logic
   - Update types if schema changes
```

---

## 🧪 Testing Protocol

### Before Committing
```bash
# Type check
npx tsc --noEmit

# Build check
npm run build

# Start dev server
npm run dev

# Manual testing checklist:
[ ] Sign in works
[ ] Auto-save works
[ ] New feature works as expected
[ ] No console errors
[ ] Firebase operations succeed
```

---

## 🏗️ Architecture Commands

### Adding a New Component
```
Location: components/{category}/{component-name}.tsx

Template:
'use client';
import statements...

interface {ComponentName}Props {
  // Props
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  // Implementation
}
```

### Adding a New Hook
```
Location: lib/hooks/use-{hook-name}.ts

Template:
import { useState, useEffect } from 'react';

export function use{HookName}() {
  // Hook implementation
  return { ...api };
}
```

### Adding Firebase Operations
```
Location: lib/firebase/{operation-type}.ts

Always include:
- Error handling with try/catch
- Type safety
- Return types
- JSDoc comments for complex functions
```

---

## 📦 Dependency Management

### Installing New Dependencies
```bash
# Install with legacy peer deps (Next.js compatibility)
npm install {package} --legacy-peer-deps

# Install dev dependencies
npm install -D {package} --legacy-peer-deps

# Update HANDOVER.md with:
- Package name and version
- Purpose
- Where it's used
```

### Verifying Dependencies
```bash
npm list {package}  # Check if installed
npm outdated        # Check for updates
```

---

## 🎨 UI Development

### Adding New shadcn/ui Components
```bash
# Not applicable - manual installation required
# Copy from shadcn/ui website to components/ui/
```

### Theme Updates
```
Location: app/globals.css

Colors:
- Academic purple: hsl(var(--academic-purple))
- Scholarly gold: hsl(var(--scholarly-gold))
- Warm gray: hsl(var(--warm-gray))

Follow existing CSS custom property pattern
```

---

## 🔥 Firebase Commands

### Testing Firebase Locally
```javascript
// In browser console:
import { auth } from '@/lib/firebase/client';
console.log('User:', auth.currentUser);

// Check Firestore connection:
import { db } from '@/lib/firebase/client';
console.log('DB:', db.app.name);
```

### Firestore Security Rules Pattern
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents - owner only
    match /documents/{documentId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 📝 Writing Assistance Commands

### Academic Prose Generation
When user requests academic writing:

1. **Research First**
   - Use PubMed search if citations needed
   - Gather 3-5 relevant papers
   - Note publication years and authors

2. **Write in Eric Topol Style**
   - Conversational yet authoritative
   - Data-driven: cite specific numbers
   - Balanced: acknowledge limitations
   - Accessible: explain complex concepts

3. **Citation Format**
   - Author-year in text: (Smith et al., 2023)
   - Natural integration: "Recent work by Zhang and colleagues (2024)..."
   - Reference list: Vancouver style

### Example Academic Writing Flow
```
User: "Write about AI in medical diagnosis"

Process:
1. Search PubMed: "artificial intelligence medical diagnosis 2023-2024"
2. Select 3-5 key papers
3. Draft prose:
   - Opening: state current problem/context
   - Evidence: cite specific studies with data
   - Nuance: acknowledge limitations
   - Future: cautious optimism about next steps
4. Include author-year citations
5. Format reference list
```

---

## 🐛 Debugging Commands

### Common Error Patterns

#### Firebase Auth Error
```
Error: Firebase not initialized

Fix:
1. Check .env.local has all Firebase variables
2. Verify NEXT_PUBLIC_ prefix for client variables
3. Restart dev server: npm run dev
```

#### Type Error in Editor
```
Error: Property 'editor' does not exist

Fix:
1. Check TipTap imports
2. Verify editor prop types
3. Ensure useEditor hook is properly initialized
```

#### Auto-save Not Working
```
Issue: Changes not saving to Firestore

Debug:
1. Check useDocument hook is called with correct params
2. Verify user is authenticated: useAuth()
3. Check Firestore console for document updates
4. Look for console errors in browser
```

---

## 🔍 Code Review Checklist

Before marking work complete:

### TypeScript
- [ ] No `any` types used
- [ ] All props have interfaces
- [ ] Return types specified for functions
- [ ] Imports properly typed

### React
- [ ] Components properly memoized if expensive
- [ ] useEffect dependencies correct
- [ ] No unnecessary re-renders
- [ ] Event handlers properly typed

### Firebase
- [ ] Error handling for all operations
- [ ] User authentication checked
- [ ] Proper data validation
- [ ] Security rules considered

### Style
- [ ] Follows file naming conventions
- [ ] Imports properly ordered
- [ ] No console.logs in production code
- [ ] Comments for complex logic only

---

## 🚀 Deployment Commands

### Pre-deployment Checklist
```bash
# 1. Type check
npx tsc --noEmit

# 2. Build
npm run build

# 3. Check build output
ls -lh .next

# 4. Environment variables
# Verify all production env vars are set

# 5. Firebase
# Ensure production Firebase project configured
```

### Environment-Specific Configs
```
Development: .env.local
Production: Vercel environment variables or .env.production
```

---

## 📚 Reference Commands

### Quick File Reference
```
Core Files:
- Main page: app/page.tsx
- Main layout: components/layout/three-panel-layout.tsx
- Editor: components/editor/academic-editor.tsx
- Chat: components/chat/chat-interface.tsx
- Auth: lib/firebase/auth.ts
- Documents: lib/firebase/documents.ts

Config Files:
- TypeScript: tsconfig.json
- Next.js: next.config.js
- Tailwind: tailwind.config.ts
- Environment: .env.local (DO NOT COMMIT)
```

### Git Commands (if applicable)
```bash
# Feature branch
git checkout -b feature/export-functionality

# Commit
git add .
git commit -m "feat: implement DOCX export"

# Push
git push origin feature/export-functionality
```

---

## 🎯 Priority Matrix

### Must Have (P0)
- Firebase authentication works
- Auto-save works reliably
- Editor preserves formatting
- AI chat responds

### Should Have (P1)
- DOCX export
- PDF export
- Multiple auth providers
- Citation manager

### Nice to Have (P2)
- Collaborative editing
- Template system
- Advanced formatting
- Analytics

---

## 💡 Best Practices

### Code Organization
- One component per file
- Related components in same directory
- Shared utilities in lib/utils/
- Types in lib/firebase/schema.ts

### Performance
- Use React.memo sparingly (only when proven necessary)
- Debounce expensive operations
- Optimize Firebase queries
- Lazy load heavy components

### Maintainability
- Write self-documenting code
- Comments explain WHY not WHAT
- Keep functions small and focused
- DRY principle, but don't over-abstract

---

## 🔗 Integration Points

### AI Chat API
```typescript
// Location: app/api/chat/route.ts
// Models: Claude, GPT-4o, Gemini, Qwen
// Tools: PubMed search

POST /api/chat
Body: { messages, model, tools }
Response: StreamingTextResponse
```

### PubMed Integration
```typescript
// Location: lib/pubmed/client.ts
// Direct NCBI E-utilities API

async function searchPubMed(query: string)
async function getArticleDetails(pmid: string)
```

### Firebase Integration
```typescript
// Client-side
- Authentication: lib/firebase/auth.ts
- Firestore: lib/firebase/client.ts
- Documents: lib/firebase/documents.ts

// Server-side
- Admin SDK: lib/firebase/admin.ts
```

---

**Last Updated:** January 2, 2026
**Maintained by:** Task Master AI
