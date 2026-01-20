# Academic Writing Platform - Complete Diagnosis & Handover

**Date:** January 20, 2026
**Purpose:** Document all issues, their root causes, and provide actionable plans for fixes
**For:** Future development sessions (any LLM can follow this)

---

## Executive Summary

### Why the App Isn't Working Fully

| Issue | Root Cause | Impact | Fix Difficulty |
|-------|-----------|--------|----------------|
| **Firebase Auth/Permissions** | Complex rules, dev mode conflicts | Documents don't save reliably | Medium |
| **Deep Research** | Mock implementations, no LLM calls | Feature non-functional | High |
| **Connected Papers** | Missing Semantic Scholar API key | Rate limiting (100 req/5 min) | Easy |
| **PDF Chat** | Firebase dependency, optional APIs | Works partially | Medium |
| **PPTX Export** | Node.js/browser incompatibility | Disabled intentionally | Medium |

### Key Insight from Old Project

Your previous project (`sky-space-clone`) used **Supabase from the start**, not Firebase. It was simpler because:
- Supabase has simpler auth
- PostgreSQL is straightforward
- No complex Firestore security rules

**Recommendation:** Migrate from Firebase to Supabase for database operations.

---

## Part 1: Current Working Features

### Fully Working
- [x] App loads without errors (SSR fix applied)
- [x] DEV MODE auth bypass active
- [x] AI Chat (Claude, OpenAI work; Gemini has model name issue)
- [x] PubMed/arXiv/Semantic Scholar search via unified API
- [x] TipTap rich text editor
- [x] Document creation (localStorage in dev mode)
- [x] DOCX export (button in toolbar)
- [x] PDF export (button in toolbar)
- [x] Dark/light theme toggle
- [x] Discipline selector (15 disciplines)

### Partially Working
- [ ] Document persistence (localStorage only, no cloud sync)
- [ ] Settings persistence (localStorage only)
- [ ] PDF Chat (needs Firebase + OpenAI for embeddings)
- [ ] Connected Papers (rate-limited without API key)

### Not Working
- [ ] Deep Research (mock implementations)
- [ ] PPTX Export (disabled)
- [ ] Multi-user authentication (Firebase auth complex)
- [ ] Cloud document sync

---

## Part 2: Detailed Issue Diagnosis

### Issue 1: Firebase Complexity

**Symptoms:**
- "Missing or insufficient permissions" errors
- Auth state not persisting
- Firestore queries failing

**Root Cause:**
Firebase requires:
1. Correct security rules
2. Proper auth state before queries
3. Client/server SDK separation
4. Complex initialization sequence

**Current Workaround:**
Dev mode uses localStorage (implemented in this session):
- `lib/firebase/documents.ts` - localStorage fallback
- `lib/firebase/settings.ts` - localStorage fallback
- `lib/firebase/auth.ts` - mock user in dev mode

**Permanent Fix:**
Replace Firebase with Supabase (see Part 4).

---

### Issue 2: Deep Research Non-Functional

**Location:** `lib/deep-research/`, `lib/research/deep-research/`

**Symptoms:**
- Research sessions don't produce real analysis
- No LLM-generated perspectives
- Empty synthesis reports

**Root Causes:**

1. **ResearchEngine never instantiated**
   ```typescript
   // lib/deep-research/engine.ts exports class but no singleton
   // APIs reference researchEngine but it's undefined
   ```

2. **Agent functions return mock data**
   ```typescript
   // lib/research/deep-research/agents.ts
   async generatePerspectives() {
     // Returns hardcoded perspectives, no LLM call
     return { data: staticPerspectives, confidence: 0.85 };
   }
   ```

3. **No actual LLM integration in agents**
   - `synthesizeFindings()` - no LLM
   - `identifyConsensus()` - no LLM
   - `extractFindings()` - just extracts abstracts

4. **Two conflicting implementations**
   - `lib/research/deep-research/` - simpler approach
   - `lib/deep-research/` - EventEmitter-based
   - APIs mix both, causing confusion

**Fix Required:**
1. Instantiate ResearchEngine singleton
2. Integrate `generateText` from Vercel AI SDK in agents
3. Connect engine events to API streams
4. Consolidate to single implementation

**Effort:** 1-2 days of focused work

---

### Issue 3: Connected Papers Rate-Limited

**Location:** `lib/discovery/`, `components/discovery/`

**Symptoms:**
- Network builds fail with "Rate limit exceeded"
- Only small networks can be built
- Feature appears broken

**Root Cause:**
- Uses Semantic Scholar API (NOT Connected Papers API)
- **Missing `SEMANTIC_SCHOLAR_API_KEY`** in environment
- Free tier: 100 requests/5 minutes (insufficient)
- With API key: 1,000 requests/5 minutes

