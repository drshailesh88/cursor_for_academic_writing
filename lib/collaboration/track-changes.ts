// Firestore operations for tracked changes
'use client';

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/schema';
import type { TrackedChange, ChangeType } from './types';

/**
 * Create a new tracked change
 */
export async function createTrackedChange(
  documentId: string,
  type: ChangeType,
  from: number,
  to: number,
  userId: string,
  userName: string,
  oldContent?: string,
  newContent?: string
): Promise<string> {
  try {
    const changeRef = doc(
      collection(db(), COLLECTIONS.DOCUMENTS, documentId, 'changes')
    );

    const change: Omit<TrackedChange, 'id'> = {
      documentId,
      type,
      from,
      to,
      oldContent,
      newContent,
      userId,
      userName,
      createdAt: Date.now(),
      status: 'pending',
    };

    await setDoc(changeRef, change);
    return changeRef.id;
  } catch (error) {
    console.error('Error creating tracked change:', error);
    throw error;
  }
}

/**
 * Get all tracked changes for a document
 */
export async function getTrackedChanges(
  documentId: string,
  status?: 'pending' | 'accepted' | 'rejected'
): Promise<TrackedChange[]> {
  try {
    const changesRef = collection(db(), COLLECTIONS.DOCUMENTS, documentId, 'changes');
    let q = query(changesRef, orderBy('from', 'asc'));

    if (status) {
      q = query(changesRef, where('status', '==', status), orderBy('from', 'asc'));
    }

    const querySnapshot = await getDocs(q);
    const changes: TrackedChange[] = [];

    querySnapshot.forEach((doc) => {
      changes.push({
        id: doc.id,
        ...doc.data(),
      } as TrackedChange);
    });

    return changes;
  } catch (error) {
    console.error('Error getting tracked changes:', error);
    return [];
  }
}

/**
 * Accept a tracked change
 */
export async function acceptChange(
  documentId: string,
  changeId: string,
  userId: string
): Promise<void> {
  try {
    const changeRef = doc(db(), COLLECTIONS.DOCUMENTS, documentId, 'changes', changeId);
    await updateDoc(changeRef, {
      status: 'accepted',
      resolvedBy: userId,
      resolvedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error accepting change:', error);
    throw error;
  }
}

/**
 * Reject a tracked change
 */
export async function rejectChange(
  documentId: string,
  changeId: string,
  userId: string
): Promise<void> {
  try {
    const changeRef = doc(db(), COLLECTIONS.DOCUMENTS, documentId, 'changes', changeId);
    await updateDoc(changeRef, {
      status: 'rejected',
      resolvedBy: userId,
      resolvedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error rejecting change:', error);
    throw error;
  }
}

/**
 * Delete a tracked change
 */
export async function deleteTrackedChange(
  documentId: string,
  changeId: string
): Promise<void> {
  try {
    const changeRef = doc(db(), COLLECTIONS.DOCUMENTS, documentId, 'changes', changeId);
    await deleteDoc(changeRef);
  } catch (error) {
    console.error('Error deleting tracked change:', error);
    throw error;
  }
}

/**
 * Accept all pending changes
 */
export async function acceptAllChanges(
  documentId: string,
  userId: string
): Promise<void> {
  try {
    const changes = await getTrackedChanges(documentId, 'pending');
    const promises = changes.map((change) =>
      acceptChange(documentId, change.id, userId)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error accepting all changes:', error);
    throw error;
  }
}

/**
 * Reject all pending changes
 */
export async function rejectAllChanges(
  documentId: string,
  userId: string
): Promise<void> {
  try {
    const changes = await getTrackedChanges(documentId, 'pending');
    const promises = changes.map((change) =>
      rejectChange(documentId, change.id, userId)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error rejecting all changes:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time tracked changes updates
 */
export function subscribeToTrackedChanges(
  documentId: string,
  callback: (changes: TrackedChange[]) => void
): Unsubscribe {
  const changesRef = collection(db(), COLLECTIONS.DOCUMENTS, documentId, 'changes');
  const q = query(changesRef, orderBy('from', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const changes: TrackedChange[] = [];
      snapshot.forEach((doc) => {
        changes.push({
          id: doc.id,
          ...doc.data(),
        } as TrackedChange);
      });
      callback(changes);
    },
    (error) => {
      console.error('Error subscribing to tracked changes:', error);
    }
  );
}
