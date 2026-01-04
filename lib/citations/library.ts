/**
 * Citation Library Operations
 *
 * Firestore CRUD operations for managing user's reference library.
 * Supports folders, labels, search, and duplicate detection.
 */

'use client';

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
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/schema';
import {
  Reference,
  LibraryFolder,
  LibraryLabel,
  LibrarySearchOptions,
  ReferenceAuthor,
  generateCiteKey,
} from './types';

// ============================================
// REFERENCES
// ============================================

/**
 * Get user's references collection path
 */
function getReferencesCollection(userId: string) {
  return collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.REFERENCES);
}

/**
 * Add a reference to user's library
 */
export async function addReference(
  userId: string,
  reference: Omit<Reference, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const colRef = getReferencesCollection(userId);
    const docRef = doc(colRef);

    // Generate cite key if not provided
    const citeKey = reference.citeKey || generateCiteKey(reference as Reference);

    const newRef = {
      ...reference,
      id: docRef.id,
      citeKey,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, newRef);
    return docRef.id;
  } catch (error) {
    console.error('Error adding reference:', error);
    throw error;
  }
}

/**
 * Add multiple references (batch import)
 */
export async function addReferences(
  userId: string,
  references: Omit<Reference, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<string[]> {
  try {
    const batch = writeBatch(db);
    const ids: string[] = [];
    const colRef = getReferencesCollection(userId);

    for (const reference of references) {
      const docRef = doc(colRef);
      const citeKey = reference.citeKey || generateCiteKey(reference as Reference);

      batch.set(docRef, {
        ...reference,
        id: docRef.id,
        citeKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      ids.push(docRef.id);
    }

    await batch.commit();
    return ids;
  } catch (error) {
    console.error('Error adding references:', error);
    throw error;
  }
}

/**
 * Get a reference by ID
 */
export async function getReference(
  userId: string,
  referenceId: string
): Promise<Reference | null> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.REFERENCES, referenceId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Reference;
  } catch (error) {
    console.error('Error getting reference:', error);
    return null;
  }
}

/**
 * Update a reference
 */
export async function updateReference(
  userId: string,
  referenceId: string,
  updates: Partial<Reference>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.REFERENCES, referenceId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating reference:', error);
    throw error;
  }
}

/**
 * Delete a reference
 */
export async function deleteReference(
  userId: string,
  referenceId: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.REFERENCES, referenceId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting reference:', error);
    throw error;
  }
}

/**
 * Delete multiple references
 */
export async function deleteReferences(
  userId: string,
  referenceIds: string[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    for (const id of referenceIds) {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.REFERENCES, id);
      batch.delete(docRef);
    }

    await batch.commit();
  } catch (error) {
    console.error('Error deleting references:', error);
    throw error;
  }
}

/**
 * Get all references for a user
 */
export async function getAllReferences(
  userId: string,
  sortBy: 'title' | 'author' | 'year' | 'added' | 'updated' = 'added',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<Reference[]> {
  try {
    const colRef = getReferencesCollection(userId);

    // Map sort fields to Firestore fields
    const sortField = {
      'title': 'title',
      'author': 'authors',
      'year': 'issued.year',
      'added': 'createdAt',
      'updated': 'updatedAt',
    }[sortBy] || 'createdAt';

    const q = query(colRef, orderBy(sortField, sortOrder));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as Reference;
    });
  } catch (error) {
    console.error('Error getting references:', error);
    return [];
  }
}

/**
 * Search references in library
 */