**Fix (2 minutes):**
```bash
# Get free API key from: https://www.semanticscholar.org/product/api
# Add to .env.local:
SEMANTIC_SCHOLAR_API_KEY=your_key_here
```

**The feature is fully implemented** - just needs the API key.

---

### Issue 4: PDF Chat Partially Working

**Location:** `lib/rag/`, `app/api/papers/chat/`

**Current Capabilities:**
- PDF upload works
- Text extraction works (pdf-parse)
- BM25 retrieval works
- Chat responds

**Missing for Full Functionality:**
1. **Dense retrieval** needs `OPENAI_API_KEY` for embeddings
2. **Reranking** needs `COHERE_API_KEY` (optional, improves quality)
3. **OCR** not implemented (scanned PDFs flagged but not processed)
4. **Firebase** required for paper storage (cloud sync)

**Current State:**
Works with BM25-only retrieval if you have:
- At least one LLM API key
- Firebase configured (or using localStorage workaround)

---

### Issue 5: PPTX Export Disabled

**Location:** `lib/presentations/export/pptx-export.ts`

**Symptoms:**
- "PPTX export temporarily unavailable" error
- Users told to use PDF instead

**Root Cause:**
Comment in code: "PPTX export temporarily disabled due to Node.js module compatibility"

- `pptxgenjs` is a Node.js library
- Code runs in browser (Next.js client component)
- Browser can't load Node.js-specific modules

**The code is fully written** (727 lines) but commented out in:
`components/layout/three-panel-layout.tsx` lines 347-354

**Fix Required:**
Create server-side API endpoint:
```
app/api/presentations/export-pptx/route.ts
```
Move pptxgenjs generation to server, stream blob back to client.

**Effort:** 2-4 hours

---

## Part 3: Environment Variables Audit

### Currently Configured (in .env.local)
```bash
OPENAI_API_KEY=***              # Working
ANTHROPIC_API_KEY=***           # Working
GOOGLE_API_KEY=***              # Gemini has model name issue
GOOGLE_GENERATIVE_AI_API_KEY=***
NEXT_PUBLIC_DEV_AUTH_BYPASS=true # Working

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=***
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=***
NEXT_PUBLIC_FIREBASE_PROJECT_ID=***
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=***
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=***
NEXT_PUBLIC_FIREBASE_APP_ID=***
```

### Missing (Recommended to Add)
```bash
SEMANTIC_SCHOLAR_API_KEY=       # For Connected Papers - FREE
COHERE_API_KEY=                 # For better PDF chat reranking - FREE tier
PUBMED_API_KEY=                 # Optional, increases rate limit
```

### API Key Sources
| Key | Source | Cost |
|-----|--------|------|
| SEMANTIC_SCHOLAR_API_KEY | https://www.semanticscholar.org/product/api | Free |
| COHERE_API_KEY | https://cohere.ai/ | Free tier |
| PUBMED_API_KEY | https://www.ncbi.nlm.nih.gov/account/ | Free |

---

## Part 4: Database Migration Plan (Firebase → Supabase)

### Why Supabase?

| Factor | Firebase | Supabase |
|--------|----------|----------|
| Learning curve | Steeper | Gentler |
| Data portability | Locked | PostgreSQL (exportable) |
| Auth complexity | High | Low |
| Security rules | Complex DSL | Simple SQL policies |
| Real-time | Yes | Yes |
| Pricing | Complex | Simple |
| Open source | No | Yes |

### Migration Steps (For Another LLM to Execute)

#### Step 1: Setup Supabase
```bash
# User creates Supabase account at supabase.com
# Creates new project
# Gets these values from project settings:
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
```

#### Step 2: Create Database Schema
```sql
-- Run in Supabase SQL editor

-- Users table (Supabase Auth handles auth, this stores preferences)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  default_model TEXT DEFAULT 'claude',
  default_discipline TEXT DEFAULT 'life-sciences',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  discipline TEXT DEFAULT 'life-sciences',
  folder TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Papers table (for PDF chat)
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  authors TEXT[],
  year INTEGER,
  doi TEXT,
  abstract TEXT,
  content JSONB,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

-- Policies (user can only access their own data)
CREATE POLICY "Users can CRUD their own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Users can CRUD their own papers"
  ON papers FOR ALL
  USING (auth.uid() = user_id);
```

#### Step 3: Install Supabase Client
```bash
npm install @supabase/supabase-js --legacy-peer-deps
```

