/**
 * Vitest Global Setup
 *
 * This file runs before all tests and sets up:
 * - Testing Library DOM matchers
 * - Firebase mocks
 * - API mocks (MSW)
 * - Global test utilities
 */

import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll, vi, expect } from 'vitest';
import { server } from './mocks/server';
import { mockAuth, mockFirestore, MockTimestamp } from './mocks/firebase';

// Mock Firebase SDK before any imports
vi.mock('firebase/auth', async () => ({
  getAuth: vi.fn(() => mockAuth),
  signInWithPopup: vi.fn(async (auth: any, provider: any) => mockAuth.signInWithPopup()),
  signOut: vi.fn(async (auth: any) => mockAuth.signOut()),
  onAuthStateChanged: vi.fn((auth: any, callback: Function, errorCallback?: Function) =>
    mockAuth.onAuthStateChanged(callback as any, errorCallback as any)
  ),
  GoogleAuthProvider: class MockGoogleAuthProvider { providerId = 'google.com'; },
  createUserWithEmailAndPassword: vi.fn(async (auth: any, email: string, password: string) => {
    // If there's already a current user (set via mockAuth.setUser), use it
    if (mockAuth.currentUser) {
      return { user: mockAuth.currentUser };
    }
    const result = await mockAuth.signInWithPopup();
    return { user: { ...result.user, email } };
  }),
  signInWithEmailAndPassword: vi.fn(async (auth: any, email: string, password: string) => {
    // If there's already a current user (set via mockAuth.setUser), use it
    if (mockAuth.currentUser) {
      return { user: mockAuth.currentUser };
    }
    const result = await mockAuth.signInWithPopup();
    return { user: { ...result.user, email } };
  }),
  sendPasswordResetEmail: vi.fn(async () => Promise.resolve()),
  updateProfile: vi.fn(async (user: any, updates: any) => {
    // Update the current user with the profile updates
    if (mockAuth.currentUser) {
      Object.assign(mockAuth.currentUser, updates);
    }
    return Promise.resolve();
  }),
}));

vi.mock('firebase/firestore', async () => ({
  getFirestore: vi.fn(() => mockFirestore),
  doc: vi.fn((pathOrRef: any, ...pathSegments: string[]) => {
    if (typeof pathOrRef === 'string') {
      // doc(db, 'collection', 'id') or doc(db, 'collection/id')
      const fullPath = [pathOrRef, ...pathSegments].filter(Boolean).join('/');
      return mockFirestore.doc(fullPath);
    } else if (pathOrRef && typeof pathOrRef.path === 'string') {
      // doc(collectionRef) or doc(collectionRef, 'id')
      if (pathSegments.length > 0) {
        // doc(collectionRef, 'id')
        return mockFirestore.collection(pathOrRef.path).doc(pathSegments[0]);
      } else {
        // doc(collectionRef) - auto-generate ID
        return mockFirestore.collection(pathOrRef.path).doc();
      }
    } else {
      // Fallback
      const fullPath = pathSegments.join('/');
      return mockFirestore.doc(fullPath);
    }
  }),
  collection: vi.fn((pathOrRef: any, ...pathSegments: string[]) => {
    if (typeof pathOrRef === 'string') {
      // collection(db, 'documents') or collection(db, 'documents', 'id', 'subcollection')
      const fullPath = [pathOrRef, ...pathSegments].filter(Boolean).join('/');
      return mockFirestore.collection(fullPath);
    } else if (pathOrRef && typeof pathOrRef.path === 'string') {
      // collection(docRef, 'subcollection')
      const fullPath = [pathOrRef.path, ...pathSegments].filter(Boolean).join('/');
      return mockFirestore.collection(fullPath);
    } else {
      // Fallback: pathOrRef is Firestore instance
      const fullPath = pathSegments.join('/');
      return mockFirestore.collection(fullPath);
    }
  }),
  getDoc: vi.fn(async (ref: any) => ref.get()),
  getDocs: vi.fn(async (query: any) => query.get()),
  setDoc: vi.fn(async (ref: any, data: any, options?: any) => {
    if (options?.merge) {
      const existing = await ref.get();
      if (existing.exists) {
        return ref.update(data);
      }
    }
    return ref.set(data);
  }),
  updateDoc: vi.fn(async (ref: any, data: any) => ref.update(data)),
  deleteDoc: vi.fn(async (ref: any) => ref.delete()),
  query: vi.fn((collection: any, ...queryConstraints: any[]) => {
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
  }),
  where: vi.fn((field: string, op: string, value: any) => ({
    _type: 'where',
    _field: field,
    _op: op,
    _value: value,
  })),
  orderBy: vi.fn((field: string, direction: 'asc' | 'desc' = 'asc') => ({
    _type: 'orderBy',
    _field: field,
    _direction: direction,
  })),
  limit: vi.fn((count: number) => ({
    _type: 'limit',
    _limit: count,
  })),
  onSnapshot: vi.fn((query: any, callback: Function, errorCallback?: Function) => {
    // Call immediately with current data
    query.get().then((snapshot: any) => callback(snapshot));
    // Return unsubscribe function
    return vi.fn();
  }),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(async () => Promise.resolve()),
  })),
  serverTimestamp: vi.fn(() => MockTimestamp.now()),
  Timestamp: MockTimestamp,
  FieldValue: class FieldValue {},
}));

vi.mock('firebase/app', async () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]', options: {} })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: '[DEFAULT]', options: {} })),
}));

vi.mock('firebase/storage', async () => ({
  getStorage: vi.fn(() => ({})),
}));

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (for lazy loading)
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
  root = null;
  rootMargin = '';
  thresholds = [];
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock ResizeObserver (for responsive panels)
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: ResizeObserverCallback) {}
}
window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock URL.createObjectURL (for file exports)
window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
window.URL.revokeObjectURL = vi.fn();

// Extend Vitest matchers with custom matchers
expect.extend({
  // Custom matcher: toBeValidCitation
  toBeValidCitation(received: string, style: string) {
    const patterns: Record<string, RegExp> = {
      apa: /^\(.+, \d{4}[a-z]?\)$/,
      vancouver: /^\[\d+\]$/,
      chicago: /^\(.+ \d{4}\)$/,
    };
    const pattern = patterns[style];
    if (!pattern) {
      return {
        pass: false,
        message: () => `Unknown citation style: ${style}`,
      };
    }
    const pass = pattern.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid ${style} citation`
          : `Expected ${received} to be a valid ${style} citation`,
    };
  },

  // Custom matcher: toBeWithinRange
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be within range ${floor} - ${ceiling}`
          : `Expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },
});

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeValidCitation(style: string): T;
    toBeWithinRange(floor: number, ceiling: number): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidCitation(style: string): unknown;
    toBeWithinRange(floor: number, ceiling: number): unknown;
  }
}

// Global test utilities
export const waitForFirebase = () => new Promise((resolve) => setTimeout(resolve, 100));

export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
};

export const mockDocument = {
  id: 'doc-123',
  userId: 'test-user-123',
  title: 'Test Document',
  content: '<p>Test content</p>',
  wordCount: 2,
  discipline: 'life-sciences',
  createdAt: new Date(),
  updatedAt: new Date(),
};
