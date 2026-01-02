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
  // Citation library collections (nested under users)
  REFERENCES: 'references',      // users/{userId}/references
  LIBRARY_FOLDERS: 'folders',    // users/{userId}/folders
  LIBRARY_LABELS: 'labels',      // users/{userId}/labels
  // Version history (nested under documents)
  VERSIONS: 'versions',          // documents/{documentId}/versions
} as const;

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
