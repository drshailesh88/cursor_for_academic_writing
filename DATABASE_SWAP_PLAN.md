# Database Swap Plan: Firebase → Supabase

**Purpose:** Step-by-step instructions for migrating from Firebase to Supabase
**For:** Any LLM agent to execute
**Difficulty:** Medium
**Estimated Time:** 4-6 hours

---

## Prerequisites

Before starting, the user must:
1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Get these values from Project Settings → API:
   - Project URL
   - anon/public key

---

## Phase 1: Environment Setup (10 minutes)

### Step 1.1: Add Supabase Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 1.2: Install Supabase Client

```bash
cd "/Users/shaileshsingh/cursor for academic writing"
npm install @supabase/supabase-js @supabase/ssr --legacy-peer-deps
```

---

## Phase 2: Database Schema (15 minutes)

### Step 2.1: Run SQL in Supabase Dashboard

Go to SQL Editor in Supabase Dashboard and run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  discipline TEXT DEFAULT 'life-sciences',
  citation_style TEXT DEFAULT 'apa',
  folder TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  default_model TEXT DEFAULT 'claude',
  temperature REAL DEFAULT 0.7,
  default_discipline TEXT DEFAULT 'life-sciences',
  default_citation_style TEXT DEFAULT 'apa',
  auto_save_interval INTEGER DEFAULT 30,
  font_size INTEGER DEFAULT 16,
  line_spacing REAL DEFAULT 1.5,
  theme TEXT DEFAULT 'system',
  include_line_numbers BOOLEAN DEFAULT FALSE,
  double_spacing BOOLEAN DEFAULT TRUE,
  watermark_text TEXT DEFAULT '',
  personal_api_keys JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Papers table (for PDF chat)
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  file_name TEXT,
  file_url TEXT,
  title TEXT,
  authors TEXT[],
  year INTEGER,
  doi TEXT,
  abstract TEXT,
  keywords TEXT[],
  sections JSONB,
  paragraphs JSONB,
  figures JSONB,
  tables_data JSONB,
  references JSONB,
  equations JSONB,
  quality TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'processing',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- References/Citations library
CREATE TABLE reference_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[],
  year INTEGER,
  journal TEXT,
  doi TEXT,
  pmid TEXT,
  abstract TEXT,
  source TEXT,
  citation_key TEXT,
  folder TEXT,
  labels TEXT[],
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX idx_papers_user_id ON papers(user_id);
CREATE INDEX idx_reference_library_user_id ON reference_library(user_id);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can manage their own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Users can manage their own papers"
  ON papers FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own references"
  ON reference_library FOR ALL
  USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER papers_updated_at
  BEFORE UPDATE ON papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Phase 3: Create Supabase Client Files (30 minutes)

### Step 3.1: Create `lib/supabase/client.ts`

```typescript
// Supabase Browser Client
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for client-side use
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
}
```

### Step 3.2: Create `lib/supabase/server.ts`

```typescript
// Supabase Server Client (for API routes)
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}
```

### Step 3.3: Create `lib/supabase/auth.ts`

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from './client';

// Dev mode bypass check
export function isDevAuthBypass(): boolean {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';
}

// Dev mock user
const DEV_MOCK_USER = {
  id: 'dev-test-user',
  email: 'dev@test.local',
  user_metadata: {
    full_name: 'Dev Test User',
  },
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dev mode bypass
    if (isDevAuthBypass()) {
      setUser(DEV_MOCK_USER as User);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    signOut,
  };
}
```

### Step 3.4: Create `lib/supabase/documents.ts`

```typescript
'use client';

import { getSupabase } from './client';
import { isDevAuthBypass } from './auth';

