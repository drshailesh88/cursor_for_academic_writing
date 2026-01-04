// Firebase Authentication Hooks and Utilities
'use client';

import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb } from './client';
import { doc, setDoc, getDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
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
        createdAt: FieldValue;
        lastLoginAt: FieldValue;
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

// Helper function to create/update user profile in Firestore
async function createOrUpdateUserProfile(user: User, isNewUser: boolean = false) {
  const userRef = doc(getFirebaseDb(), COLLECTIONS.USERS, user.uid);

  if (isNewUser) {
    const userProfile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & {
      createdAt: FieldValue;
      lastLoginAt: FieldValue;
    } = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName,
      photoURL: user.photoURL,
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
    await setDoc(
      userRef,
      { lastLoginAt: serverTimestamp() },
      { merge: true }
    );
  }
}

// Email/Password Sign Up
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);

    // Update display name
    await updateProfile(result.user, { displayName });

    // Create user profile in Firestore
    await createOrUpdateUserProfile(result.user, true);

    return result.user;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
}

// Email/Password Sign In
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);

    // Update last login in Firestore
    await createOrUpdateUserProfile(result.user, false);

    return result.user;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
}

// Send Password Reset Email
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

// Update User Profile
export async function updateUserProfile(
  displayName?: string,
  photoURL?: string
): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }

    await updateProfile(auth.currentUser, {
      displayName: displayName ?? auth.currentUser.displayName,
      photoURL: photoURL ?? auth.currentUser.photoURL,
    });

    // Update Firestore profile
    const userRef = doc(getFirebaseDb(), COLLECTIONS.USERS, auth.currentUser.uid);
    await setDoc(
      userRef,
      {
        displayName: displayName ?? auth.currentUser.displayName,
        photoURL: photoURL ?? auth.currentUser.photoURL,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Firebase error code to user-friendly message mapping
export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;

    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email already registered';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  return 'An unexpected error occurred';
}
