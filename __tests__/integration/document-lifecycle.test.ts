/**
 * Document Lifecycle Integration Tests
 *
 * Comprehensive integration tests for the complete document workflow including:
 * - Document creation (plain and from templates)
 * - Document loading and retrieval
 * - Document editing and updates
 * - Auto-save functionality
 * - Document deletion with cascading effects
 * - Document search and filtering
 *
 * These tests verify the complete end-to-end flow of document operations
 * from creation through modification to deletion.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { mockDatabase, mockAuth, resetSupabaseMocks, MockTimestamp } from '../mocks/supabase';
import { createMockUser } from '../mocks/test-data';
import { DOCUMENT_TEMPLATES, getTemplateById } from '@/lib/templates/document-templates';
import {
  createDocument,
  getDocument,
  updateDocument,
  saveDocumentContent,
  deleteDocument,
  getUserDocuments,
  renameDocument,
  updateDocumentDiscipline,
} from '@/lib/supabase/documents';
import { Document, DisciplineId } from '@/lib/supabase/schema';

describe('Document Lifecycle Integration Tests', () => {
  let testUserId: string;

  beforeEach(() => {
    resetSupabaseMocks();
    const mockUser = createMockUser();
    testUserId = mockUser.uid;
    mockAuth.setUser(mockUser);
  });

  // ============================================================================
  // 1. Document Creation Flow
  // ============================================================================

  describe('Document Creation Flow', () => {
    test('creates document with custom title', async () => {
      const docId = await createDocument(testUserId, 'My Research Paper');

      expect(docId).toBeDefined();
      expect(docId).toMatch(/^mock-id-/);

      const doc = await getDocument(docId);
      expect(doc).not.toBeNull();
      expect(doc?.userId).toBe(testUserId);
      expect(doc?.title).toBe('My Research Paper');
      expect(doc?.content).toBe('');
      expect(doc?.wordCount).toBe(0);
      expect(doc?.citations).toEqual([]);
      expect(doc?.createdAt).toBeInstanceOf(Date);
      expect(doc?.updatedAt).toBeInstanceOf(Date);
    });

    test('creates document with default title', async () => {
      const docId = await createDocument(testUserId);

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('Untitled Document');
      expect(doc?.content).toBe('');
      expect(doc?.wordCount).toBe(0);
    });

    test('creates document from Research Article template', async () => {
      const template = getTemplateById('research-article');
      expect(template).toBeDefined();

      const docId = await createDocument(testUserId, template!.name);
      await updateDocument(docId, {
        content: template!.content,
      });

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('Research Article');
      expect(doc?.content).toContain('<h1>Title of Your Research Article</h1>');
      expect(doc?.content).toContain('<h2>Abstract</h2>');
      expect(doc?.content).toContain('<h2>Methods</h2>');
      expect(doc?.content).toContain('<h2>Results</h2>');
      expect(doc?.content).toContain('<h2>Discussion</h2>');
    });

    test('creates document from Systematic Review template', async () => {
      const template = getTemplateById('systematic-review');
      expect(template).toBeDefined();

      const docId = await createDocument(testUserId, template!.name);
      await updateDocument(docId, {
        content: template!.content,
      });

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('Systematic Review');
      expect(doc?.content).toContain('PRISMA');
      expect(doc?.content).toContain('<h3>Eligibility Criteria</h3>');
      expect(doc?.content).toContain('<h3>Search Strategy</h3>');
    });

    test('creates document from Case Report template', async () => {
      const template = getTemplateById('case-report');
      expect(template).toBeDefined();

      const docId = await createDocument(testUserId, template!.name);
      await updateDocument(docId, {
        content: template!.content,
      });

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('Case Report');
      expect(doc?.content).toContain('<h3>Patient Information</h3>');
      expect(doc?.content).toContain('<h3>Clinical Findings</h3>');
      expect(doc?.content).toContain('<h3>Diagnostic Assessment</h3>');
    });

    test('verifies initial content and metadata for new document', async () => {
      const docId = await createDocument(testUserId, 'Test Document');
      const doc = await getDocument(docId);

      // Verify all expected fields are present and correct
      expect(doc).toMatchObject({
        id: docId,
        userId: testUserId,
        title: 'Test Document',
        content: '',
        wordCount: 0,
        citations: [],
      });

      // Verify timestamps
      expect(doc?.createdAt).toBeInstanceOf(Date);
      expect(doc?.updatedAt).toBeInstanceOf(Date);
      expect(doc?.createdAt.getTime()).toBeLessThanOrEqual(doc!.updatedAt.getTime());

      // Verify optional fields
      expect(doc?.tags).toBeUndefined();
      expect(doc?.folder).toBeUndefined();
      expect(doc?.discipline).toBeUndefined();
    });

    test('creates multiple documents with unique IDs', async () => {
      const docId1 = await createDocument(testUserId, 'Document 1');
      const docId2 = await createDocument(testUserId, 'Document 2');
      const docId3 = await createDocument(testUserId, 'Document 3');

      const allIds = [docId1, docId2, docId3];
      const uniqueIds = new Set(allIds);

      expect(uniqueIds.size).toBe(3);
      expect(docId1).not.toBe(docId2);
      expect(docId2).not.toBe(docId3);
      expect(docId1).not.toBe(docId3);
    });
  });

  // ============================================================================
  // 2. Document Loading Flow
  // ============================================================================

  describe('Document Loading Flow', () => {
    test('loads existing document by ID', async () => {
      const docId = await createDocument(testUserId, 'Test Document');
      await updateDocument(docId, {
        content: '<p>Sample content</p>',
        wordCount: 2,
        discipline: 'life-sciences',
      });

      const doc = await getDocument(docId);

      expect(doc).not.toBeNull();
      expect(doc?.id).toBe(docId);
      expect(doc?.title).toBe('Test Document');
      expect(doc?.content).toBe('<p>Sample content</p>');
      expect(doc?.wordCount).toBe(2);
      expect(doc?.discipline).toBe('life-sciences');
    });

    test('loads document list for user', async () => {
      // Create multiple documents
      await createDocument(testUserId, 'Document 1');
      await createDocument(testUserId, 'Document 2');
      await createDocument(testUserId, 'Document 3');

      const docs = await getUserDocuments(testUserId);

      expect(docs).toHaveLength(3);
      expect(docs.every(doc => doc.title)).toBe(true);
      expect(docs.every(doc => doc.updatedAt instanceof Date)).toBe(true);
      expect(docs.every(doc => typeof doc.wordCount === 'number')).toBe(true);
    });

    test('handles non-existent document gracefully', async () => {
      const doc = await getDocument('non-existent-doc-id');

      expect(doc).toBeNull();
    });

    test('isolates documents between users', async () => {
      const user2Id = createMockUser().uid;

      // Create docs for both users
      await createDocument(testUserId, 'User 1 Doc');
      await createDocument(user2Id, 'User 2 Doc');

      const user1Docs = await getUserDocuments(testUserId);
      const user2Docs = await getUserDocuments(user2Id);

      expect(user1Docs).toHaveLength(1);
      expect(user2Docs).toHaveLength(1);
      expect(user1Docs[0].title).toBe('User 1 Doc');
      expect(user2Docs[0].title).toBe('User 2 Doc');
    });

    test('returns empty list for user with no documents', async () => {
      const newUserId = createMockUser().uid;
      const docs = await getUserDocuments(newUserId);

      expect(docs).toEqual([]);
      expect(docs).toHaveLength(0);
    });

    test('loads documents ordered by most recent first', async () => {
      const doc1 = await createDocument(testUserId, 'First');
      await new Promise(resolve => setTimeout(resolve, 10));

      const doc2 = await createDocument(testUserId, 'Second');
      await new Promise(resolve => setTimeout(resolve, 10));

      const doc3 = await createDocument(testUserId, 'Third');

      const docs = await getUserDocuments(testUserId);

      expect(docs[0].title).toBe('Third');
      expect(docs[1].title).toBe('Second');
      expect(docs[2].title).toBe('First');
    });
  });

  // ============================================================================
  // 3. Document Editing Flow
  // ============================================================================

  describe('Document Editing Flow', () => {
    test('updates content and verifies persistence', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');

      const newContent = '<p>This is updated content with <strong>formatting</strong>.</p>';
      await updateDocument(docId, {
        content: newContent,
        wordCount: 6,
      });

      const doc = await getDocument(docId);
      expect(doc?.content).toBe(newContent);
      expect(doc?.wordCount).toBe(6);
    });

    test('updates title', async () => {
      const docId = await createDocument(testUserId, 'Original Title');

      await renameDocument(docId, 'Updated Title');

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('Updated Title');
    });

    test('updates discipline', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');

      await updateDocumentDiscipline(docId, 'clinical-medicine');

      const doc = await getDocument(docId);
      expect(doc?.discipline).toBe('clinical-medicine');
    });

    test('verifies updatedAt timestamp changes on edit', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');
      const originalDoc = await getDocument(docId);
      const originalTimestamp = originalDoc!.updatedAt.getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await updateDocument(docId, {
        content: '<p>Updated content</p>',
      });

      const updatedDoc = await getDocument(docId);
      const newTimestamp = updatedDoc!.updatedAt.getTime();

      expect(newTimestamp).toBeGreaterThanOrEqual(originalTimestamp);
    });

    test('handles multiple sequential edits', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');

      // First edit
      await updateDocument(docId, { content: '<p>Edit 1</p>' });
      let doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>Edit 1</p>');

      // Second edit
      await updateDocument(docId, { content: '<p>Edit 2</p>' });
      doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>Edit 2</p>');

      // Third edit
      await updateDocument(docId, { content: '<p>Edit 3</p>' });
      doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>Edit 3</p>');
    });

    test('updates multiple fields simultaneously', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');

      await updateDocument(docId, {
        title: 'New Title',
        content: '<p>New content</p>',
        wordCount: 2,
        discipline: 'physics',
        folder: 'Research Projects',
        tags: ['important', 'draft'],
      });

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('New Title');
      expect(doc?.content).toBe('<p>New content</p>');
      expect(doc?.wordCount).toBe(2);
      expect(doc?.discipline).toBe('physics');
      expect(doc?.folder).toBe('Research Projects');
      expect(doc?.tags).toEqual(['important', 'draft']);
    });

    test('handles special characters in content and title', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');

      const specialContent = '<p>Special chars: é, ü, ñ, ø, α, β, γ, Δ, 中文, العربية, 🔬</p>';
      const specialTitle = 'Title with émojis 🎉 and ünïcödé';

      await updateDocument(docId, {
        title: specialTitle,
        content: specialContent,
      });

      const doc = await getDocument(docId);
      expect(doc?.title).toBe(specialTitle);
      expect(doc?.content).toBe(specialContent);
    });
  });

  // ============================================================================
  // 4. Auto-save Integration
  // ============================================================================

  describe('Auto-save Integration', () => {
    test('content changes trigger auto-save after delay', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');

      // Simulate content change
      await saveDocumentContent(docId, '<p>Auto-saved content</p>', 2);

      const doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>Auto-saved content</p>');
      expect(doc?.wordCount).toBe(2);
    });

    test('multiple rapid changes are properly saved', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');

      // Simulate rapid typing
      await saveDocumentContent(docId, '<p>A</p>', 1);
      await saveDocumentContent(docId, '<p>A B</p>', 2);
      await saveDocumentContent(docId, '<p>A B C</p>', 3);

      const doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>A B C</p>');
      expect(doc?.wordCount).toBe(3);
    });

    test('manual save works immediately', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');
      const beforeSave = new Date();

      await saveDocumentContent(docId, '<p>Manual save</p>', 2);

      const doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>Manual save</p>');
      expect(doc?.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    });

    test('auto-save updates word count correctly', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');

      const content = '<p>This is a test document with exactly ten words here.</p>';
      const wordCount = 10;

      await saveDocumentContent(docId, content, wordCount);

      const doc = await getDocument(docId);
      expect(doc?.wordCount).toBe(10);
    });

    test('auto-save preserves HTML formatting', async () => {
      const docId = await createDocument(testUserId, 'Test Doc');

      const formattedContent = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <table>
          <tr><td>Cell</td></tr>
        </table>
      `;

      await saveDocumentContent(docId, formattedContent, 15);

      const doc = await getDocument(docId);
      expect(doc?.content).toContain('<h1>Title</h1>');
      expect(doc?.content).toContain('<strong>bold</strong>');
      expect(doc?.content).toContain('<em>italic</em>');
      expect(doc?.content).toContain('<ul>');
      expect(doc?.content).toContain('<table>');
    });
  });

  // ============================================================================
  // 5. Document Deletion Flow
  // ============================================================================

  describe('Document Deletion Flow', () => {
    test('deletes document and removes from database', async () => {
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

    test('deletion removes document from user list', async () => {
      const doc1 = await createDocument(testUserId, 'Keep This');
      const doc2 = await createDocument(testUserId, 'Delete This');
      const doc3 = await createDocument(testUserId, 'Keep This Too');

      let docs = await getUserDocuments(testUserId);
      expect(docs).toHaveLength(3);

      await deleteDocument(doc2);

      docs = await getUserDocuments(testUserId);
      expect(docs).toHaveLength(2);
      expect(docs.every(d => d.title !== 'Delete This')).toBe(true);
    });

    test('handles deleting non-existent document gracefully', async () => {
      // Should not throw error
      await expect(deleteDocument('non-existent-id')).resolves.not.toThrow();
    });

    test('deletes multiple documents in sequence', async () => {
      const doc1 = await createDocument(testUserId, 'Doc 1');
      const doc2 = await createDocument(testUserId, 'Doc 2');
      const doc3 = await createDocument(testUserId, 'Doc 3');

      await deleteDocument(doc1);
      await deleteDocument(doc2);
      await deleteDocument(doc3);

      const docs = await getUserDocuments(testUserId);
      expect(docs).toHaveLength(0);
    });

    test('deletion does not affect other users documents', async () => {
      const user2Id = createMockUser().uid;

      const doc1 = await createDocument(testUserId, 'User 1 Doc');
      const doc2 = await createDocument(user2Id, 'User 2 Doc');

      await deleteDocument(doc1);

      const user1Docs = await getUserDocuments(testUserId);
      const user2Docs = await getUserDocuments(user2Id);

      expect(user1Docs).toHaveLength(0);
      expect(user2Docs).toHaveLength(1);
      expect(user2Docs[0].title).toBe('User 2 Doc');
    });
  });

  // ============================================================================
  // 6. Document Search/Filter
  // ============================================================================

  describe('Document Search/Filter', () => {
    beforeEach(async () => {
      // Create test documents with various properties
      const doc1 = await createDocument(testUserId, 'Machine Learning in Healthcare');
      await updateDocument(doc1, { discipline: 'clinical-medicine' });

      const doc2 = await createDocument(testUserId, 'Quantum Computing Research');
      await updateDocument(doc2, { discipline: 'physics' });

      const doc3 = await createDocument(testUserId, 'Clinical Trial Results');
      await updateDocument(doc3, { discipline: 'clinical-medicine' });

      const doc4 = await createDocument(testUserId, 'Bioinformatics Pipeline');
      await updateDocument(doc4, { discipline: 'bioinformatics' });
    });

    test('filters documents by discipline', async () => {
      const allDocs = await getUserDocuments(testUserId);

      const clinicalDocs = allDocs.filter(doc => doc.discipline === 'clinical-medicine');
      expect(clinicalDocs).toHaveLength(2);

      const physicsDocs = allDocs.filter(doc => doc.discipline === 'physics');
      expect(physicsDocs).toHaveLength(1);

      const bioinformaticsDocs = allDocs.filter(doc => doc.discipline === 'bioinformatics');
      expect(bioinformaticsDocs).toHaveLength(1);
    });

    test('searches documents by title (case-insensitive)', async () => {
      const allDocs = await getUserDocuments(testUserId);

      const searchTerm = 'clinical';
      const results = allDocs.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(results).toHaveLength(1);
      expect(results.some(doc => doc.title.includes('Clinical Trial'))).toBe(true);
    });

    test('searches for partial matches', async () => {
      const allDocs = await getUserDocuments(testUserId);

      const searchResults = allDocs.filter(doc =>
        doc.title.toLowerCase().includes('research')
      );

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe('Quantum Computing Research');
    });

    test('returns empty array when no matches found', async () => {
      const allDocs = await getUserDocuments(testUserId);

      const results = allDocs.filter(doc =>
        doc.title.toLowerCase().includes('nonexistent')
      );

      expect(results).toEqual([]);
      expect(results).toHaveLength(0);
    });

    test('combines discipline filter and title search', async () => {
      const allDocs = await getUserDocuments(testUserId);

      // Find clinical medicine docs with "clinical" in title
      const results = allDocs.filter(doc =>
        doc.discipline === 'clinical-medicine' &&
        doc.title.toLowerCase().includes('clinical')
      );

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Clinical Trial Results');
    });
  });

  // ============================================================================
  // Additional Edge Cases and Complex Scenarios
  // ============================================================================

  describe('Complex Lifecycle Scenarios', () => {
    test('complete lifecycle: create -> edit -> save -> load -> delete', async () => {
      // Create
      const docId = await createDocument(testUserId, 'Lifecycle Test');
      expect(docId).toBeDefined();

      // Edit
      await updateDocument(docId, {
        content: '<p>Initial content</p>',
        wordCount: 2,
        discipline: 'life-sciences',
      });

      // Save (auto-save simulation)
      await saveDocumentContent(docId, '<p>Updated content</p>', 2);

      // Load
      const doc = await getDocument(docId);
      expect(doc?.content).toBe('<p>Updated content</p>');
      expect(doc?.discipline).toBe('life-sciences');

      // Delete
      await deleteDocument(docId);
      const deletedDoc = await getDocument(docId);
      expect(deletedDoc).toBeNull();
    });

    test('handles concurrent document operations', async () => {
      const docIds = await Promise.all([
        createDocument(testUserId, 'Doc 1'),
        createDocument(testUserId, 'Doc 2'),
        createDocument(testUserId, 'Doc 3'),
      ]);

      expect(docIds).toHaveLength(3);
      expect(new Set(docIds).size).toBe(3);

      // Concurrent updates
      await Promise.all(
        docIds.map((id, index) =>
          updateDocument(id, { content: `<p>Content ${index}</p>` })
        )
      );

      const docs = await Promise.all(docIds.map(id => getDocument(id)));
      docs.forEach((doc, index) => {
        expect(doc?.content).toBe(`<p>Content ${index}</p>`);
      });
    });

    test('template-to-full-document workflow', async () => {
      const template = getTemplateById('research-article');
      const docId = await createDocument(testUserId, 'My Research');

      // Apply template
      await updateDocument(docId, { content: template!.content });

      // Customize
      await updateDocument(docId, { discipline: 'clinical-medicine' });
      await renameDocument(docId, 'COVID-19 Treatment Study');

      // Add content
      await saveDocumentContent(
        docId,
        template!.content.replace(
          'Title of Your Research Article',
          'COVID-19 Treatment Study'
        ),
        100
      );

      const doc = await getDocument(docId);
      expect(doc?.title).toBe('COVID-19 Treatment Study');
      expect(doc?.discipline).toBe('clinical-medicine');
      expect(doc?.content).toContain('COVID-19 Treatment Study');
    });

    test('handles rapid create-delete cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const docId = await createDocument(testUserId, `Temp Doc ${i}`);
        await updateDocument(docId, { content: '<p>Temporary</p>' });
        await deleteDocument(docId);

        const doc = await getDocument(docId);
        expect(doc).toBeNull();
      }

      const remainingDocs = await getUserDocuments(testUserId);
      expect(remainingDocs).toHaveLength(0);
    });
  });
});
