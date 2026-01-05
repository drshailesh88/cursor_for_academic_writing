// Document Sharing Operations
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
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/schema';
import { DocumentShare, SharedDocument, SharePermission } from './types';

/**
 * Generate a cryptographically secure share token
 */
function generateShareToken(): string {
  // Use crypto.randomUUID for a secure token
  return crypto.randomUUID();
}

/**
 * Create a share link for a document
 * @param documentId - Document to share
 * @param userId - User creating the share
 * @param userName - Display name of user creating the share
 * @param permission - Permission level to grant
 * @param expiresIn - Optional expiration in milliseconds (e.g., 7 days = 7 * 24 * 60 * 60 * 1000)
 * @returns The share token
 */
export async function createShareLink(
  documentId: string,
  userId: string,
  userName: string,
  permission: SharePermission,
  expiresIn?: number
): Promise<string> {
  try {
    const shareToken = generateShareToken();
    const now = Date.now();
    const shareRef = doc(collection(db(), COLLECTIONS.DOCUMENTS, documentId, 'shares'));

    const shareData: Omit<DocumentShare, 'id'> = {
      documentId,
      type: 'link',
      shareToken,
      permission,
      createdBy: userId,
      createdByName: userName,
      createdAt: now,
      expiresAt: expiresIn ? now + expiresIn : undefined,
      active: true,
    };

    await setDoc(shareRef, shareData);
    return shareToken;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
}

/**
 * Share a document with a specific user via email
 * @param documentId - Document to share
 * @param userId - User creating the share
 * @param userName - Display name of user creating the share
 * @param email - Email address to share with
 * @param permission - Permission level to grant
 * @returns The share ID
 */
export async function createEmailShare(
  documentId: string,
  userId: string,
  userName: string,
  email: string,
  permission: SharePermission
): Promise<string> {
  try {
    const now = Date.now();
    const shareRef = doc(collection(db(), COLLECTIONS.DOCUMENTS, documentId, 'shares'));

    // Look up user by email (if they exist in the system)
    const usersQuery = query(
      collection(db(), COLLECTIONS.USERS),
      where('email', '==', email)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const sharedWithUserId = usersSnapshot.empty ? undefined : usersSnapshot.docs[0].id;

    const shareData: Omit<DocumentShare, 'id'> = {
      documentId,
      type: 'email',
      sharedWithEmail: email,
      sharedWithUserId,
      permission,
      createdBy: userId,
      createdByName: userName,
      createdAt: now,
      active: true,
    };

    await setDoc(shareRef, shareData);

    // If user exists, add to their sharedWithMe collection
    if (sharedWithUserId) {
      await addToSharedWithMe(sharedWithUserId, documentId, shareRef.id, permission);
    }

    return shareRef.id;
  } catch (error) {
    console.error('Error creating email share:', error);
    throw error;
  }
}

/**
 * Add a document to a user's sharedWithMe collection
 */
async function addToSharedWithMe(
  userId: string,
  documentId: string,
  shareId: string,
  permission: SharePermission
): Promise<void> {
  try {
    // Get document details
    const docRef = doc(db(), COLLECTIONS.DOCUMENTS, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }

    const docData = docSnap.data();
    const now = Date.now();

    // Get owner details
    const ownerRef = doc(db(), COLLECTIONS.USERS, docData.userId);
    const ownerSnap = await getDoc(ownerRef);
    const ownerData = ownerSnap.exists() ? ownerSnap.data() : null;

    const sharedDocRef = doc(db(), COLLECTIONS.USERS, userId, 'sharedWithMe', documentId);

    // Handle both Timestamp objects and numbers
    const updatedAtValue = typeof docData.updatedAt === 'number'
      ? docData.updatedAt
      : (docData.updatedAt as Timestamp)?.toMillis() || now;
    const sharedDocData: Omit<SharedDocument, 'documentId'> & { shareId: string } = {
      title: docData.title,
      ownerName: ownerData?.displayName || 'Unknown',
      ownerId: docData.userId,
      permission,
      sharedAt: now,
      updatedAt: updatedAtValue,
      wordCount: docData.wordCount,
      shareId,
    };

    await setDoc(sharedDocRef, sharedDocData);
  } catch (error) {
    console.error('Error adding to sharedWithMe:', error);
    throw error;
  }
}

/**
 * Get all shares for a document
 * @param documentId - Document ID
 * @returns Array of shares
 */
export async function getDocumentShares(documentId: string): Promise<DocumentShare[]> {
  try {
    const sharesRef = collection(db(), COLLECTIONS.DOCUMENTS, documentId, 'shares');
    const q = query(sharesRef, where('active', '==', true), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const shares: DocumentShare[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      shares.push({
        id: doc.id,
        documentId: data.documentId,
        type: data.type,
        shareToken: data.shareToken,
        sharedWithEmail: data.sharedWithEmail,
        sharedWithUserId: data.sharedWithUserId,
        permission: data.permission,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        active: data.active,
      });
    });

    return shares;
  } catch (error) {
    console.error('Error getting document shares:', error);
    return [];
  }
}

/**
 * Get documents shared with the current user
 * @param userId - Current user ID
 * @returns Array of shared documents
 */
export async function getSharedWithMe(userId: string): Promise<SharedDocument[]> {
  try {
    const sharedRef = collection(db(), COLLECTIONS.USERS, userId, 'sharedWithMe');
    const q = query(sharedRef, orderBy('sharedAt', 'desc'));
    const snapshot = await getDocs(q);

    const sharedDocs: SharedDocument[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      sharedDocs.push({
        documentId: doc.id,
        title: data.title,
        ownerName: data.ownerName,
        ownerId: data.ownerId,
        permission: data.permission,
        sharedAt: data.sharedAt,
        updatedAt: data.updatedAt,
        wordCount: data.wordCount,
      });
    });

    return sharedDocs;
  } catch (error) {
    console.error('Error getting shared documents:', error);
    return [];
  }
}

/**
 * Revoke a share
 * @param documentId - Document ID
 * @param shareId - Share ID to revoke
 */
export async function revokeShare(documentId: string, shareId: string): Promise<void> {
  try {
    const shareRef = doc(db(), COLLECTIONS.DOCUMENTS, documentId, 'shares', shareId);
    const shareSnap = await getDoc(shareRef);

    if (!shareSnap.exists()) {
      throw new Error('Share not found');
    }

    const shareData = shareSnap.data();

    // Mark share as inactive
    await updateDoc(shareRef, { active: false });

    // If it's an email share, remove from user's sharedWithMe
    if (shareData.type === 'email' && shareData.sharedWithUserId) {
      const sharedDocRef = doc(
        db(),
        COLLECTIONS.USERS,
        shareData.sharedWithUserId,
        'sharedWithMe',
        documentId
      );
      await deleteDoc(sharedDocRef);
    }
  } catch (error) {
    console.error('Error revoking share:', error);
    throw error;
  }
}

/**
 * Update share permission
 * @param documentId - Document ID
 * @param shareId - Share ID
 * @param permission - New permission level
 */
export async function updateSharePermission(
  documentId: string,
  shareId: string,
  permission: SharePermission
): Promise<void> {
  try {
    const shareRef = doc(db(), COLLECTIONS.DOCUMENTS, documentId, 'shares', shareId);
    const shareSnap = await getDoc(shareRef);

    if (!shareSnap.exists()) {
      throw new Error('Share not found');
    }

    const shareData = shareSnap.data();

    // Update share permission
    await updateDoc(shareRef, { permission });

    // If it's an email share, update in user's sharedWithMe
    if (shareData.type === 'email' && shareData.sharedWithUserId) {
      const sharedDocRef = doc(
        db(),
        COLLECTIONS.USERS,
        shareData.sharedWithUserId,
        'sharedWithMe',
        documentId
      );
      await updateDoc(sharedDocRef, { permission });
    }
  } catch (error) {
    console.error('Error updating share permission:', error);
    throw error;
  }
}

/**
 * Validate a share token and get document access
 * @param token - Share token to validate
 * @returns Document ID and permission if valid, null otherwise
 */
export async function validateShareToken(
  token: string
): Promise<{ documentId: string; permission: SharePermission } | null> {
  try {
    // Query all documents' shares for this token
    // Note: This requires a composite index on shares collection
    const documentsRef = collection(db(), COLLECTIONS.DOCUMENTS);
    const documentsSnapshot = await getDocs(documentsRef);

    for (const docSnapshot of documentsSnapshot.docs) {
      const sharesRef = collection(db(), COLLECTIONS.DOCUMENTS, docSnapshot.id, 'shares');
      const q = query(
        sharesRef,
        where('shareToken', '==', token),
        where('active', '==', true)
      );
      const sharesSnapshot = await getDocs(q);

      if (!sharesSnapshot.empty) {
        const shareData = sharesSnapshot.docs[0].data();

        // Check if expired
        if (shareData.expiresAt && shareData.expiresAt < Date.now()) {
          // Mark as inactive
          await updateDoc(sharesSnapshot.docs[0].ref, { active: false });
          return null;
        }

        return {
          documentId: docSnapshot.id,
          permission: shareData.permission,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error validating share token:', error);
    return null;
  }
}

/**
 * Check if a user has access to a document
 * @param documentId - Document ID
 * @param userId - User ID
 * @returns Permission level if user has access, null otherwise
 */
export async function getUserDocumentPermission(
  documentId: string,
  userId: string
): Promise<SharePermission | null> {
  try {
    // Check if user owns the document
    const docRef = doc(db(), COLLECTIONS.DOCUMENTS, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const docData = docSnap.data();
    if (docData.userId === userId) {
      return 'edit'; // Owner has full edit access
    }

    // Check if document is shared with user
    const sharedDocRef = doc(db(), COLLECTIONS.USERS, userId, 'sharedWithMe', documentId);
    const sharedDocSnap = await getDoc(sharedDocRef);

    if (sharedDocSnap.exists()) {
      return sharedDocSnap.data().permission;
    }

    return null;
  } catch (error) {
    console.error('Error checking user document permission:', error);
    return null;
  }
}
