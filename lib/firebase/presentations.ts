// Presentation CRUD Operations
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
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './client';
import {
  Presentation,
  Slide,
  PresentationSettings,
  DEFAULT_PRESENTATION_SETTINGS,
  ThemeId,
} from '../presentations/types';

/**
 * Generate unique presentation ID
 */
export function generatePresentationId(): string {
  return `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique slide ID
 */
export function generateSlideId(): string {
  return `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new presentation
 * @param userId - User ID who owns the presentation
 * @param title - Presentation title
 * @param theme - Theme ID
 * @param documentId - Optional source document ID
 * @returns The created presentation ID
 */
export async function createPresentation(
  userId: string,
  title: string,
  theme: ThemeId,
  documentId?: string
): Promise<string> {
  try {
    const presentationsRef = collection(getFirebaseDb(), 'users', userId, 'presentations');
    const newPresentationRef = doc(presentationsRef);

    const newPresentation = {
      userId,
      documentId: documentId || null,
      title,
      description: '',
      theme,
      slides: [],
      settings: DEFAULT_PRESENTATION_SETTINGS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newPresentationRef, newPresentation);
    return newPresentationRef.id;
  } catch (error) {
    console.error('Error creating presentation:', error);
    throw error;
  }
}

/**
 * Get a presentation by ID
 * @param userId - User ID who owns the presentation
 * @param presentationId - Presentation ID
 * @returns The presentation or null if not found
 */
export async function getPresentation(
  userId: string,
  presentationId: string
): Promise<Presentation | null> {
  try {
    const presentationRef = doc(
      getFirebaseDb(),
      'users',
      userId,
      'presentations',
      presentationId
    );
    const presentationSnap = await getDoc(presentationRef);

    if (presentationSnap.exists()) {
      const data = presentationSnap.data();
      return {
        id: presentationSnap.id,
        userId: data.userId,
        documentId: data.documentId ?? undefined,
        title: data.title,
        description: data.description,
        theme: data.theme,
        slides: data.slides || [],
        settings: data.settings || DEFAULT_PRESENTATION_SETTINGS,
        createdAt: data.createdAt as Timestamp,
        updatedAt: data.updatedAt as Timestamp,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting presentation:', error);
    return null;
  }
}

/**
 * Get all presentations for a user
 * @param userId - User ID
 * @returns Array of presentations
 */
export async function getUserPresentations(
  userId: string
): Promise<Presentation[]> {
  try {
    const presentationsRef = collection(getFirebaseDb(), 'users', userId, 'presentations');
    const q = query(presentationsRef, orderBy('updatedAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const presentations: Presentation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      presentations.push({
        id: doc.id,
        userId: data.userId,
        documentId: data.documentId ?? undefined,
        title: data.title,
        description: data.description,
        theme: data.theme,
        slides: data.slides || [],
        settings: data.settings || DEFAULT_PRESENTATION_SETTINGS,
        createdAt: data.createdAt as Timestamp,
        updatedAt: data.updatedAt as Timestamp,
      });
    });

    return presentations;
  } catch (error) {
    console.error('Error getting user presentations:', error);
    return [];
  }
}

/**
 * Update presentation metadata (title, theme, settings)
 * @param userId - User ID who owns the presentation
 * @param presentationId - Presentation ID
 * @param updates - Partial updates to apply
 */
export async function updatePresentation(
  userId: string,
  presentationId: string,
  updates: Partial<Pick<Presentation, 'title' | 'theme' | 'settings' | 'description'>>
): Promise<void> {
  try {
    const presentationRef = doc(
      getFirebaseDb(),
      'users',
      userId,
      'presentations',
      presentationId
    );

    await updateDoc(presentationRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating presentation:', error);
    throw error;
  }
}

/**
 * Update slides (full replace)
 * @param userId - User ID who owns the presentation
 * @param presentationId - Presentation ID
 * @param slides - New slides array
 */
export async function updatePresentationSlides(
  userId: string,
  presentationId: string,
  slides: Slide[]
): Promise<void> {
  try {
    const presentationRef = doc(
      getFirebaseDb(),
      'users',
      userId,
      'presentations',
      presentationId
    );

    await updateDoc(presentationRef, {
      slides,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating presentation slides:', error);
    throw error;
  }
}

/**
 * Update a single slide
 * @param userId - User ID who owns the presentation
 * @param presentationId - Presentation ID
 * @param slideIndex - Index of the slide to update
 * @param slide - Updated slide data
 */
export async function updateSlide(
  userId: string,
  presentationId: string,
  slideIndex: number,
  slide: Slide
): Promise<void> {
  try {
    // First, get the current presentation
    const presentation = await getPresentation(userId, presentationId);
    if (!presentation) {
      throw new Error('Presentation not found');
    }

    // Update the specific slide
    const updatedSlides = [...presentation.slides];
    if (slideIndex < 0 || slideIndex >= updatedSlides.length) {
      throw new Error('Invalid slide index');
    }
    updatedSlides[slideIndex] = slide;

    // Save back to Firestore
    await updatePresentationSlides(userId, presentationId, updatedSlides);
  } catch (error) {
    console.error('Error updating slide:', error);
    throw error;
  }
}

/**
 * Delete a presentation
 * @param userId - User ID who owns the presentation
 * @param presentationId - Presentation ID
 */
export async function deletePresentation(
  userId: string,
  presentationId: string
): Promise<void> {
  try {
    const presentationRef = doc(
      getFirebaseDb(),
      'users',
      userId,
      'presentations',
      presentationId
    );
    await deleteDoc(presentationRef);
  } catch (error) {
    console.error('Error deleting presentation:', error);
    throw error;
  }
}

/**
 * Real-time listener for a presentation
 * @param userId - User ID who owns the presentation
 * @param presentationId - Presentation ID
 * @param callback - Callback function to receive updates
 * @returns Unsubscribe function
 */
export function subscribeToPresententation(
  userId: string,
  presentationId: string,
  callback: (presentation: Presentation | null) => void
): () => void {
  const presentationRef = doc(
    getFirebaseDb(),
    'users',
    userId,
    'presentations',
    presentationId
  );

  const unsubscribe = onSnapshot(
    presentationRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          id: doc.id,
          userId: data.userId,
          documentId: data.documentId ?? undefined,
          title: data.title,
          description: data.description,
          theme: data.theme,
          slides: data.slides || [],
          settings: data.settings || DEFAULT_PRESENTATION_SETTINGS,
          createdAt: data.createdAt as Timestamp,
          updatedAt: data.updatedAt as Timestamp,
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error in presentation subscription:', error);
      callback(null);
    }
  );

  return unsubscribe;
}
