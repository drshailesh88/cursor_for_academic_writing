// Firebase Research Sessions CRUD
// Manages research session persistence in Firestore

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './client';
import { COLLECTIONS } from './schema';
import type {
  ResearchMode,
  SessionStatus,
  Perspective,
} from '@/lib/research/deep-research/types';

/**
 * Firestore document shape for research sessions
 * Simplified version that stores JSON data
 */
interface ResearchSessionDoc {
  id: string;
  userId: string;
  topic: string;
  mode: ResearchMode;
  status: SessionStatus;
  progress: number;
  sourcesCollected: number;

  // Research data (stored as JSON)
  perspectives?: any[];
  sources?: any[];
  synthesis?: {
    content: string;
    qualityScore: number;
    wordCount: number;
    citationCount: number;
  };

  // Quality
  qualityScore?: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;

  // Error tracking
  error?: string;
}

/**
 * Create a new research session
 */
export async function createResearchSession(
  userId: string,
  topic: string,
  mode: ResearchMode
): Promise<string> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, COLLECTIONS.RESEARCH_SESSIONS);
  const sessionDoc = doc(sessionsRef);
  const sessionId = sessionDoc.id;

  const session: ResearchSessionDoc = {
    id: sessionId,
    userId,
    topic,
    mode,
    status: 'planning',
    progress: 0,
    sourcesCollected: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(sessionDoc, session);
  return sessionId;
}

/**
 * Get a research session by ID
 */
export async function getResearchSession(sessionId: string): Promise<ResearchSessionDoc | null> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);
    const snapshot = await getDoc(sessionRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as ResearchSessionDoc;
  } catch (error) {
    console.error('Error getting research session:', error);
    return null;
  }
}

/**
 * Get user's research sessions (metadata only for list view)
 */
export async function getUserResearchSessions(
  userId: string,
  maxResults: number = 50
): Promise<ResearchSessionDoc[]> {
  try {
    const db = getFirebaseDb();
    const sessionsRef = collection(db, COLLECTIONS.RESEARCH_SESSIONS);
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ResearchSessionDoc);
  } catch (error) {
    console.error('Error getting user research sessions:', error);
    return [];
  }
}

/**
 * Update session status and progress
 */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  progress: number
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);

    const updates: Partial<ResearchSessionDoc> = {
      status,
      progress,
      updatedAt: Timestamp.now(),
    };

    if (status === 'complete') {
      updates.completedAt = Timestamp.now();
    }

    await updateDoc(sessionRef, updates);
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
}

/**
 * Update session progress during research
 */
export async function updateSessionProgress(
  sessionId: string,
  progress: number,
  sourcesCollected: number,
  sources?: any[]
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);

    const updates: Partial<ResearchSessionDoc> = {
      progress,
      sourcesCollected,
      updatedAt: Timestamp.now(),
    };

    if (sources) {
      updates.sources = sources;
    }

    await updateDoc(sessionRef, updates);
  } catch (error) {
    console.error('Error updating session progress:', error);
    throw error;
  }
}

/**
 * Add perspectives to session
 */
export async function addSessionPerspectives(
  sessionId: string,
  perspectives: Perspective[]
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);
    await updateDoc(sessionRef, {
      perspectives,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding session perspectives:', error);
    throw error;
  }
}

/**
 * Complete a research session with synthesis
 */
export async function completeSession(
  sessionId: string,
  synthesis: {
    content: string;
    qualityScore: number;
    wordCount: number;
    citationCount: number;
  },
  perspectives?: any[],
  sources?: any[]
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);

    const updates: Partial<ResearchSessionDoc> = {
      status: 'complete',
      progress: 100,
      synthesis,
      qualityScore: synthesis.qualityScore,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (perspectives) {
      updates.perspectives = perspectives;
    }

    if (sources) {
      updates.sources = sources;
    }

    await updateDoc(sessionRef, updates);
  } catch (error) {
    console.error('Error completing session:', error);
    throw error;
  }
}

/**
 * Mark session as failed
 */
export async function failSession(
  sessionId: string,
  error: string
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);

    await updateDoc(sessionRef, {
      status: 'failed',
      error,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error marking session as failed:', error);
    throw error;
  }
}

/**
 * Delete a research session
 */
export async function deleteResearchSession(sessionId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error('Error deleting research session:', error);
    throw error;
  }
}

/**
 * Add clarifications to session (for backward compatibility)
 */
export async function addSessionClarifications(
  sessionId: string,
  clarifications: any[]
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);
    await updateDoc(sessionRef, {
      clarifications,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding session clarifications:', error);
    throw error;
  }
}

/**
 * Add sources to session (for backward compatibility)
 */
export async function addSessionSources(
  sessionId: string,
  sources: any[]
): Promise<void> {
  try {
    const session = await getResearchSession(sessionId);
    if (!session) return;

    const updatedSources = [...(session.sources || []), ...sources];
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);
    await updateDoc(sessionRef, {
      sources: updatedSources,
      sourcesCollected: updatedSources.length,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding session sources:', error);
    throw error;
  }
}

/**
 * Set synthesis result (for backward compatibility)
 */
export async function setSessionSynthesis(
  sessionId: string,
  synthesis: any
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTIONS.RESEARCH_SESSIONS, sessionId);

    // Convert to simplified synthesis format
    const simplifiedSynthesis = {
      content: synthesis.content || '',
      qualityScore: synthesis.qualityScore || 0,
      wordCount: synthesis.wordCount || 0,
      citationCount: synthesis.sections?.reduce((count: number, s: any) =>
        count + (s.sourceIds?.length || 0), 0) || 0,
    };

    await updateDoc(sessionRef, {
      synthesis: simplifiedSynthesis,
      qualityScore: simplifiedSynthesis.qualityScore,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error setting session synthesis:', error);
    throw error;
  }
}

/**
 * Convert Firestore document to partial ResearchSession (for backward compatibility)
 */
export function toResearchSession(doc: ResearchSessionDoc): any {
  return {
    id: doc.id,
    userId: doc.userId,
    topic: doc.topic,
    mode: doc.mode,
    status: doc.status,
    progress: doc.progress,
    perspectives: doc.perspectives || [],
    sources: doc.sources || [],
    synthesis: doc.synthesis,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    completedAt: doc.completedAt,
  };
}