// Types (keep from existing schema.ts)
export interface Document {
  id: string;
  user_id: string;
  title: string;
  content: string;
  word_count: number;
  discipline: string;
  citation_style: string;
  folder?: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface DocumentMetadata {
  id: string;
  title: string;
  updated_at: Date;
  word_count: number;
  folder?: string;
  discipline?: string;
}

// Dev mode localStorage (keep existing functionality)
const DEV_STORAGE_KEY = 'dev_documents';

function getDevDocuments(): Document[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DEV_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function setDevDocuments(docs: Document[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(docs));
}

function generateDevId(): string {
  return 'dev-' + Math.random().toString(36).substring(2, 15);
}

// Create document
export async function createDocument(
  userId: string,
  title: string = 'Untitled Document'
): Promise<string> {
  if (isDevAuthBypass()) {
    const id = generateDevId();
    const newDoc: Document = {
      id,
      user_id: userId,
      title,
      content: '',
      word_count: 0,
      discipline: 'life-sciences',
      citation_style: 'apa',
      created_at: new Date(),
      updated_at: new Date(),
    };
    const docs = getDevDocuments();
    docs.unshift(newDoc);
    setDevDocuments(docs);
    return id;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      title,
      content: '',
      word_count: 0,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

// Get document by ID
export async function getDocument(documentId: string): Promise<Document | null> {
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    return docs.find(d => d.id === documentId) || null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error) return null;
  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
}

// Update document
export async function updateDocument(
  documentId: string,
  updates: Partial<Document>
): Promise<void> {
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    const index = docs.findIndex(d => d.id === documentId);
    if (index !== -1) {
      docs[index] = { ...docs[index], ...updates, updated_at: new Date() };
      setDevDocuments(docs);
    }
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId);

  if (error) throw error;
}

// Save document content (auto-save)
export async function saveDocumentContent(
  documentId: string,
  content: string,
  wordCount: number
): Promise<void> {
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    const index = docs.findIndex(d => d.id === documentId);
    if (index !== -1) {
      docs[index] = { ...docs[index], content, word_count: wordCount, updated_at: new Date() };
      setDevDocuments(docs);
    }
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('documents')
    .update({ content, word_count: wordCount })
    .eq('id', documentId);

  if (error) throw error;
}

// Delete document
export async function deleteDocument(documentId: string): Promise<void> {
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    setDevDocuments(docs.filter(d => d.id !== documentId));
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}

// Get user's documents
export async function getUserDocuments(
  userId: string,
  limit: number = 50
): Promise<DocumentMetadata[]> {
  if (isDevAuthBypass()) {
    return getDevDocuments()
      .filter(d => d.user_id === userId)
      .slice(0, limit)
      .map(d => ({
        id: d.id,
        title: d.title,
        updated_at: new Date(d.updated_at),
        word_count: d.word_count || 0,
        folder: d.folder,
        discipline: d.discipline,
      }));
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, updated_at, word_count, folder, discipline')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data.map(d => ({
    ...d,
    updated_at: new Date(d.updated_at),
  }));
}

// Rename document
export async function renameDocument(
  documentId: string,
  newTitle: string
): Promise<void> {
  return updateDocument(documentId, { title: newTitle });
}
```

### Step 3.5: Create `lib/supabase/settings.ts`

```typescript
'use client';

import { getSupabase } from './client';
import { isDevAuthBypass } from './auth';
import { UserSettings, DEFAULT_SETTINGS } from '../settings/types';

const DEV_SETTINGS_KEY = 'dev_user_settings';

function getDevSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(DEV_SETTINGS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_SETTINGS, ...parsed };
  }
  return DEFAULT_SETTINGS;
}

function setDevSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEV_SETTINGS_KEY, JSON.stringify(settings));
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  if (isDevAuthBypass()) {
    return getDevSettings();
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return DEFAULT_SETTINGS;
  }

  return {
    ai: {
      defaultModel: data.default_model || DEFAULT_SETTINGS.ai.defaultModel,
      temperature: data.temperature || DEFAULT_SETTINGS.ai.temperature,
      personalApiKeys: data.personal_api_keys || {},
    },
    writing: {
      defaultDiscipline: data.default_discipline || DEFAULT_SETTINGS.writing.defaultDiscipline,
      defaultCitationStyle: data.default_citation_style || DEFAULT_SETTINGS.writing.defaultCitationStyle,
      autoSaveInterval: data.auto_save_interval || DEFAULT_SETTINGS.writing.autoSaveInterval,
    },
    editor: {
      fontSize: data.font_size || DEFAULT_SETTINGS.editor.fontSize,
      lineSpacing: data.line_spacing || DEFAULT_SETTINGS.editor.lineSpacing,
      theme: data.theme || DEFAULT_SETTINGS.editor.theme,
    },
    export: {
      includeLineNumbers: data.include_line_numbers ?? DEFAULT_SETTINGS.export.includeLineNumbers,
      doubleSpacing: data.double_spacing ?? DEFAULT_SETTINGS.export.doubleSpacing,
      watermarkText: data.watermark_text || DEFAULT_SETTINGS.export.watermarkText,
    },
  };
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  if (isDevAuthBypass()) {
    const current = getDevSettings();
    const updated = {
      ai: { ...current.ai, ...(settings.ai || {}) },
      writing: { ...current.writing, ...(settings.writing || {}) },
      editor: { ...current.editor, ...(settings.editor || {}) },
      export: { ...current.export, ...(settings.export || {}) },
    };
    setDevSettings(updated);
    return;
  }

  const supabase = getSupabase();

  // Flatten settings for database
  const dbSettings: Record<string, unknown> = {};
  if (settings.ai) {
    if (settings.ai.defaultModel) dbSettings.default_model = settings.ai.defaultModel;
    if (settings.ai.temperature) dbSettings.temperature = settings.ai.temperature;
    if (settings.ai.personalApiKeys) dbSettings.personal_api_keys = settings.ai.personalApiKeys;
  }
  if (settings.writing) {
    if (settings.writing.defaultDiscipline) dbSettings.default_discipline = settings.writing.defaultDiscipline;
    if (settings.writing.defaultCitationStyle) dbSettings.default_citation_style = settings.writing.defaultCitationStyle;
    if (settings.writing.autoSaveInterval) dbSettings.auto_save_interval = settings.writing.autoSaveInterval;
  }
  if (settings.editor) {
    if (settings.editor.fontSize) dbSettings.font_size = settings.editor.fontSize;
    if (settings.editor.lineSpacing) dbSettings.line_spacing = settings.editor.lineSpacing;
    if (settings.editor.theme) dbSettings.theme = settings.editor.theme;
  }
  if (settings.export) {
    if (settings.export.includeLineNumbers !== undefined) dbSettings.include_line_numbers = settings.export.includeLineNumbers;
    if (settings.export.doubleSpacing !== undefined) dbSettings.double_spacing = settings.export.doubleSpacing;
    if (settings.export.watermarkText !== undefined) dbSettings.watermark_text = settings.export.watermarkText;
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert({ id: userId, ...dbSettings });

  if (error) throw error;
}

