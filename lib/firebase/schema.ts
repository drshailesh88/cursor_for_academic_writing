// Firestore Data Schema and Types

// Discipline types for multi-discipline support
export type DisciplineId =
  | 'life-sciences'
  | 'bioinformatics'
  | 'chemistry'
  | 'clinical-medicine'
  | 'physics'
  | 'astronomy'
  | 'computer-science'
  | 'engineering'
  | 'materials-science'
  | 'mathematics'
  | 'neuroscience'
  | 'earth-sciences'
  | 'social-sciences'
  | 'economics'
  | 'environmental-science';

export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string; // HTML content from TipTap
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  citations: Citation[];
  tags?: string[];
  folder?: string;
  discipline?: DisciplineId; // Academic discipline for AI assistance
}

export interface Citation {
  id: string;
  text: string; // e.g., "(Smith et al., 2023)"
  pmid?: string; // PubMed ID if from PubMed
  authors: string[];
  title: string;
  journal?: string;
  year: number;
  doi?: string;
  url?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    defaultModel?: string;
    autoSaveInterval?: number; // seconds
    theme?: 'light' | 'dark' | 'auto';
  };
}

export interface DocumentMetadata {
  id: string;
  title: string;
  updatedAt: Date;
  wordCount: number;
  folder?: string;
  discipline?: DisciplineId;
}

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  DOCUMENTS: 'documents',
  CITATIONS: 'citations',
  RESEARCH_SESSIONS: 'researchSessions',
  PAPERS: 'papers',
  PAPER_CONTENTS: 'paperContents',
  PRESENTATIONS: 'presentations',
  // Citation library collections (nested under users)
  REFERENCES: 'references',      // users/{userId}/references
  LIBRARY_FOLDERS: 'folders',    // users/{userId}/folders
  LIBRARY_LABELS: 'labels',      // users/{userId}/labels
  // Version history (nested under documents)
  VERSIONS: 'versions',          // documents/{documentId}/versions
} as const;

// ============================================================================
// PAPER LIBRARY TYPES (Understand Your Papers)
// ============================================================================

/**
 * Processing status for uploaded papers
 */
export type PaperProcessingStatus =
  | 'uploading'
  | 'processing'
  | 'extracting_text'
  | 'extracting_figures'
  | 'extracting_tables'
  | 'parsing_references'
  | 'generating_embeddings'
  | 'ready'
  | 'error';

/**
 * Author information for papers
 */
export interface PaperAuthor {
  name: string;
  firstName?: string;
  lastName?: string;
  affiliation?: string;
  email?: string;
  isCorresponding?: boolean;
}

/**
 * Paper document stored in Firestore
 */
export interface Paper {
  id: string;
  userId: string;

  // File information
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  storagePath: string;

  // Metadata (auto-extracted or enriched)
  title: string;
  authors: PaperAuthor[];
  year?: number;
  journal?: string;
  doi?: string;
  pmid?: string;
  arxivId?: string;
  abstract?: string;
  keywords?: string[];

  // Processing status
  processingStatus: PaperProcessingStatus;
  processingError?: string;
  extractedAt?: Date;

  // Organization
  tags?: string[];
  collections?: string[];
  notes?: string;
  isFavorite?: boolean;
  color?: string;

  // Enrichment data
  citationCount?: number;
  impactFactor?: number;
  openAccess?: boolean;

  // Timestamps
  uploadedAt: Date;
  updatedAt: Date;
}

/**
 * Extracted figure from a paper
 */