#### Step 4: Create Supabase Client
Create `lib/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### Step 5: Replace Firebase Functions

**Files to modify:**
1. `lib/firebase/documents.ts` → `lib/supabase/documents.ts`
2. `lib/firebase/settings.ts` → `lib/supabase/settings.ts`
3. `lib/firebase/auth.ts` → `lib/supabase/auth.ts`
4. `lib/firebase/papers.ts` → `lib/supabase/papers.ts`

**Pattern for each function:**
```typescript
// Before (Firebase)
import { collection, doc, getDoc } from 'firebase/firestore';
const docRef = doc(db, 'documents', id);
const snap = await getDoc(docRef);

// After (Supabase)
import { supabase } from '@/lib/supabase/client';
const { data, error } = await supabase
  .from('documents')
  .select('*')
  .eq('id', id)
  .single();
```

#### Step 6: Update Auth Hook
Replace Firebase Auth with Supabase Auth in `lib/hooks/use-auth.ts`:
```typescript
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

#### Step 7: Test Each Feature
- [ ] User can sign in
- [ ] Documents save to Supabase
- [ ] Documents load on refresh
- [ ] Settings persist
- [ ] PDF papers save

---

## Part 5: Priority Fix Order

### Immediate (Today)
1. Add `SEMANTIC_SCHOLAR_API_KEY` to `.env.local` (2 min)
2. Fix Gemini model name: `gemini-1.5-flash` → keep as is (already done)

### Short-term (This Week)
3. Create PPTX export API endpoint (2-4 hours)
4. Test all export features manually

### Medium-term (Next Week)
5. Migrate from Firebase to Supabase
6. Implement Deep Research LLM integration

### Long-term
7. Add OCR for scanned PDFs
8. Implement collaborative editing
9. Add Stripe for subscriptions

---

## Part 6: Files Reference

### Critical Files for Database Swap
```
lib/firebase/
├── auth.ts          # Auth functions → replace with Supabase
├── client.ts        # Firebase init → replace with Supabase
├── documents.ts     # Document CRUD → replace with Supabase
├── settings.ts      # Settings CRUD → replace with Supabase
├── papers.ts        # Papers CRUD → replace with Supabase
└── schema.ts        # Types → keep, update imports
```

### Critical Files for PPTX Fix
```
lib/presentations/export/
├── pptx-export.ts   # Full implementation, move to API
├── pdf-export.ts    # Working, reference for pattern
└── index.ts         # Exports

components/layout/
└── three-panel-layout.tsx  # Lines 347-354: uncomment & modify
```

### Critical Files for Deep Research
```
lib/deep-research/
├── engine.ts        # Need to export singleton instance
├── agents/          # Need to add LLM calls

lib/research/deep-research/
├── agents.ts        # Need to replace mock with LLM
├── engine.ts        # Main orchestration
└── synthesis.ts     # Need LLM integration
```

---

## Part 7: Testing Checklist

After any changes, verify:

### Core Features
- [ ] App loads at http://localhost:2550
- [ ] DEV MODE indicator shows
- [ ] Can create new document
- [ ] Editor accepts text input
- [ ] Auto-save triggers (check console)
- [ ] DOCX export downloads file
- [ ] PDF export downloads file

### AI Features
- [ ] Chat responds (Claude model)
- [ ] Chat responds (OpenAI model)
- [ ] PubMed search returns results
- [ ] arXiv search returns results

### Advanced Features (After Fixes)
- [ ] Connected Papers builds network (needs API key)
- [ ] PPTX export downloads file (needs API route)
- [ ] Deep Research produces analysis (needs LLM integration)
- [ ] PDF upload processes correctly
- [ ] PDF chat responds with citations

---

## Part 8: Commands Reference

### Development
```bash
cd "/Users/shaileshsingh/cursor for academic writing"
npm run dev              # Start dev server on :2550
npm run build            # Check for build errors
npm run type-check       # TypeScript check only
```

### Testing API
```bash
# Test chat
curl -X POST http://localhost:2550/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hi"}],"model":"claude"}'

# Test search
curl -X POST http://localhost:2550/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"cancer treatment 2024","databases":["pubmed"]}'
```

---

## Conclusion

The app has **solid architecture and extensive features**, but several are incomplete:

1. **Firebase is overcomplicating things** → Migrate to Supabase
2. **Deep Research is stubbed out** → Needs LLM integration
3. **Connected Papers works** → Just needs API key
4. **PPTX export exists** → Just needs server-side API
5. **PDF chat works** → Enhanced with optional APIs

**The path forward is clear:** Fix the easy wins (API keys), swap database to Supabase, then tackle the harder features (Deep Research, PPTX).

---

*This document should be read by any LLM continuing this project. All issues are documented with specific file locations and fix instructions.*
