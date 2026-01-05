/**
 * Firebase SDK Mocks
 *
 * Mocks the Firebase SDK functions to work with our mock implementations
 */

import { vi } from 'vitest';
import { mockAuth, mockFirestore, MockTimestamp } from './firebase';

// Mock Firebase Auth functions
export const mockSignInWithPopup = vi.fn(async () => {
  return mockAuth.signInWithPopup();
});

export const mockSignOut = vi.fn(async () => {
  return mockAuth.signOut();
});

export const mockOnAuthStateChanged = vi.fn((callback: Function, errorCallback?: Function) => {
  // Mock auth only supports callback, not errorCallback
  return mockAuth.onAuthStateChanged(callback as any);
});

export const mockCreateUserWithEmailAndPassword = vi.fn(async (auth: any, email: string, password: string) => {
  const user = await mockAuth.signInWithPopup();
  return { user: { ...user.user, email } };
});

export const mockSignInWithEmailAndPassword = vi.fn(async (auth: any, email: string, password: string) => {
  const user = await mockAuth.signInWithPopup();
  return { user: { ...user.user, email } };
});

export const mockSendPasswordResetEmail = vi.fn(async () => Promise.resolve());

export const mockUpdateProfile = vi.fn(async () => Promise.resolve());

// Mock Firestore functions
export const mockDoc = vi.fn((pathOrRef: any, ...pathSegments: string[]) => {
  if (typeof pathOrRef === 'string') {
    // Called with just a path
    return mockFirestore.doc(pathOrRef);
  } else {
    // Called with db instance
    const fullPath = pathSegments.join('/');
    return mockFirestore.doc(fullPath);
  }
});

export const mockCollection = vi.fn((pathOrRef: any, ...pathSegments: string[]) => {
  if (typeof pathOrRef === 'string') {
    return mockFirestore.collection(pathOrRef);
  } else {
    const fullPath = pathSegments.join('/');
    return mockFirestore.collection(fullPath);
  }
});

export const mockGetDoc = vi.fn(async (ref: any) => {
  return ref.get();
});

export const mockGetDocs = vi.fn(async (query: any) => {
  return query.get();
});

export const mockSetDoc = vi.fn(async (ref: any, data: any, options?: any) => {
  if (options?.merge) {
    const existing = await ref.get();
    if (existing.exists) {
      return ref.update(data);
    }
  }
  return ref.set(data);
});

export const mockUpdateDoc = vi.fn(async (ref: any, data: any) => {
  return ref.update(data);
});

export const mockDeleteDoc = vi.fn(async (ref: any) => {
  return ref.delete();
});

export const mockQuery = vi.fn((collection: any, ...queryConstraints: any[]) => {
  let query = collection;
  for (const constraint of queryConstraints) {
    if (constraint._type === 'where') {
      query = query.where(constraint._field, constraint._op, constraint._value);
    } else if (constraint._type === 'orderBy') {
      query = query.orderBy(constraint._field, constraint._direction);
    } else if (constraint._type === 'limit') {
      query = query.limit(constraint._limit);
    }
  }
  return query;
});

export const mockWhere = vi.fn((field: string, op: string, value: any) => ({
  _type: 'where',
  _field: field,
  _op: op,
  _value: value,
}));

export const mockOrderBy = vi.fn((field: string, direction: 'asc' | 'desc' = 'asc') => ({
  _type: 'orderBy',
  _field: field,
  _direction: direction,
}));

export const mockLimit = vi.fn((count: number) => ({
  _type: 'limit',
  _limit: count,
}));

export const mockServerTimestamp = vi.fn(() => MockTimestamp.now());

export const mockTimestamp = MockTimestamp;

// Mock Firebase Auth provider
export class MockGoogleAuthProvider {
  providerId = 'google.com';
}

// Setup all mocks
export function setupFirebaseMocks() {
  vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => mockAuth),
    signInWithPopup: mockSignInWithPopup,
    signOut: mockSignOut,
    onAuthStateChanged: mockOnAuthStateChanged,
    GoogleAuthProvider: MockGoogleAuthProvider,
    createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    sendPasswordResetEmail: mockSendPasswordResetEmail,
    updateProfile: mockUpdateProfile,
  }));

  vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => mockFirestore),
    doc: mockDoc,
    collection: mockCollection,
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    setDoc: mockSetDoc,
    updateDoc: mockUpdateDoc,
    deleteDoc: mockDeleteDoc,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    serverTimestamp: mockServerTimestamp,
    Timestamp: mockTimestamp,
  }));

  vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({ name: '[DEFAULT]', options: {} })),
    getApps: vi.fn(() => []),
    getApp: vi.fn(() => ({ name: '[DEFAULT]', options: {} })),
  }));

  vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({})),
  }));
}
