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
import { getFirebaseDb } from './client';
import { COLLECTIONS, Document, DocumentMetadata, DisciplineId, createNewDocument } from './schema';
import { isDevAuthBypass } from './auth';

// Development mode localStorage storage
const DEV_STORAGE_KEY = 'dev_documents';

function getDevDocuments(): Document[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DEV_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function setDevDocuments(docs: Document[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(docs));
}

function generateDevId(): string {
  return 'dev-' + Math.random().toString(36).substring(2, 15);
}

// Create a new document
export async function createDocument(
  userId: string,
  title: string = 'Untitled Document'
): Promise<string> {
  // Dev mode: use localStorage
  if (isDevAuthBypass()) {
    const id = generateDevId();
    const newDoc: Document = {
      ...createNewDocument(userId, title),
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docs = getDevDocuments();
    docs.unshift(newDoc);
    setDevDocuments(docs);
    console.log('[DEV MODE] Document created in localStorage:', id);
    return id;
  }

  try {
    const docRef = doc(collection(getFirebaseDb(), COLLECTIONS.DOCUMENTS));
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
  // Dev mode: use localStorage
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    const doc = docs.find(d => d.id === documentId);
    return doc || null;
  }

  try {
    const docRef = doc(getFirebaseDb(), COLLECTIONS.DOCUMENTS, documentId);
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
  // Dev mode: use localStorage
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    const index = docs.findIndex(d => d.id === documentId);
    if (index !== -1) {
      docs[index] = { ...docs[index], ...updates, updatedAt: new Date() };
      setDevDocuments(docs);
    }
    return;
  }

  try {
    const docRef = doc(getFirebaseDb(), COLLECTIONS.DOCUMENTS, documentId);
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
  // Dev mode: use localStorage
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    const index = docs.findIndex(d => d.id === documentId);
    if (index !== -1) {
      docs[index] = { ...docs[index], content, wordCount, updatedAt: new Date() };
      setDevDocuments(docs);
    }
    return;
  }

  try {
    const docRef = doc(getFirebaseDb(), COLLECTIONS.DOCUMENTS, documentId);
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
  // Dev mode: use localStorage
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    const filtered = docs.filter(d => d.id !== documentId);
    setDevDocuments(filtered);
    console.log('[DEV MODE] Document deleted from localStorage:', documentId);
    return;
  }

  try {
    const docRef = doc(getFirebaseDb(), COLLECTIONS.DOCUMENTS, documentId);
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
  // Dev mode: use localStorage
  if (isDevAuthBypass()) {
    const docs = getDevDocuments()
      .filter(d => d.userId === userId)
      .slice(0, limitCount)
      .map(d => ({
        id: d.id,
        title: d.title,
        updatedAt: new Date(d.updatedAt),
        wordCount: d.wordCount || 0,
        folder: d.folder,
        discipline: d.discipline,
      }));
    return docs;
  }

  try {
    const q = query(
      collection(getFirebaseDb(), COLLECTIONS.DOCUMENTS),
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
  // Dev mode: use localStorage
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    const index = docs.findIndex(d => d.id === documentId);
    if (index !== -1) {
      docs[index] = { ...docs[index], title: newTitle, updatedAt: new Date() };
      setDevDocuments(docs);
    }
    return;
  }

  try {
    const docRef = doc(getFirebaseDb(), COLLECTIONS.DOCUMENTS, documentId);
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
  // Dev mode: use localStorage
  if (isDevAuthBypass()) {
    const docs = getDevDocuments();
    const index = docs.findIndex(d => d.id === documentId);
    if (index !== -1) {
      docs[index] = { ...docs[index], discipline, updatedAt: new Date() };
      setDevDocuments(docs);
    }
    return;
  }

  try {
    const docRef = doc(getFirebaseDb(), COLLECTIONS.DOCUMENTS, documentId);
    await updateDoc(docRef, {
      discipline,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating document discipline:', error);
    throw error;
  }
}
