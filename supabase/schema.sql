-- Supabase schema for Academic Writing Platform
-- NOTE: This script focuses on functionality and keeps RLS disabled by default.
-- You can enable RLS later once the app is stable.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  citations JSONB DEFAULT '[]'::jsonb,
  tags TEXT[],
  folder TEXT,
  discipline TEXT DEFAULT 'life-sciences',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);

-- ============================================================================
-- USER SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
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
  personal_api_keys JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple user profiles (email/name lookup for sharing)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAPERS + CONTENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  storage_url TEXT,
  storage_path TEXT,
  title TEXT,
  authors JSONB DEFAULT '[]'::jsonb,
  year INTEGER,
  journal TEXT,
  doi TEXT,
  pmid TEXT,
  arxiv_id TEXT,
  abstract TEXT,
  keywords TEXT[],
  tags TEXT[],
  collections TEXT[],
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  color TEXT,
  citation_count INTEGER,
  impact_factor REAL,
  open_access BOOLEAN,
  processing_status TEXT DEFAULT 'processing',
  processing_error TEXT,
  extracted_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_papers_user_id ON papers(user_id);
CREATE INDEX IF NOT EXISTS idx_papers_updated_at ON papers(updated_at DESC);

CREATE TABLE IF NOT EXISTS paper_contents (
  paper_id UUID PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  full_text TEXT DEFAULT '',
  page_count INTEGER DEFAULT 0,
  sections JSONB DEFAULT '[]'::jsonb,
  paragraphs JSONB DEFAULT '[]'::jsonb,
  figures JSONB DEFAULT '[]'::jsonb,
  tables_data JSONB DEFAULT '[]'::jsonb,
  "references" JSONB DEFAULT '[]'::jsonb,
  equations JSONB DEFAULT '[]'::jsonb,
  extraction_quality TEXT DEFAULT 'medium',
  ocr_required BOOLEAN DEFAULT FALSE,
  processing_time_ms INTEGER DEFAULT 0,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paper_contents_user_id ON paper_contents(user_id);

-- ============================================================================
-- CITATION LIBRARY
-- ============================================================================

CREATE TABLE IF NOT EXISTS reference_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  title_short TEXT,
  abstract TEXT,
  authors JSONB DEFAULT '[]'::jsonb,
  editors JSONB DEFAULT '[]'::jsonb,
  translators JSONB DEFAULT '[]'::jsonb,
  issued JSONB,
  accessed JSONB,
  submitted JSONB,
  identifiers JSONB,
  venue JSONB,
  publisher JSONB,
  conference JSONB,
  thesis JSONB,
  patent JSONB,
  keywords TEXT[],
  subjects TEXT[],
  language TEXT,
  pdf_url TEXT,
  pdf_storage_path TEXT,
  supplementary_urls TEXT[],
  citation_count INTEGER,
  influential_citation_count INTEGER,
  folders TEXT[],
  labels TEXT[],
  notes TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  read_status TEXT,
  rating INTEGER,
  source TEXT,
  cite_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reference_library_user_id ON reference_library(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_library_title ON reference_library(title);

CREATE TABLE IF NOT EXISTS reference_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reference_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COLLABORATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  selection_start INTEGER NOT NULL,
  selection_end INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  suggested_text TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  replies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  label TEXT,
  description TEXT,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);

CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  share_token TEXT,
  shared_with_email TEXT,
  shared_with_user_id UUID,
  permission TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(share_token);

CREATE TABLE IF NOT EXISTS shared_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  share_id UUID NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  owner_id UUID NOT NULL,
  owner_name TEXT NOT NULL,
  title TEXT NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  word_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_shared_documents_user_id ON shared_documents(user_id);

CREATE TABLE IF NOT EXISTS tracked_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  from_pos INTEGER NOT NULL,
  to_pos INTEGER NOT NULL,
  old_content TEXT,
  new_content TEXT,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracked_changes_document_id ON tracked_changes(document_id);

-- ============================================================================
-- RESEARCH SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  sources_collected INTEGER DEFAULT 0,
  perspectives JSONB,
  sources JSONB,
  synthesis JSONB,
  quality_score REAL,
  clarifications JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id);

-- ============================================================================
-- PRESENTATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  document_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  slides JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);

-- ============================================================================
-- RAG CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rag_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  cache_key TEXT NOT NULL,
  query TEXT NOT NULL,
  paper_ids TEXT[],
  response TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rag_cache_user_key ON rag_cache(user_id, cache_key);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER papers_updated_at
  BEFORE UPDATE ON papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER paper_contents_updated_at
  BEFORE UPDATE ON paper_contents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reference_library_updated_at
  BEFORE UPDATE ON reference_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reference_folders_updated_at
  BEFORE UPDATE ON reference_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER document_comments_updated_at
  BEFORE UPDATE ON document_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shared_documents_updated_at
  BEFORE UPDATE ON shared_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER research_sessions_updated_at
  BEFORE UPDATE ON research_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER presentations_updated_at
  BEFORE UPDATE ON presentations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- OPTIONAL RLS (enable later when stable)
-- ============================================================================
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE paper_contents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reference_library ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reference_folders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reference_labels ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tracked_changes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rag_cache ENABLE ROW LEVEL SECURITY;
