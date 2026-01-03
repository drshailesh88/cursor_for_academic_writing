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
import type {
  ResearchSession,
  ResearchMode,
  ResearchConfig,
  ResearchStatus,
  ResearchSource,
  SynthesisResult,
  Clarification,
  Perspective,
} from '@/lib/deep-research/types';

// Collection name
const RESEARCH_SESSIONS = 'researchSessions';

/**
 * Firestore document shape for research sessions
 */
interface ResearchSessionDoc {
  id: string;
  userId: string;
  topic: string;
  mode: ResearchMode;
  config: ResearchConfig;
  status: ResearchStatus;
  progress: number;

  // Research data
  clarifications: Clarification[];
  perspectives: Perspective[];
  sources: ResearchSource[];
  synthesis: SynthesisResult | null;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

/**
 * Create a new research session
 */
export async function createResearchSession(
  userId: string,
  topic: string,
  mode: ResearchMode,
  config: ResearchConfig
): Promise<string> {
  const sessionsRef = collection(getFirebaseDb(), RESEARCH_SESSIONS);
  const sessionDoc = doc(sessionsRef);
  const sessionId = sessionDoc.id;

  const session: ResearchSessionDoc = {
    id: sessionId,
    userId,
    topic,
    mode,
    config,
    status: 'clarifying',
    progress: 0,
    clarifications: [],
    perspectives: [],
    sources: [],
    synthesis: null,
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
  const sessionRef = doc(getFirebaseDb(), RESEARCH_SESSIONS, sessionId);
  const snapshot = await getDoc(sessionRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as ResearchSessionDoc;
}

/**
 * Get user's research sessions
 */
export async function getUserResearchSessions(
  userId: string,
  maxResults: number = 20
): Promise<ResearchSessionDoc[]> {
  const sessionsRef = collection(getFirebaseDb(), RESEARCH_SESSIONS);
  const q = query(
    sessionsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ResearchSessionDoc);
}

/**
 * Update session status and progress
 */
export async function updateSessionStatus(
  sessionId: string,
  status: ResearchStatus,
  progress: number
): Promise<void> {
  const sessionRef = doc(getFirebaseDb(), RESEARCH_SESSIONS, sessionId);

  const updates: Partial<ResearchSessionDoc> = {
    status,
    progress,
    updatedAt: Timestamp.now(),
  };

  if (status === 'complete') {
    updates.completedAt = Timestamp.now();
  }

  await updateDoc(sessionRef, updates);
}

/**
 * Add clarifications to session
 */
export async function addSessionClarifications(
  sessionId: string,
  clarifications: Clarification[]
): Promise<void> {
  const sessionRef = doc(getFirebaseDb(), RESEARCH_SESSIONS, sessionId);
  await updateDoc(sessionRef, {
    clarifications,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Add perspectives to session
 */
export async function addSessionPerspectives(
  sessionId: string,
  perspectives: Perspective[]
): Promise<void> {
  const sessionRef = doc(getFirebaseDb(), RESEARCH_SESSIONS, sessionId);
  await updateDoc(sessionRef, {
    perspectives,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Add sources to session
 */
export async function addSessionSources(
  sessionId: string,
  sources: ResearchSource[]
): Promise<void> {
  const session = await getResearchSession(sessionId);
  if (!session) return;

  const updatedSources = [...session.sources, ...sources];
  const sessionRef = doc(getFirebaseDb(), RESEARCH_SESSIONS, sessionId);
  await updateDoc(sessionRef, {
    sources: updatedSources,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Set synthesis result
 */
export async function setSessionSynthesis(
  sessionId: string,
  synthesis: SynthesisResult
): Promise<void> {
  const sessionRef = doc(getFirebaseDb(), RESEARCH_SESSIONS, sessionId);
  await updateDoc(sessionRef, {
    synthesis,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a research session
 */
export async function deleteResearchSession(sessionId: string): Promise<void> {
  const sessionRef = doc(getFirebaseDb(), RESEARCH_SESSIONS, sessionId);
  await deleteDoc(sessionRef);
}

/**
 * Convert Firestore document to ResearchSession type
 */
export function toResearchSession(doc: ResearchSessionDoc): Partial<ResearchSession> {
  return {
    id: doc.id,
    userId: doc.userId,
    topic: doc.topic,
    mode: doc.mode,
    config: doc.config,
    status: doc.status,
    progress: doc.progress,
    clarifications: doc.clarifications,
    perspectives: doc.perspectives,
    sources: doc.sources,
    synthesis: doc.synthesis as any,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    completedAt: doc.completedAt,
  };
}
