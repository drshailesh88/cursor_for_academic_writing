// Firestore Data Schema and Types

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
}

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  DOCUMENTS: 'documents',
  CITATIONS: 'citations',
  RESEARCH_SESSIONS: 'researchSessions',
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