export async function searchReferences(
  userId: string,
  options: LibrarySearchOptions
): Promise<Reference[]> {
  try {
    // Get all references first (Firestore doesn't support full-text search)
    const allRefs = await getAllReferences(userId, options.sortBy, options.sortOrder);

    let results = allRefs;

    // Filter by query text
    if (options.query) {
      const queryLower = options.query.toLowerCase();
      const searchFields = options.fields || ['title', 'authors', 'abstract', 'keywords'];

      results = results.filter(ref => {
        for (const field of searchFields) {
          if (field === 'title' && ref.title?.toLowerCase().includes(queryLower)) return true;
          if (field === 'authors') {
            const authorMatch = ref.authors?.some(a =>
              `${a.given} ${a.family}`.toLowerCase().includes(queryLower)
            );
            if (authorMatch) return true;
          }
          if (field === 'abstract' && ref.abstract?.toLowerCase().includes(queryLower)) return true;
          if (field === 'keywords') {
            const keywordMatch = ref.keywords?.some(k => k.toLowerCase().includes(queryLower));
            if (keywordMatch) return true;
          }
          if (field === 'notes' && ref.notes?.toLowerCase().includes(queryLower)) return true;
        }
        return false;
      });
    }

    // Filter by type
    if (options.types && options.types.length > 0) {
      results = results.filter(ref => options.types!.includes(ref.type));
    }

    // Filter by folder
    if (options.folders && options.folders.length > 0) {
      results = results.filter(ref =>
        ref.folders?.some(f => options.folders!.includes(f))
      );
    }

    // Filter by labels
    if (options.labels && options.labels.length > 0) {
      results = results.filter(ref =>
        ref.labels?.some(l => options.labels!.includes(l))
      );
    }

    // Filter by year range
    if (options.yearRange) {
      if (options.yearRange.start) {
        results = results.filter(ref => ref.issued.year >= options.yearRange!.start!);
      }
      if (options.yearRange.end) {
        results = results.filter(ref => ref.issued.year <= options.yearRange!.end!);
      }
    }

    // Filter by read status
    if (options.readStatus) {
      results = results.filter(ref => ref.readStatus === options.readStatus);
    }

    // Filter by favorite
    if (options.favorite !== undefined) {
      results = results.filter(ref => ref.favorite === options.favorite);
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limitCount = options.limit || results.length;
    results = results.slice(offset, offset + limitCount);

    return results;
  } catch (error) {
    console.error('Error searching references:', error);
    return [];
  }
}

/**
 * Find duplicate references by DOI or title
 */
export async function findDuplicates(
  userId: string,
  reference: Partial<Reference>
): Promise<Reference[]> {
  try {
    const allRefs = await getAllReferences(userId);
    const duplicates: Reference[] = [];

    for (const existing of allRefs) {
      // Check DOI match
      if (reference.identifiers?.doi && existing.identifiers?.doi) {
        if (reference.identifiers.doi.toLowerCase() === existing.identifiers.doi.toLowerCase()) {
          duplicates.push(existing);
          continue;
        }
      }

      // Check title similarity (normalized)
      if (reference.title && existing.title) {
        const normalizedNew = reference.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedExisting = existing.title.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (normalizedNew.length > 20 && normalizedNew === normalizedExisting) {
          duplicates.push(existing);
        }
      }
    }

    return duplicates;
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return [];
  }
}

/**
 * Get references by folder
 */
export async function getReferencesByFolder(
  userId: string,
  folderId: string
): Promise<Reference[]> {
  try {
    const colRef = getReferencesCollection(userId);
    const q = query(colRef, where('folders', 'array-contains', folderId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as Reference;
    });
  } catch (error) {
    console.error('Error getting references by folder:', error);
    return [];
  }
}

/**
 * Get references by label
 */
export async function getReferencesByLabel(
  userId: string,
  label: string
): Promise<Reference[]> {
  try {
    const colRef = getReferencesCollection(userId);
    const q = query(colRef, where('labels', 'array-contains', label));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as Reference;
    });
  } catch (error) {
    console.error('Error getting references by label:', error);
    return [];
  }
}

// ============================================
// FOLDERS
// ============================================

/**
 * Get folders collection path
 */
function getFoldersCollection(userId: string) {
  return collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.LIBRARY_FOLDERS);
}

/**
 * Create a folder
 */
export async function createFolder(
  userId: string,
  folder: Omit<LibraryFolder, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const colRef = getFoldersCollection(userId);
    const docRef = doc(colRef);

    await setDoc(docRef, {
      ...folder,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

/**
 * Get all folders
 */
export async function getFolders(userId: string): Promise<LibraryFolder[]> {
  try {
    const colRef = getFoldersCollection(userId);
    const q = query(colRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as LibraryFolder;
    });
  } catch (error) {
    console.error('Error getting folders:', error);
    return [];
  }
}

/**
 * Update a folder
 */
export async function updateFolder(
  userId: string,
  folderId: string,
  updates: Partial<LibraryFolder>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.LIBRARY_FOLDERS, folderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
}

/**
 * Delete a folder (and remove from references)
 */
export async function deleteFolder(userId: string, folderId: string): Promise<void> {
  try {
    // Remove folder from all references that have it
    const refs = await getReferencesByFolder(userId, folderId);
    const batch = writeBatch(db);

    for (const ref of refs) {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.REFERENCES, ref.id);
      const updatedFolders = (ref.folders || []).filter(f => f !== folderId);
      batch.update(docRef, { folders: updatedFolders, updatedAt: serverTimestamp() });
    }

    // Delete the folder
    const folderRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.LIBRARY_FOLDERS, folderId);
    batch.delete(folderRef);

    await batch.commit();
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
}

// ============================================
// LABELS
// ============================================

/**
 * Get labels collection path
 */
function getLabelsCollection(userId: string) {
  return collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.LIBRARY_LABELS);
}

/**
 * Create a label
 */
