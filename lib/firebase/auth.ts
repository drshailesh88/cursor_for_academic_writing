// Firebase Authentication Hooks and Utilities
'use client';

import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb } from './client';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS, UserProfile } from './schema';

// Google Sign-In
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(getFirebaseAuth(), provider);

    // Create/update user profile in Firestore
    const userRef = doc(getFirebaseDb(), COLLECTIONS.USERS, result.user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // First time user - create profile
      const userProfile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & {
        createdAt: any;
        lastLoginAt: any;
      } = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        preferences: {
          defaultModel: 'anthropic',
          autoSaveInterval: 30,
          theme: 'auto',
        },
      };

      await setDoc(userRef, userProfile);
    } else {
      // Existing user - update last login
      await setDoc(
        userRef,
        { lastLoginAt: serverTimestamp() },
        { merge: true }
      );
    }

    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

// Sign Out
export async function signOut() {
  try {
    await firebaseSignOut(getFirebaseAuth());
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Custom hook to get current user
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      getFirebaseAuth(),
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { user, loading, error };
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(getFirebaseDb(), COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      } as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}