export async function resetToDefaults(userId: string): Promise<void> {
  if (isDevAuthBypass()) {
    setDevSettings(DEFAULT_SETTINGS);
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('user_settings')
    .delete()
    .eq('id', userId);

  if (error) throw error;
}
```

---

## Phase 4: Update Imports (1-2 hours)

### Step 4.1: Find All Firebase Imports

Search for these patterns and update:

```bash
# Find all files importing from firebase
grep -r "from '@/lib/firebase" --include="*.ts" --include="*.tsx" components/ lib/ app/
```

### Step 4.2: Update Each Import

**Pattern:**
```typescript
// Before
import { useAuth } from '@/lib/firebase/auth';
import { createDocument, getDocument } from '@/lib/firebase/documents';
import { getUserSettings } from '@/lib/firebase/settings';

// After
import { useAuth } from '@/lib/supabase/auth';
import { createDocument, getDocument } from '@/lib/supabase/documents';
import { getUserSettings } from '@/lib/supabase/settings';
```

### Step 4.3: Key Files to Update

1. `components/auth/auth-guard.tsx`
2. `components/auth/auth-dialog.tsx`
3. `components/layout/three-panel-layout.tsx`
4. `lib/hooks/use-document.ts`
5. `lib/hooks/use-settings.ts`
6. `app/api/papers/upload/route.ts`
7. `app/api/papers/chat/route.ts`

---

## Phase 5: Enable Supabase Auth (15 minutes)

### Step 5.1: Enable Google OAuth in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Add Google OAuth credentials from Google Cloud Console
4. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### Step 5.2: Create Auth Callback Route

Create `app/auth/callback/route.ts`:

```typescript
import { createServerSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/', request.url));
}
```

---

## Phase 6: Test Everything (30 minutes)

### Test Checklist

```bash
# Start dev server
npm run dev

# Test in browser at http://localhost:2550
```

- [ ] App loads without errors
- [ ] DEV MODE still works (localStorage)
- [ ] Can sign in with Google (when not in dev mode)
- [ ] Documents list loads
- [ ] Can create new document
- [ ] Can type in editor
- [ ] Auto-save works (check console)
- [ ] Settings persist
- [ ] DOCX export works
- [ ] PDF export works
- [ ] AI chat works

---

## Phase 7: Cleanup (15 minutes)

### Step 7.1: Remove Firebase Dependencies (Optional)

Only do this after everything works:

```bash
npm uninstall firebase firebase-admin --legacy-peer-deps
```

### Step 7.2: Remove Firebase Files (Optional)

```bash
rm -rf lib/firebase/
```

### Step 7.3: Update .env.local

Remove Firebase variables (optional):
```bash
# Can remove these if not using Firebase anymore
# NEXT_PUBLIC_FIREBASE_API_KEY=
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
# etc.
```

---

## Troubleshooting

### "relation does not exist" error
→ Run the SQL schema in Supabase Dashboard

### "JWT expired" error
→ User needs to sign in again

### "permission denied" error
→ Check RLS policies are created correctly

### Documents not loading
→ Check user_id matches auth.uid() in RLS policy

### Dev mode not working
→ Ensure `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` in `.env.local`

---

## Summary

This migration:
1. Keeps all existing functionality
2. Maintains dev mode with localStorage
3. Adds proper cloud storage with Supabase
4. Simplifies authentication
5. Uses standard PostgreSQL (data is portable)

The key insight: **All existing localStorage dev mode code is preserved.** Supabase is only used when not in dev mode.

---

*End of Database Swap Plan*
