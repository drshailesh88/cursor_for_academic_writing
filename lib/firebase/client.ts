// Firebase Client SDK Configuration
// Uses lazy initialization to avoid build-time errors
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization to avoid build-time errors
let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

function initApp(): FirebaseApp {
  if (_app) return _app;

  if (!getApps().length) {
    _app = initializeApp(firebaseConfig);
  } else {
    _app = getApps()[0];
  }
  return _app;
}

// Export getter functions for lazy initialization
export function getFirebaseApp(): FirebaseApp {
  return initApp();
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(initApp());
  }
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) {
    _db = getFirestore(initApp());
  }
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(initApp());
  }
  return _storage;
}

// Legacy exports - only use in client-side code
// For API routes, use the getter functions above
export const app = initApp;
export const auth = getFirebaseAuth;
export const db = getFirebaseDb;
export const storage = getFirebaseStorage;
