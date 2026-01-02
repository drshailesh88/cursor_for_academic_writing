// Document CRUD Operations
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
} from 'firebase/firestore';
import { db } from './client';
import { COLLECTIONS, Document, DocumentMetadata, DisciplineId, createNewDocument } from './schema';

// Create a new document
export async function createDocument(
  userId: string,
  title: string = 'Untitled Document'
): Promise<string> {
  try {
    const docRef = doc(collection(db, COLLECTIONS.DOCUMENTS));
    const newDoc = {
      ...createNewDocument(userId, title),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, newDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

// Get a document by ID
export async function getDocument(documentId: string): Promise<Document | null> {
  try {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as Document;
    }

    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
}

// Update document content
export async function updateDocument(
  documentId: string,
  updates: Partial<Document>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

// Save document content (auto-save)
export async function saveDocumentContent(
  documentId: string,
  content: string,
  wordCount: number
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await updateDoc(docRef, {
      content,
      wordCount,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving document content:', error);
    throw error;
  }
}

// Delete a document
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// Get all documents for a user
export async function getUserDocuments(
  userId: string,
  limitCount: number = 50
): Promise<DocumentMetadata[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.DOCUMENTS),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const documents: DocumentMetadata[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        title: data.title,
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
        wordCount: data.wordCount || 0,
        folder: data.folder,
        discipline: data.discipline,
      });
    });

    return documents;
  } catch (error) {
    console.error('Error getting user documents:', error);
    return [];
  }
}

// Get recent documents
export async function getRecentDocuments(
  userId: string,
  limitCount: number = 10
): Promise<DocumentMetadata[]> {
  return getUserDocuments(userId, limitCount);
}

// Rename document
export async function renameDocument(
  documentId: string,
  newTitle: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await updateDoc(docRef, {
      title: newTitle,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error renaming document:', error);
    throw error;
  }
}

// Update document discipline
export async function updateDocumentDiscipline(
  documentId: string,
  discipline: DisciplineId
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await updateDoc(docRef, {
      discipline,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating document discipline:', error);
    throw error;
  }
}
