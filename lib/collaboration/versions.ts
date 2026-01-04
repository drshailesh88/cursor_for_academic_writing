// Version History Firestore Operations
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
  orderBy,
  limit,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getDocument } from '@/lib/firebase/documents';
import type { DocumentVersion, CreateVersionOptions } from './types';

/**
 * Maximum number of versions to keep per document
 * Older auto-save versions will be deleted when limit is exceeded
 */
const MAX_VERSIONS = 50;

/**
 * Create a new version snapshot of a document
 */
export async function createVersion(
  documentId: string,
  content: string,
  wordCount: number,
  userId: string,
  userName: string,
  options: CreateVersionOptions
): Promise<string> {
  try {
    // Get the current document to capture title
    const document = await getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Get current version count to determine next version number
    const versionsRef = collection(db, 'documents', documentId, 'versions');
    const versionsQuery = query(versionsRef, orderBy('versionNumber', 'desc'), limit(1));
    const versionsSnapshot = await getDocs(versionsQuery);

    let nextVersionNumber = 1;
    if (!versionsSnapshot.empty) {
      const latestVersion = versionsSnapshot.docs[0].data();
      nextVersionNumber = (latestVersion.versionNumber || 0) + 1;
    }

    // Create new version document
    const versionRef = doc(versionsRef);
    const newVersion: Omit<DocumentVersion, 'id'> = {
      documentId,
      versionNumber: nextVersionNumber,
      title: document.title,
      content,
      wordCount,
      userId,
      userName,
      label: options.label,
      description: options.description,
      createdAt: Date.now(),
      type: options.type,
    };

    await setDoc(versionRef, newVersion);

    // Cleanup old auto-save versions if we exceed the limit
    await cleanupOldVersions(documentId, options.type);

    return versionRef.id;
  } catch (error) {
    console.error('Error creating version:', error);
    throw error;
  }
}

/**
 * Get all versions for a document
 */
export async function getVersions(
  documentId: string,
  limitCount: number = MAX_VERSIONS
): Promise<DocumentVersion[]> {
  try {
    const versionsRef = collection(db, 'documents', documentId, 'versions');
    const versionsQuery = query(
      versionsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const versionsSnapshot = await getDocs(versionsQuery);
    const versions: DocumentVersion[] = [];

    versionsSnapshot.forEach((doc) => {
      const data = doc.data();
      versions.push({
        id: doc.id,
        ...data,
      } as DocumentVersion);
    });

    return versions;
  } catch (error) {
    console.error('Error getting versions:', error);
    return [];
  }
}

/**
 * Get a specific version
 */
export async function getVersion(
  documentId: string,
  versionId: string
): Promise<DocumentVersion | null> {
  try {
    const versionRef = doc(db, 'documents', documentId, 'versions', versionId);
    const versionSnap = await getDoc(versionRef);

    if (versionSnap.exists) {
      const data = versionSnap.data();
      return {
        id: versionSnap.id,
        ...data,
      } as DocumentVersion;
    }

    return null;
  } catch (error) {
    console.error('Error getting version:', error);
    return null;
  }
}

/**
 * Delete a specific version
 */
export async function deleteVersion(
  documentId: string,
  versionId: string
): Promise<void> {
  try {
    const versionRef = doc(db, 'documents', documentId, 'versions', versionId);
    await deleteDoc(versionRef);
  } catch (error) {
    console.error('Error deleting version:', error);
    throw error;
  }
}

/**
 * Restore a document to a specific version
 */
export async function restoreVersion(
  documentId: string,
  versionId: string,
  currentUserId: string,
  currentUserName: string
): Promise<void> {
  try {
    // Get the version to restore
    const version = await getVersion(documentId, versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    // Get current document state to create a backup version before restoring
    const currentDocument = await getDocument(documentId);
    if (!currentDocument) {
      throw new Error('Document not found');
    }

    // Create a backup of current state before restoring
    await createVersion(
      documentId,
      currentDocument.content,
      currentDocument.wordCount,
      currentUserId,
      currentUserName,
      {
        type: 'manual',
        label: 'Pre-restore backup',
        description: `Backup before restoring to version ${version.versionNumber}`,
      }
    );

    // Update the document with the version's content
    const documentRef = doc(db, 'documents', documentId);
    await updateDoc(documentRef, {
      content: version.content,
      title: version.title,
      wordCount: version.wordCount,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    throw error;
  }
}

/**
 * Update a version's label
 */
export async function updateVersionLabel(
  documentId: string,
  versionId: string,
  label: string
): Promise<void> {
  try {
    const versionRef = doc(db, 'documents', documentId, 'versions', versionId);
    await updateDoc(versionRef, {
      label,
    });
  } catch (error) {
    console.error('Error updating version label:', error);
    throw error;
  }
}

/**
 * Update a version's description
 */
export async function updateVersionDescription(
  documentId: string,
  versionId: string,
  description: string
): Promise<void> {
  try {
    const versionRef = doc(db, 'documents', documentId, 'versions', versionId);
    await updateDoc(versionRef, {
      description,
    });
  } catch (error) {
    console.error('Error updating version description:', error);
    throw error;
  }
}

/**
 * Clean up old auto-save versions to maintain the version limit
 * Keeps all manual versions and only deletes auto-save versions
 */
async function cleanupOldVersions(
  documentId: string,
  versionType: 'auto' | 'manual'
): Promise<void> {
  // Only cleanup if this is an auto-save version
  if (versionType !== 'auto') {
    return;
  }

  try {
    const versionsRef = collection(db, 'documents', documentId, 'versions');

    // Get all auto-save versions
    const autoVersionsQuery = query(
      versionsRef,
      where('type', '==', 'auto'),
      orderBy('createdAt', 'desc')
    );

    const autoVersionsSnapshot = await getDocs(autoVersionsQuery);

    // If we have more than MAX_VERSIONS auto-saves, delete the oldest ones
    if (autoVersionsSnapshot.size > MAX_VERSIONS) {
      const batch = writeBatch(db);
      const versionsToDelete = autoVersionsSnapshot.docs.slice(MAX_VERSIONS);

      versionsToDelete.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${versionsToDelete.length} old auto-save versions`);
    }
  } catch (error) {
    console.error('Error cleaning up old versions:', error);
    // Don't throw - cleanup failure shouldn't prevent version creation
  }
}

/**
 * Get version statistics
 */
export async function getVersionStats(documentId: string): Promise<{
  totalVersions: number;
  manualVersions: number;
  autoVersions: number;
  latestVersion?: DocumentVersion;
}> {
  try {
    const versions = await getVersions(documentId);

    const stats = {
      totalVersions: versions.length,
      manualVersions: versions.filter((v) => v.type === 'manual').length,
      autoVersions: versions.filter((v) => v.type === 'auto').length,
      latestVersion: versions[0],
    };

    return stats;
  } catch (error) {
    console.error('Error getting version stats:', error);
    return {
      totalVersions: 0,
      manualVersions: 0,
      autoVersions: 0,
    };
  }
}