export interface PaperFigure {
  id: string;
  figureNumber: string;
  caption: string;
  imageUrl?: string;
  storagePath?: string;
  pageNumber?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Extracted table from a paper
 */
export interface PaperTable {
  id: string;
  tableNumber: string;
  caption: string;
  headers: string[];
  rows: string[][];
  pageNumber?: number;
}

/**
 * Reference/citation extracted from a paper
 */
export interface PaperReference {
  id: string;
  referenceNumber?: number;
  text: string;
  authors?: string[];
  title?: string;
  journal?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  url?: string;
}

/**
 * Indexed paragraph for semantic search
 */
export interface PaperParagraph {
  id: string;
  section: string;
  subsection?: string;
  text: string;
  pageNumber?: number;
  order: number;
}

/**
 * Paper section types
 */
export type PaperSectionType =
  | 'title'
  | 'abstract'
  | 'introduction'
  | 'background'
  | 'literature_review'
  | 'methods'
  | 'results'
  | 'discussion'
  | 'conclusion'
  | 'acknowledgments'
  | 'references'
  | 'appendix'
  | 'supplementary'
  | 'unknown';

/**
 * Paper section with content
 */
export interface PaperSection {
  type: PaperSectionType;
  title: string;
  content: string;
  subsections?: PaperSection[];
  pageStart?: number;
  pageEnd?: number;
}

/**
 * Extracted content stored separately (can be large)
 */
export interface PaperContent {
  paperId: string;
  userId: string;

  // Full text
  fullText: string;
  pageCount: number;

  // Structured sections
  sections: PaperSection[];

  // Indexed paragraphs (for citation)
  paragraphs: PaperParagraph[];

  // Extracted elements
  figures: PaperFigure[];
  tables: PaperTable[];
  references: PaperReference[];

  // Equations (LaTeX format)
  equations?: string[];

  // Processing metadata
  extractionQuality: 'high' | 'medium' | 'low';
  ocrRequired: boolean;
  processingTimeMs: number;

  // Timestamps
  extractedAt: Date;
  updatedAt: Date;
}

/**
 * Paper collection for organizing papers
 */
export interface PaperCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  paperIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paper chat session for multi-paper conversations
 */
export interface PaperChatSession {
  id: string;
  userId: string;
  title: string;
  paperIds: string[];
  messages: PaperChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message in a paper chat session
 */
export interface PaperChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: PaperChatCitation[];
  timestamp: Date;
}

/**
 * Citation reference in chat response
 */
export interface PaperChatCitation {
  paperId: string;
  paragraphId?: string;
  pageNumber?: number;
  quote?: string;
}

/**
 * Metadata for paper list display
 */
export interface PaperMetadata {
  id: string;
  title: string;
  authors: PaperAuthor[];
  year?: number;
  journal?: string;
  processingStatus: PaperProcessingStatus;
  uploadedAt: Date;
  isFavorite?: boolean;
  tags?: string[];
}

// Helper function to convert Firestore timestamp to Date
export function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
}

// ============================================================================
// RESEARCH SESSION TYPES (Deep Research)
// ============================================================================

/**
 * Research session stored in Firestore
 * Simplified version of the full ResearchSession from deep-research/types.ts
 */
export interface ResearchSession {
  id: string;
  userId: string;

  // Basic configuration
  topic: string;
  mode: 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic';
  status: 'clarifying' | 'planning' | 'researching' | 'analyzing' | 'reviewing' | 'synthesizing' | 'complete' | 'failed';

  // Progress tracking
  progress: number; // 0-100
  sourcesCollected: number;

  // Results (stored as JSON)
  perspectives?: any[]; // Perspective[]
  sources?: any[]; // ResearchSource[]
  synthesis?: {
    content: string;
    qualityScore: number;
    wordCount: number;
    citationCount: number;
  };

  // Quality metrics
  qualityScore?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  // Errors
  error?: string;
}

/**
 * Research session metadata for list display
 */
export interface ResearchSessionMetadata {
  id: string;
  topic: string;
  mode: 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic';
  status: ResearchSession['status'];
  progress: number;
  sourcesCollected: number;
  qualityScore?: number;
  createdAt: Date;
  completedAt?: Date;
}

// Helper function to create a new document
export function createNewDocument(userId: string, title: string = 'Untitled Document'): Omit<Document, 'id'> {
  const now = new Date();
  return {
    userId,
    title,
    content: '',
    createdAt: now,
    updatedAt: now,
    wordCount: 0,
    citations: [],
  };
}
