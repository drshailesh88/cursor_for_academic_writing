// Paper Library - Firebase CRUD Operations
// Handles paper document storage and retrieval

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './client';
import {
  COLLECTIONS,
  Paper,
  PaperContent,
  PaperMetadata,
  PaperProcessingStatus,
  PaperAuthor,
  timestampToDate,
} from './schema';

// ============================================================================
// PAPER STORAGE OPERATIONS
// ============================================================================

/**
 * Upload a PDF file to Firebase Storage
 */
export async function uploadPaperFile(
  userId: string,
  paperId: string,
  file: File | Blob,
  fileName: string
): Promise<{ url: string; path: string }> {
  const storagePath = `papers/${userId}/${paperId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: 'application/pdf',
    customMetadata: {
      userId,
      paperId,
      originalName: fileName,
    },
  });

  const url = await getDownloadURL(storageRef);

  return { url, path: storagePath };
}

/**
 * Delete a paper file from Firebase Storage
 */
export async function deletePaperFile(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Failed to delete paper file:', error);
  }
}

// ============================================================================
// PAPER DOCUMENT OPERATIONS
// ============================================================================

/**
 * Create a new paper document in Firestore
 */
export async function createPaper(
  userId: string,
  data: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    storageUrl: string;
    storagePath: string;
    title?: string;
  }
): Promise<string> {
  const now = new Date();

  const paperData: Omit<Paper, 'id'> = {
    userId,
    fileName: data.fileName,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    storageUrl: data.storageUrl,
    storagePath: data.storagePath,
    title: data.title || data.fileName.replace(/\.pdf$/i, ''),
    authors: [],
    processingStatus: 'uploading',
    uploadedAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.PAPERS), {
    ...paperData,
    uploadedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Get a paper by ID
 */
export async function getPaper(paperId: string): Promise<Paper | null> {
  const docRef = doc(db, COLLECTIONS.PAPERS, paperId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    uploadedAt: timestampToDate(data.uploadedAt),
    updatedAt: timestampToDate(data.updatedAt),
    extractedAt: data.extractedAt ? timestampToDate(data.extractedAt) : undefined,
  } as Paper;
}

/**
 * Get all papers for a user
 */
export async function getUserPapers(
  userId: string,
  options?: {
    limit?: number;
    orderByField?: 'uploadedAt' | 'updatedAt' | 'title';
    orderDirection?: 'asc' | 'desc';
    status?: PaperProcessingStatus;
    collection?: string;
    tag?: string;
  }
): Promise<Paper[]> {
  const papersRef = collection(db, COLLECTIONS.PAPERS);

  let q = query(
    papersRef,
    where('userId', '==', userId),
    orderBy(options?.orderByField || 'uploadedAt', options?.orderDirection || 'desc')
  );

  if (options?.status) {
    q = query(q, where('processingStatus', '==', options.status));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  const querySnapshot = await getDocs(q);

  const papers: Paper[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    papers.push({
      id: docSnap.id,
      ...data,
      uploadedAt: timestampToDate(data.uploadedAt),
      updatedAt: timestampToDate(data.updatedAt),
      extractedAt: data.extractedAt ? timestampToDate(data.extractedAt) : undefined,
    } as Paper);
  });

  // Filter by collection or tag (client-side since Firestore doesn't support array-contains with other filters well)
  let filtered = papers;
  if (options?.collection) {
    filtered = filtered.filter((p) => p.collections?.includes(options.collection!));
  }
  if (options?.tag) {
    filtered = filtered.filter((p) => p.tags?.includes(options.tag!));
  }

  return filtered;
}

/**
 * Get paper metadata for list display (lightweight)
 */
export async function getUserPaperMetadata(userId: string): Promise<PaperMetadata[]> {
  const papers = await getUserPapers(userId);

  return papers.map((paper) => ({
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    year: paper.year,
    journal: paper.journal,
    processingStatus: paper.processingStatus,
    uploadedAt: paper.uploadedAt,
    isFavorite: paper.isFavorite,
    tags: paper.tags,
  }));
}

/**
 * Update paper metadata
 */
export async function updatePaper(
  paperId: string,
  updates: Partial<Omit<Paper, 'id' | 'userId' | 'uploadedAt'>>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PAPERS, paperId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update paper processing status
 */
export async function updatePaperStatus(
  paperId: string,
  status: PaperProcessingStatus,
  error?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    processingStatus: status,
    updatedAt: serverTimestamp(),
  };

  if (error) {
    updates.processingError = error;
  }

  if (status === 'ready') {
    updates.extractedAt = serverTimestamp();
  }

  const docRef = doc(db, COLLECTIONS.PAPERS, paperId);
  await updateDoc(docRef, updates);
}

/**
 * Update paper with extracted metadata
 */
export async function updatePaperMetadata(
  paperId: string,
  metadata: {
    title?: string;
    authors?: PaperAuthor[];
    year?: number;
    journal?: string;
    doi?: string;
    pmid?: string;
    arxivId?: string;
    abstract?: string;
    keywords?: string[];
    citationCount?: number;
    openAccess?: boolean;
  }
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PAPERS, paperId);

  await updateDoc(docRef, {
    ...metadata,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a paper and its associated data
 */
export async function deletePaper(paperId: string): Promise<void> {
  // Get paper to find storage path
  const paper = await getPaper(paperId);
  if (!paper) return;

  // Delete storage file
  if (paper.storagePath) {
    await deletePaperFile(paper.storagePath);
  }

  // Delete paper content
  try {
    const contentRef = doc(db, COLLECTIONS.PAPER_CONTENTS, paperId);
    await deleteDoc(contentRef);
  } catch {
    // Content might not exist
  }

  // Delete paper document
  const docRef = doc(db, COLLECTIONS.PAPERS, paperId);
  await deleteDoc(docRef);
}

/**
 * Toggle paper favorite status
 */
export async function togglePaperFavorite(paperId: string): Promise<boolean> {
  const paper = await getPaper(paperId);
  if (!paper) throw new Error('Paper not found');

  const newFavorite = !paper.isFavorite;
  await updatePaper(paperId, { isFavorite: newFavorite });
  return newFavorite;
}

/**
 * Add tags to a paper
 */
export async function addPaperTags(paperId: string, tags: string[]): Promise<void> {
  const paper = await getPaper(paperId);
  if (!paper) throw new Error('Paper not found');

  const existingTags = paper.tags || [];
  const newTags = [...new Set([...existingTags, ...tags])];

  await updatePaper(paperId, { tags: newTags });
}

/**
 * Remove tags from a paper
 */
export async function removePaperTags(paperId: string, tags: string[]): Promise<void> {
  const paper = await getPaper(paperId);
  if (!paper) throw new Error('Paper not found');

  const existingTags = paper.tags || [];
  const newTags = existingTags.filter((t) => !tags.includes(t));

  await updatePaper(paperId, { tags: newTags });
}

// ============================================================================
// PAPER CONTENT OPERATIONS
// ============================================================================

/**
 * Save extracted paper content
 */
export async function savePaperContent(
  paperId: string,
  userId: string,
  content: Omit<PaperContent, 'paperId' | 'userId' | 'extractedAt' | 'updatedAt'>
): Promise<void> {
  const contentRef = doc(db, COLLECTIONS.PAPER_CONTENTS, paperId);

  await updateDoc(contentRef, {
    paperId,
    userId,
    ...content,
    extractedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(async () => {
    // Document doesn't exist, create it
    const { setDoc } = await import('firebase/firestore');
    await setDoc(contentRef, {
      paperId,
      userId,
      ...content,
      extractedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Get paper content by paper ID
 */
export async function getPaperContent(paperId: string): Promise<PaperContent | null> {
  const contentRef = doc(db, COLLECTIONS.PAPER_CONTENTS, paperId);
  const docSnap = await getDoc(contentRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    extractedAt: timestampToDate(data.extractedAt),
    updatedAt: timestampToDate(data.updatedAt),
  } as PaperContent;
}

/**
 * Get multiple papers' content
 */
export async function getMultiplePaperContents(
  paperIds: string[]
): Promise<Map<string, PaperContent>> {
  const contents = new Map<string, PaperContent>();

  await Promise.all(
    paperIds.map(async (paperId) => {
      const content = await getPaperContent(paperId);
      if (content) {
        contents.set(paperId, content);
      }
    })
  );

  return contents;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Get papers by IDs
 */
export async function getPapersByIds(paperIds: string[]): Promise<Paper[]> {
  const papers: Paper[] = [];

  await Promise.all(
    paperIds.map(async (paperId) => {
      const paper = await getPaper(paperId);
      if (paper) {
        papers.push(paper);
      }
    })
  );

  return papers;
}

/**
 * Get user's favorite papers
 */
export async function getFavoritePapers(userId: string): Promise<Paper[]> {
  const papersRef = collection(db, COLLECTIONS.PAPERS);

  const q = query(
    papersRef,
    where('userId', '==', userId),
    where('isFavorite', '==', true),
    orderBy('uploadedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);

  const papers: Paper[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    papers.push({
      id: docSnap.id,
      ...data,
      uploadedAt: timestampToDate(data.uploadedAt),
      updatedAt: timestampToDate(data.updatedAt),
      extractedAt: data.extractedAt ? timestampToDate(data.extractedAt) : undefined,
    } as Paper);
  });

  return papers;
}

/**
 * Search papers by title
 */
export async function searchPapersByTitle(
  userId: string,
  searchTerm: string
): Promise<Paper[]> {
  // Firestore doesn't support full-text search, so we fetch all and filter client-side
  // For production, consider Algolia or Elasticsearch
  const papers = await getUserPapers(userId);

  const lowerSearch = searchTerm.toLowerCase();
  return papers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(lowerSearch) ||
      paper.authors.some((a) => a.name.toLowerCase().includes(lowerSearch)) ||
      paper.abstract?.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Get paper count for a user
 */
export async function getUserPaperCount(userId: string): Promise<number> {
  const papers = await getUserPapers(userId);
  return papers.length;
}

/**
 * Get all unique tags for a user's papers
 */
export async function getUserPaperTags(userId: string): Promise<string[]> {
  const papers = await getUserPapers(userId);

  const allTags = papers.flatMap((p) => p.tags || []);
  return [...new Set(allTags)].sort();
}