export async function createLabel(
  userId: string,
  label: Omit<LibraryLabel, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const colRef = getLabelsCollection(userId);
    const docRef = doc(colRef);

    await setDoc(docRef, {
      ...label,
      id: docRef.id,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating label:', error);
    throw error;
  }
}

/**
 * Get all labels
 */
export async function getLabels(userId: string): Promise<LibraryLabel[]> {
  try {
    const colRef = getLabelsCollection(userId);
    const q = query(colRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      } as LibraryLabel;
    });
  } catch (error) {
    console.error('Error getting labels:', error);
    return [];
  }
}

/**
 * Delete a label (and remove from references)
 */
export async function deleteLabel(userId: string, labelName: string): Promise<void> {
  try {
    // Remove label from all references
    const refs = await getReferencesByLabel(userId, labelName);
    const batch = writeBatch(db);

    for (const ref of refs) {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.REFERENCES, ref.id);
      const updatedLabels = (ref.labels || []).filter(l => l !== labelName);
      batch.update(docRef, { labels: updatedLabels, updatedAt: serverTimestamp() });
    }

    // Find and delete the label document
    const labels = await getLabels(userId);
    const labelDoc = labels.find(l => l.name === labelName);
    if (labelDoc) {
      const labelRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.LIBRARY_LABELS, labelDoc.id);
      batch.delete(labelRef);
    }

    await batch.commit();
  } catch (error) {
    console.error('Error deleting label:', error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Add reference to folder
 */
export async function addReferenceToFolder(
  userId: string,
  referenceId: string,
  folderId: string
): Promise<void> {
  const ref = await getReference(userId, referenceId);
  if (!ref) throw new Error('Reference not found');

  const folders = [...(ref.folders || [])];
  if (!folders.includes(folderId)) {
    folders.push(folderId);
    await updateReference(userId, referenceId, { folders });
  }
}

/**
 * Remove reference from folder
 */
export async function removeReferenceFromFolder(
  userId: string,
  referenceId: string,
  folderId: string
): Promise<void> {
  const ref = await getReference(userId, referenceId);
  if (!ref) throw new Error('Reference not found');

  const folders = (ref.folders || []).filter(f => f !== folderId);
  await updateReference(userId, referenceId, { folders });
}

/**
 * Add label to reference
 */
export async function addLabelToReference(
  userId: string,
  referenceId: string,
  label: string
): Promise<void> {
  const ref = await getReference(userId, referenceId);
  if (!ref) throw new Error('Reference not found');

  const labels = [...(ref.labels || [])];
  if (!labels.includes(label)) {
    labels.push(label);
    await updateReference(userId, referenceId, { labels });
  }
}

/**
 * Remove label from reference
 */
export async function removeLabelFromReference(
  userId: string,
  referenceId: string,
  label: string
): Promise<void> {
  const ref = await getReference(userId, referenceId);
  if (!ref) throw new Error('Reference not found');

  const labels = (ref.labels || []).filter(l => l !== label);
  await updateReference(userId, referenceId, { labels });
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  userId: string,
  referenceId: string
): Promise<boolean> {
  const ref = await getReference(userId, referenceId);
  if (!ref) throw new Error('Reference not found');

  const newFavorite = !ref.favorite;
  await updateReference(userId, referenceId, { favorite: newFavorite });
  return newFavorite;
}

/**
 * Update read status
 */
export async function updateReadStatus(
  userId: string,
  referenceId: string,
  status: 'unread' | 'reading' | 'read'
): Promise<void> {
  await updateReference(userId, referenceId, { readStatus: status });
}

/**
 * Get library statistics
 */
export async function getLibraryStats(userId: string): Promise<{
  totalReferences: number;
  byType: Record<string, number>;
  byYear: Record<number, number>;
  favorites: number;
  unread: number;
}> {
  try {
    const refs = await getAllReferences(userId);

    const byType: Record<string, number> = {};
    const byYear: Record<number, number> = {};
    let favorites = 0;
    let unread = 0;

    for (const ref of refs) {
      // Count by type
      byType[ref.type] = (byType[ref.type] || 0) + 1;

      // Count by year
      if (ref.issued?.year) {
        byYear[ref.issued.year] = (byYear[ref.issued.year] || 0) + 1;
      }

      // Count favorites
      if (ref.favorite) favorites++;

      // Count unread
      if (!ref.readStatus || ref.readStatus === 'unread') unread++;
    }

    return {
      totalReferences: refs.length,
      byType,
      byYear,
      favorites,
      unread,
    };
  } catch (error) {
    console.error('Error getting library stats:', error);
    return {
      totalReferences: 0,
      byType: {},
      byYear: {},
      favorites: 0,
      unread: 0,
    };
  }
}
