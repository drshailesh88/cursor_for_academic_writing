/**
 * Infrastructure Test
 *
 * Verifies that the testing infrastructure is properly configured.
 * This test should pass if everything is set up correctly.
 */

import { describe, test, expect, vi } from 'vitest';
import { mockFirestore, mockAuth, resetFirebaseMocks } from '../mocks/firebase';
import { createMockDocument, createMockReference, createMockUser } from '../mocks/test-data';

describe('Test Infrastructure', () => {
  describe('Basic Vitest functionality', () => {
    test('can run a basic test', () => {
      expect(1 + 1).toBe(2);
    });

    test('can use vi.fn() for mocking', () => {
      const mockFn = vi.fn();
      mockFn('hello');
      expect(mockFn).toHaveBeenCalledWith('hello');
    });

    test('can use async/await', async () => {
      const result = await Promise.resolve('async works');
      expect(result).toBe('async works');
    });
  });

  describe('Testing Library DOM matchers', () => {
    test('toBeInTheDocument matcher works', () => {
      document.body.innerHTML = '<div id="test">Hello</div>';
      const element = document.getElementById('test');
      expect(element).toBeInTheDocument();
    });

    test('toHaveTextContent matcher works', () => {
      document.body.innerHTML = '<div id="test">Hello World</div>';
      const element = document.getElementById('test');
      expect(element).toHaveTextContent('Hello World');
    });
  });

  describe('Firebase Mock', () => {
    beforeEach(() => {
      resetFirebaseMocks();
    });

    test('mockFirestore can store and retrieve data', async () => {
      const docRef = mockFirestore.doc('documents/test-doc');
      await docRef.set({ title: 'Test', content: 'Hello' });

      const snapshot = await docRef.get();
      expect(snapshot.exists()).toBe(true);
      expect(snapshot.data()?.title).toBe('Test');
    });

    test('mockAuth can sign in and out', async () => {
      expect(mockAuth.currentUser).toBeNull();

      const { user } = await mockAuth.signInWithPopup();
      expect(user).toBeDefined();
      expect(mockAuth.currentUser).not.toBeNull();

      await mockAuth.signOut();
      expect(mockAuth.currentUser).toBeNull();
    });

    test('mockFirestore queries work', async () => {
      await mockFirestore.doc('documents/doc1').set({ userId: 'user1', title: 'Doc 1' });
      await mockFirestore.doc('documents/doc2').set({ userId: 'user1', title: 'Doc 2' });
      await mockFirestore.doc('documents/doc3').set({ userId: 'user2', title: 'Doc 3' });

      const query = mockFirestore.collection('documents').where('userId', '==', 'user1');
      const snapshot = await query.get();

      expect(snapshot.size).toBe(2);
    });
  });

  describe('Test Data Generators', () => {
    test('createMockUser generates valid user', () => {
      const user = createMockUser();
      expect(user.uid).toBeDefined();
      expect(user.email).toContain('@');
      expect(user.displayName).toBeDefined();
    });

    test('createMockDocument generates valid document', () => {
      const doc = createMockDocument();
      expect(doc.id).toBeDefined();
      expect(doc.userId).toBeDefined();
      expect(doc.title).toBeDefined();
      expect(doc.content).toBeDefined();
      expect(doc.wordCount).toBeGreaterThanOrEqual(0);
      expect(doc.discipline).toBeDefined();
    });

    test('createMockReference generates valid reference', () => {
      const ref = createMockReference();
      expect(ref.id).toBeDefined();
      expect(ref.type).toBe('article-journal');
      expect(ref.title).toBeDefined();
      expect(ref.author).toBeDefined();
      expect(ref.author.length).toBeGreaterThan(0);
    });

    test('can override generated data', () => {
      const doc = createMockDocument({ title: 'Custom Title' });
      expect(doc.title).toBe('Custom Title');
    });
  });

  describe('Custom Matchers', () => {
    test('toBeWithinRange works correctly', () => {
      expect(50).toBeWithinRange(0, 100);
      expect(0).toBeWithinRange(0, 100);
      expect(100).toBeWithinRange(0, 100);
    });

    test('toBeValidCitation works for APA', () => {
      expect('(Smith, 2024)').toBeValidCitation('apa');
      expect('(Smith et al., 2024)').toBeValidCitation('apa');
    });

    test('toBeValidCitation works for Vancouver', () => {
      expect('[1]').toBeValidCitation('vancouver');
      expect('[42]').toBeValidCitation('vancouver');
    });
  });

  describe('Window mocks', () => {
    test('matchMedia is mocked', () => {
      const mq = window.matchMedia('(min-width: 768px)');
      expect(mq.matches).toBe(false);
      expect(mq.media).toBe('(min-width: 768px)');
    });

    test('ResizeObserver is mocked', () => {
      const observer = new ResizeObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });

    test('IntersectionObserver is mocked', () => {
      const observer = new IntersectionObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });

    test('clipboard is mocked', async () => {
      await navigator.clipboard.writeText('test');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
    });

    test('URL.createObjectURL is mocked', () => {
      const blob = new Blob(['test']);
      const url = URL.createObjectURL(blob);
      expect(url).toBe('blob:mock-url');
    });
  });
});
