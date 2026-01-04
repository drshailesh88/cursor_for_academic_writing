/**
 * Firebase Document CRUD Tests
 *
 * Tests document operations including:
 * - Document Creation
 * - Document Retrieval
 * - Document Updates
 * - Document Deletion
 * - User Document Queries
 * - Edge Cases
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { mockFirestore, resetFirebaseMocks, MockTimestamp } from '../../mocks/firebase';
import { createMockDocument, createMockUser, edgeCases } from '../../mocks/test-data';

// Import document functions
import {
  createDocument,
  getDocument,
  updateDocument,
  saveDocumentContent,
  deleteDocument,
  getUserDocuments,
  getRecentDocuments,
  renameDocument,
  updateDocumentDiscipline,
} from '@/lib/firebase/documents';

describe('Firebase Document CRUD', () => {
  let testUserId: string;

  beforeEach(() => {
    resetFirebaseMocks();
    testUserId = createMockUser().uid;
  });

  describe('createDocument', () => {
    test('creates document with required fields', async () => {
      const docId = await createDocument(testUserId, 'Test Document');

      expect(docId).toBeDefined();
      expect(docId).toContain('mock-id-');

      // Verify document exists in Firestore
      const doc = await getDocument(docId);
      expect(doc).not.toBeNull();
      expect(doc?.userId).toBe(testUserId);
      expect(doc?.title).toBe('Test Document');
      expect(doc?.content).toBe('');
      expect(doc?.wordCount).toBe(0);
      expect(doc?.citations).toEqual([]);
      expect(doc?.createdAt).toBeInstanceOf(Date);
      expect(doc?.updatedAt).toBeInstanceOf(Date);
    });

    test('creates document with default title when not provided', async () => {
      const docId = await createDocument(testUserId);

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('Untitled Document');
    });

    test('creates multiple documents with unique IDs', async () => {
      const docId1 = await createDocument(testUserId, 'Doc 1');
      const docId2 = await createDocument(testUserId, 'Doc 2');
      const docId3 = await createDocument(testUserId, 'Doc 3');

      expect(docId1).not.toBe(docId2);
      expect(docId2).not.toBe(docId3);
      expect(docId1).not.toBe(docId3);
    });

    test('handles special characters in title', async () => {
      const specialTitle = 'Test: "Quotes" & <HTML> © ™ ® emoji 🎉 🔬';
      const docId = await createDocument(testUserId, specialTitle);

      const doc = await getDocument(docId);
      expect(doc?.title).toBe(specialTitle);
    });

    test('handles very long titles', async () => {
      const longTitle = 'A'.repeat(1000);
      const docId = await createDocument(testUserId, longTitle);

      const doc = await getDocument(docId);
      expect(doc?.title).toBe(longTitle);
      expect(doc?.title.length).toBe(1000);
    });

    test('throws error on Firestore failure', async () => {
      // Mock Firestore error
      const setSpy = vi.spyOn(mockFirestore.collection('documents').doc(), 'set')
        .mockRejectedValueOnce(new Error('Firestore error'));

      await expect(createDocument(testUserId, 'Test')).rejects.toThrow();

      setSpy.mockRestore();
    });
  });

  describe('getDocument', () => {
    test('loads document by ID', async () => {
      const docId = await createDocument(testUserId, 'Test Document');
      const doc = await getDocument(docId);

      expect(doc).not.toBeNull();
      expect(doc?.id).toBe(docId);
      expect(doc?.title).toBe('Test Document');
    });

    test('returns null for non-existent document', async () => {
      const doc = await getDocument('non-existent-id');
      expect(doc).toBeNull();
    });

    test('handles Firestore errors gracefully', async () => {
      const getSpy = vi.spyOn(mockFirestore.doc('documents/test'), 'get')
        .mockRejectedValueOnce(new Error('Firestore error'));

      const doc = await getDocument('test');
      expect(doc).toBeNull();

      getSpy.mockRestore();
    });

    test('converts timestamps to Date objects', async () => {
      const docId = await createDocument(testUserId, 'Test');
      const doc = await getDocument(docId);

      expect(doc?.createdAt).toBeInstanceOf(Date);
      expect(doc?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateDocument', () => {
    test('updates document content', async () => {
      const docId = await createDocument(testUserId, 'Test Document');

      await updateDocument(docId, {
        content: '<p>Updated content</p>',
        wordCount: 2,
      });

      const doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>Updated content</p>');
      expect(doc?.wordCount).toBe(2);
    });

    test('updates document title', async () => {
      const docId = await createDocument(testUserId, 'Original Title');

      await updateDocument(docId, {
        title: 'Updated Title',
      });

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('Updated Title');
    });

    test('updates updatedAt timestamp', async () => {
      const docId = await createDocument(testUserId, 'Test');
      const originalDoc = await getDocument(docId);
      const originalUpdatedAt = originalDoc?.updatedAt.getTime();

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await updateDocument(docId, { title: 'Updated' });

      const updatedDoc = await getDocument(docId);
      const newUpdatedAt = updatedDoc?.updatedAt.getTime();

      expect(newUpdatedAt).toBeGreaterThanOrEqual(originalUpdatedAt!);
    });

    test('throws error for non-existent document', async () => {
      await expect(
        updateDocument('non-existent', { title: 'Test' })
      ).rejects.toThrow();
    });

    test('handles special characters in content', async () => {
      const docId = await createDocument(testUserId, 'Test');
      const specialContent = '<p>Special: é, ü, ñ, ø, α, β, γ, Δ, 中文, العربية</p>';

      await updateDocument(docId, { content: specialContent });

      const doc = await getDocument(docId);
      expect(doc?.content).toBe(specialContent);
    });

    test('handles emoji and unicode in content', async () => {
      const docId = await createDocument(testUserId, 'Test');
      const emojiContent = '<p>Science 🔬 Research 📚 Data 📊 Success ✅</p>';

      await updateDocument(docId, { content: emojiContent });

      const doc = await getDocument(docId);
      expect(doc?.content).toBe(emojiContent);
    });

    test('handles very large documents', async () => {
      const docId = await createDocument(testUserId, 'Large Doc');
      const largeContent = '<p>' + 'Lorem ipsum dolor sit amet. '.repeat(5000) + '</p>';

      await updateDocument(docId, {
        content: largeContent,
        wordCount: 25000,
      });

      const doc = await getDocument(docId);
      expect(doc?.content.length).toBeGreaterThan(100000);
      expect(doc?.wordCount).toBe(25000);
    });
  });

  describe('saveDocumentContent', () => {
    test('saves content and word count', async () => {
      const docId = await createDocument(testUserId, 'Test');

      await saveDocumentContent(docId, '<p>New content here</p>', 3);

      const doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>New content here</p>');
      expect(doc?.wordCount).toBe(3);
    });

    test('updates updatedAt on save', async () => {
      const docId = await createDocument(testUserId, 'Test');
      const originalDoc = await getDocument(docId);
      const originalTime = originalDoc?.updatedAt.getTime();

      await new Promise(resolve => setTimeout(resolve, 10));

      await saveDocumentContent(docId, '<p>Updated</p>', 1);

      const updatedDoc = await getDocument(docId);
      expect(updatedDoc?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalTime!);
    });

    test('throws error for non-existent document', async () => {
      await expect(
        saveDocumentContent('non-existent', 'content', 1)
      ).rejects.toThrow();
    });
  });

  describe('deleteDocument', () => {
    test('deletes document by ID', async () => {
      const docId = await createDocument(testUserId, 'To Delete');

      // Verify it exists
      let doc = await getDocument(docId);
      expect(doc).not.toBeNull();

      // Delete it
      await deleteDocument(docId);

      // Verify it's gone
      doc = await getDocument(docId);
      expect(doc).toBeNull();
    });

    test('handles deleting non-existent document', async () => {
      // Should not throw - idempotent operation
      await expect(deleteDocument('non-existent')).resolves.not.toThrow();
    });

    test('throws error on Firestore failure', async () => {
      const deleteSpy = vi.spyOn(mockFirestore.doc('documents/test'), 'delete')
        .mockRejectedValueOnce(new Error('Delete failed'));

      await expect(deleteDocument('test')).rejects.toThrow();

      deleteSpy.mockRestore();
    });
  });

  describe('getUserDocuments', () => {
    test('loads all documents for user', async () => {
      const user1 = createMockUser().uid;
      const user2 = createMockUser().uid;

      // Create docs for user 1
      await createDocument(user1, 'User 1 Doc 1');
      await createDocument(user1, 'User 1 Doc 2');
      await createDocument(user1, 'User 1 Doc 3');

      // Create docs for user 2
      await createDocument(user2, 'User 2 Doc 1');

      const user1Docs = await getUserDocuments(user1);
      const user2Docs = await getUserDocuments(user2);

      expect(user1Docs.length).toBe(3);
      expect(user2Docs.length).toBe(1);

      // Verify user 1 docs
      user1Docs.forEach(doc => {
        expect(doc.title).toContain('User 1');
      });

      // Verify user 2 docs
      expect(user2Docs[0].title).toContain('User 2');
    });

    test('does not load other users documents', async () => {
      const user1 = createMockUser().uid;
      const user2 = createMockUser().uid;

      await createDocument(user1, 'User 1 Doc');
      await createDocument(user2, 'User 2 Doc');

      const user1Docs = await getUserDocuments(user1);

      expect(user1Docs.length).toBe(1);
      expect(user1Docs[0].title).toBe('User 1 Doc');

      // Should not contain user 2's doc
      const hasUser2Doc = user1Docs.some(doc => doc.title === 'User 2 Doc');
      expect(hasUser2Doc).toBe(false);
    });

    test('returns documents ordered by updatedAt desc', async () => {
      const userId = createMockUser().uid;

      const docId1 = await createDocument(userId, 'First');
      await new Promise(resolve => setTimeout(resolve, 10));

      const docId2 = await createDocument(userId, 'Second');
      await new Promise(resolve => setTimeout(resolve, 10));

      const docId3 = await createDocument(userId, 'Third');

      const docs = await getUserDocuments(userId);

      expect(docs.length).toBe(3);
      // Most recent first
      expect(docs[0].title).toBe('Third');
      expect(docs[1].title).toBe('Second');
      expect(docs[2].title).toBe('First');
    });

    test('respects limit parameter', async () => {
      const userId = createMockUser().uid;

      // Create 10 documents
      for (let i = 0; i < 10; i++) {
        await createDocument(userId, `Doc ${i}`);
      }

      const docs = await getUserDocuments(userId, 5);
      expect(docs.length).toBe(5);
    });

    test('returns empty array for user with no documents', async () => {
      const userId = createMockUser().uid;
      const docs = await getUserDocuments(userId);

      expect(docs).toEqual([]);
    });

    test('handles Firestore query errors gracefully', async () => {
      const getSpy = vi.spyOn(mockFirestore.collection('documents'), 'get')
        .mockRejectedValueOnce(new Error('Query failed'));

      const docs = await getUserDocuments('test-user');
      expect(docs).toEqual([]);

      getSpy.mockRestore();
    });

    test('returns correct metadata fields', async () => {
      const userId = createMockUser().uid;
      const docId = await createDocument(userId, 'Test Doc');

      await updateDocument(docId, {
        wordCount: 100,
        folder: 'Research',
        discipline: 'life-sciences',
      });

      const docs = await getUserDocuments(userId);

      expect(docs.length).toBe(1);
      expect(docs[0]).toHaveProperty('id');
      expect(docs[0]).toHaveProperty('title');
      expect(docs[0]).toHaveProperty('updatedAt');
      expect(docs[0]).toHaveProperty('wordCount');
      expect(docs[0].wordCount).toBe(100);
      expect(docs[0].folder).toBe('Research');
      expect(docs[0].discipline).toBe('life-sciences');
    });
  });

  describe('getRecentDocuments', () => {
    test('returns recent documents with default limit', async () => {
      const userId = createMockUser().uid;

      for (let i = 0; i < 5; i++) {
        await createDocument(userId, `Doc ${i}`);
      }

      const docs = await getRecentDocuments(userId);
      expect(docs.length).toBe(5);
    });

    test('respects custom limit', async () => {
      const userId = createMockUser().uid;

      for (let i = 0; i < 15; i++) {
        await createDocument(userId, `Doc ${i}`);
      }

      const docs = await getRecentDocuments(userId, 3);
      expect(docs.length).toBe(3);
    });
  });

  describe('renameDocument', () => {
    test('renames document successfully', async () => {
      const docId = await createDocument(testUserId, 'Original Name');

      await renameDocument(docId, 'New Name');

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('New Name');
    });

    test('updates updatedAt when renaming', async () => {
      const docId = await createDocument(testUserId, 'Test');
      const originalDoc = await getDocument(docId);
      const originalTime = originalDoc?.updatedAt.getTime();

      await new Promise(resolve => setTimeout(resolve, 10));

      await renameDocument(docId, 'Renamed');

      const updatedDoc = await getDocument(docId);
      expect(updatedDoc?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalTime!);
    });

    test('handles special characters in new title', async () => {
      const docId = await createDocument(testUserId, 'Test');
      const newTitle = 'Special: é, ü, ñ, emoji 🎉';

      await renameDocument(docId, newTitle);

      const doc = await getDocument(docId);
      expect(doc?.title).toBe(newTitle);
    });

    test('throws error for non-existent document', async () => {
      await expect(
        renameDocument('non-existent', 'New Name')
      ).rejects.toThrow();
    });
  });

  describe('updateDocumentDiscipline', () => {
    test('updates discipline successfully', async () => {
      const docId = await createDocument(testUserId, 'Test');

      await updateDocumentDiscipline(docId, 'clinical-medicine');

      const doc = await getDocument(docId);
      expect(doc?.discipline).toBe('clinical-medicine');
    });

    test('can change discipline multiple times', async () => {
      const docId = await createDocument(testUserId, 'Test');

      await updateDocumentDiscipline(docId, 'physics');
      let doc = await getDocument(docId);
      expect(doc?.discipline).toBe('physics');

      await updateDocumentDiscipline(docId, 'chemistry');
      doc = await getDocument(docId);
      expect(doc?.discipline).toBe('chemistry');
    });

    test('throws error for non-existent document', async () => {
      await expect(
        updateDocumentDiscipline('non-existent', 'life-sciences')
      ).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty document', async () => {
      const docId = await createDocument(testUserId, '');

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('');
      expect(doc?.content).toBe('');
      expect(doc?.wordCount).toBe(0);
    });

    test('handles document with only whitespace', async () => {
      const docId = await createDocument(testUserId, '   ');

      await updateDocument(docId, {
        content: '<p>   \n\t\r\n   </p>',
      });

      const doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>   \n\t\r\n   </p>');
    });

    test('handles document with malformed HTML', async () => {
      const docId = await createDocument(testUserId, 'Test');
      const malformedHtml = '<p>Unclosed paragraph<div>Nested incorrectly</p></div>';

      await updateDocument(docId, { content: malformedHtml });

      const doc = await getDocument(docId);
      expect(doc?.content).toBe(malformedHtml);
    });

    test('handles concurrent updates to same document', async () => {
      const docId = await createDocument(testUserId, 'Test');

      // Concurrent updates
      await Promise.all([
        updateDocument(docId, { content: '<p>Update 1</p>' }),
        updateDocument(docId, { content: '<p>Update 2</p>' }),
        updateDocument(docId, { content: '<p>Update 3</p>' }),
      ]);

      // Should complete without error
      const doc = await getDocument(docId);
      expect(doc).not.toBeNull();
      // Last write wins in our mock
    });

    test('handles rapid create/delete cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const docId = await createDocument(testUserId, `Doc ${i}`);
        await deleteDocument(docId);

        const doc = await getDocument(docId);
        expect(doc).toBeNull();
      }
    });

    test('handles documents with maximum field lengths', async () => {
      const docId = await createDocument(testUserId, 'Test');

      const veryLongContent = '<p>' + 'word '.repeat(50000) + '</p>';
      await updateDocument(docId, {
        content: veryLongContent,
        wordCount: 50000,
      });

      const doc = await getDocument(docId);
      expect(doc?.wordCount).toBe(50000);
      expect(doc?.content.length).toBeGreaterThan(250000);
    });
  });
});
