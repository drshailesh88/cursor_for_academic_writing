/**
 * Citation Library Tests
 *
 * Tests database CRUD operations for reference management.
 * Covers folders, labels, search, and duplicate detection.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  addReference,
  addReferences,
  getReference,
  updateReference,
  deleteReference,
  deleteReferences,
  getAllReferences,
  searchReferences,
  findDuplicates,
  getReferencesByFolder,
  getReferencesByLabel,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  createLabel,
  getLabels,
  deleteLabel,
  addReferenceToFolder,
  removeReferenceFromFolder,
  addLabelToReference,
  removeLabelFromReference,
  toggleFavorite,
  updateReadStatus,
  getLibraryStats,
} from '@/lib/citations/library';
import { mockDatabase, resetSupabaseMocks } from '@/__tests__/mocks/supabase';
import { createTestReference } from '@/__tests__/mocks/test-data';
import type { Reference } from '@/lib/citations/types';

const TEST_USER_ID = 'test-user-123';

describe('Citation Library - References', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('addReference', () => {
    test('creates reference with all fields', async () => {
      const ref = createTestReference();
      const { id, createdAt, updatedAt, ...refData } = ref;

      const refId = await addReference(TEST_USER_ID, refData);

      expect(refId).toBeDefined();
      expect(typeof refId).toBe('string');

      // Verify it was saved
      const saved = await getReference(TEST_USER_ID, refId);
      expect(saved?.title).toBe(ref.title);
    });

    test('generates cite key if not provided', async () => {
      const ref = createTestReference({ citeKey: undefined });
      const { id, createdAt, updatedAt, ...refData } = ref;

      const refId = await addReference(TEST_USER_ID, refData);
      const saved = await getReference(TEST_USER_ID, refId);

      expect(saved?.citeKey).toBeDefined();
      expect(saved?.citeKey?.length).toBeGreaterThan(0);
    });

    test('preserves cite key if provided', async () => {
      const ref = createTestReference({ citeKey: 'smith2024ml' });
      const { id, createdAt, updatedAt, ...refData } = ref;

      const refId = await addReference(TEST_USER_ID, refData);
      const saved = await getReference(TEST_USER_ID, refId);

      expect(saved?.citeKey).toBe('smith2024ml');
    });

    test('sets createdAt and updatedAt timestamps', async () => {
      const ref = createTestReference();
      const { id, createdAt, updatedAt, ...refData } = ref;

      const refId = await addReference(TEST_USER_ID, refData);
      const saved = await getReference(TEST_USER_ID, refId);

      expect(saved?.createdAt).toBeInstanceOf(Date);
      expect(saved?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('addReferences (batch)', () => {
    test('adds multiple references', async () => {
      const refs = [
        createTestReference({ title: 'Paper 1' }),
        createTestReference({ title: 'Paper 2' }),
        createTestReference({ title: 'Paper 3' }),
      ];

      const refData = refs.map(({ id, createdAt, updatedAt, ...rest }) => rest);
      const ids = await addReferences(TEST_USER_ID, refData);

      expect(ids.length).toBe(3);

      // Verify all were saved
      const all = await getAllReferences(TEST_USER_ID);
      expect(all.length).toBe(3);
    });

    test('generates unique IDs for all references', async () => {
      const refs = [
        createTestReference(),
        createTestReference(),
        createTestReference(),
      ];

      const refData = refs.map(({ id, createdAt, updatedAt, ...rest }) => rest);
      const ids = await addReferences(TEST_USER_ID, refData);

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getReference', () => {
    test('retrieves reference by ID', async () => {
      const ref = createTestReference({ title: 'Test Paper' });
      const { id, createdAt, updatedAt, ...refData } = ref;

      const refId = await addReference(TEST_USER_ID, refData);
      const retrieved = await getReference(TEST_USER_ID, refId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Test Paper');
    });

    test('returns null for non-existent reference', async () => {
      const result = await getReference(TEST_USER_ID, 'non-existent-id');
      expect(result).toBeNull();
    });

    test('returns null for reference owned by different user', async () => {
      const ref = createTestReference();
      const { id, createdAt, updatedAt, ...refData } = ref;

      const refId = await addReference(TEST_USER_ID, refData);

      // Try to access with different user ID
      const result = await getReference('different-user', refId);
      expect(result).toBeNull();
    });
  });

  describe('updateReference', () => {
    test('updates reference fields', async () => {
      const ref = createTestReference({ title: 'Original Title' });
      const { id, createdAt, updatedAt, ...refData } = ref;

      const refId = await addReference(TEST_USER_ID, refData);
      await updateReference(TEST_USER_ID, refId, { title: 'Updated Title' });

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.title).toBe('Updated Title');
    });

    test('updates updatedAt timestamp', async () => {
      const ref = createTestReference();
      const { id, createdAt, updatedAt, ...refData } = ref;

      const refId = await addReference(TEST_USER_ID, refData);
      const original = await getReference(TEST_USER_ID, refId);

      // Wait a bit then update
      await new Promise(resolve => setTimeout(resolve, 10));
      await updateReference(TEST_USER_ID, refId, { notes: 'New notes' });

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(original!.updatedAt.getTime());
    });
  });

  describe('deleteReference', () => {
    test('deletes reference', async () => {
      const ref = createTestReference();
      const { id, createdAt, updatedAt, ...refData } = ref;

      const refId = await addReference(TEST_USER_ID, refData);
      await deleteReference(TEST_USER_ID, refId);

      const result = await getReference(TEST_USER_ID, refId);
      expect(result).toBeNull();
    });

    test('only deletes specified reference', async () => {
      const ref1 = createTestReference({ title: 'Paper 1' });
      const ref2 = createTestReference({ title: 'Paper 2' });

      const { id: id1, createdAt: c1, updatedAt: u1, ...data1 } = ref1;
      const { id: id2, createdAt: c2, updatedAt: u2, ...data2 } = ref2;

      const refId1 = await addReference(TEST_USER_ID, data1);
      const refId2 = await addReference(TEST_USER_ID, data2);

      await deleteReference(TEST_USER_ID, refId1);

      expect(await getReference(TEST_USER_ID, refId1)).toBeNull();
      expect(await getReference(TEST_USER_ID, refId2)).not.toBeNull();
    });
  });

  describe('deleteReferences (batch)', () => {
    test('deletes multiple references', async () => {
      const refs = [
        createTestReference({ title: 'Paper 1' }),
        createTestReference({ title: 'Paper 2' }),
        createTestReference({ title: 'Paper 3' }),
      ];

      const refData = refs.map(({ id, createdAt, updatedAt, ...rest }) => rest);
      const ids = await addReferences(TEST_USER_ID, refData);

      await deleteReferences(TEST_USER_ID, [ids[0], ids[2]]);

      const remaining = await getAllReferences(TEST_USER_ID);
      expect(remaining.length).toBe(1);
      expect(remaining[0].title).toBe('Paper 2');
    });
  });

  describe('getAllReferences', () => {
    test('returns all user references', async () => {
      const refs = [
        createTestReference({ title: 'Paper 1' }),
        createTestReference({ title: 'Paper 2' }),
        createTestReference({ title: 'Paper 3' }),
      ];

      const refData = refs.map(({ id, createdAt, updatedAt, ...rest }) => rest);
      await addReferences(TEST_USER_ID, refData);

      const all = await getAllReferences(TEST_USER_ID);
      expect(all.length).toBe(3);
    });

    test('returns empty array when no references', async () => {
      const all = await getAllReferences(TEST_USER_ID);
      expect(all).toEqual([]);
    });

    test('sorts by title ascending', async () => {
      const refs = [
        createTestReference({ title: 'Zebra' }),
        createTestReference({ title: 'Apple' }),
        createTestReference({ title: 'Mango' }),
      ];

      const refData = refs.map(({ id, createdAt, updatedAt, ...rest }) => rest);
      await addReferences(TEST_USER_ID, refData);

      const all = await getAllReferences(TEST_USER_ID, 'title', 'asc');
      expect(all[0].title).toBe('Apple');
      expect(all[2].title).toBe('Zebra');
    });
  });

  describe('searchReferences', () => {
    beforeEach(async () => {
      const refs = [
        createTestReference({
          title: 'Machine learning in healthcare',
          authors: [{ family: 'Smith', given: 'John', sequence: 'first' }],
          abstract: 'This paper discusses artificial intelligence',
          keywords: ['AI', 'medicine', 'diagnosis'],
        }),
        createTestReference({
          title: 'Deep neural networks for radiology',
          authors: [{ family: 'Johnson', given: 'Mary', sequence: 'first' }],
          abstract: 'Convolutional networks for medical imaging',
          keywords: ['deep learning', 'radiology'],
        }),
        createTestReference({
          title: 'Statistical methods in epidemiology',
          authors: [{ family: 'Williams', given: 'Bob', sequence: 'first' }],
          abstract: 'Traditional statistical approaches',
          keywords: ['statistics', 'epidemiology'],
        }),
      ];

      const refData = refs.map(({ id, createdAt, updatedAt, ...rest }) => rest);
      await addReferences(TEST_USER_ID, refData);
    });

    test('searches by title', async () => {
      const results = await searchReferences(TEST_USER_ID, {
        query: 'machine learning',
        fields: ['title'],
      });

      expect(results.length).toBe(1);
      expect(results[0].title).toContain('Machine learning');
    });

    test('searches by author', async () => {
      const results = await searchReferences(TEST_USER_ID, {
        query: 'Smith',
        fields: ['authors'],
      });

      expect(results.length).toBe(1);
      expect(results[0].authors[0].family).toBe('Smith');
    });

    test('searches by abstract', async () => {
      const results = await searchReferences(TEST_USER_ID, {
        query: 'artificial intelligence',
        fields: ['abstract'],
      });

      expect(results.length).toBe(1);
      expect(results[0].abstract).toContain('artificial intelligence');
    });

    test('searches by keywords', async () => {
      const results = await searchReferences(TEST_USER_ID, {
        query: 'radiology',
        fields: ['keywords'],
      });

      expect(results.length).toBe(1);
      expect(results[0].keywords).toContain('radiology');
    });

    test('searches across multiple fields', async () => {
      const results = await searchReferences(TEST_USER_ID, {
        query: 'deep',
        fields: ['title', 'abstract', 'keywords'],
      });

      // Should find "Deep neural networks" in title and "deep learning" in keywords
      expect(results.length).toBeGreaterThan(0);
    });

    test('is case-insensitive', async () => {
      const results = await searchReferences(TEST_USER_ID, {
        query: 'MACHINE LEARNING',
      });

      expect(results.length).toBe(1);
    });

    test('filters by type', async () => {
      const results = await searchReferences(TEST_USER_ID, {
        query: '',
        types: ['article-journal'],
      });

      expect(results.every(r => r.type === 'article-journal')).toBe(true);
    });

    test('filters by year range', async () => {
      await addReference(TEST_USER_ID, createTestReference({ issued: { year: 2020 } }));
      await addReference(TEST_USER_ID, createTestReference({ issued: { year: 2023 } }));

      const results = await searchReferences(TEST_USER_ID, {
        query: '',
        yearRange: { start: 2023, end: 2024 },
      });

      expect(results.every(r => r.issued.year >= 2023 && r.issued.year <= 2024)).toBe(true);
    });

    test('applies pagination with limit', async () => {
      const results = await searchReferences(TEST_USER_ID, {
        query: '',
        limit: 2,
      });

      expect(results.length).toBe(2);
    });

    test('applies pagination with offset', async () => {
      const all = await searchReferences(TEST_USER_ID, { query: '' });
      const page2 = await searchReferences(TEST_USER_ID, {
        query: '',
        offset: 2,
        limit: 1,
      });

      expect(page2.length).toBe(1);
      expect(page2[0].id).toBe(all[2].id);
    });
  });

  describe('findDuplicates', () => {
    test('finds duplicate by DOI', async () => {
      const original = createTestReference({
        identifiers: { doi: '10.1234/test.123' },
      });
      const { id, createdAt, updatedAt, ...refData } = original;

      await addReference(TEST_USER_ID, refData);

      const duplicate = createTestReference({
        title: 'Different title',
        identifiers: { doi: '10.1234/test.123' }, // Same DOI
      });

      const dups = await findDuplicates(TEST_USER_ID, duplicate);
      expect(dups.length).toBe(1);
      expect(dups[0].identifiers.doi).toBe('10.1234/test.123');
    });

    test('finds duplicate by title similarity', async () => {
      const original = createTestReference({
        title: 'Machine Learning in Healthcare: A Review',
        identifiers: {},
      });
      const { id, createdAt, updatedAt, ...refData } = original;

      await addReference(TEST_USER_ID, refData);

      const duplicate = createTestReference({
        title: 'machine learning in healthcare a review', // Same title, different case/punctuation
        identifiers: {},
      });

      const dups = await findDuplicates(TEST_USER_ID, duplicate);
      expect(dups.length).toBe(1);
    });

    test('does not match short titles', async () => {
      const original = createTestReference({
        title: 'AI',
        identifiers: {},
      });
      const { id, createdAt, updatedAt, ...refData } = original;

      await addReference(TEST_USER_ID, refData);

      const other = createTestReference({
        title: 'AI',
        identifiers: {},
      });

      const dups = await findDuplicates(TEST_USER_ID, other);
      // Should not match because title is too short (<20 chars)
      expect(dups.length).toBe(0);
    });

    test('returns empty array when no duplicates', async () => {
      const ref = createTestReference({
        title: 'Unique paper title here',
        identifiers: { doi: '10.1234/unique' },
      });

      const dups = await findDuplicates(TEST_USER_ID, ref);
      expect(dups).toEqual([]);
    });

    test('handles case-insensitive DOI matching', async () => {
      const original = createTestReference({
        identifiers: { doi: '10.1234/TEST.123' },
      });
      const { id, createdAt, updatedAt, ...refData } = original;

      await addReference(TEST_USER_ID, refData);

      const duplicate = createTestReference({
        identifiers: { doi: '10.1234/test.123' }, // Lowercase
      });

      const dups = await findDuplicates(TEST_USER_ID, duplicate);
      expect(dups.length).toBe(1);
    });
  });
});

describe('Citation Library - Folders', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('createFolder', () => {
    test('creates folder with name', async () => {
      const folderId = await createFolder(TEST_USER_ID, {
        name: 'My Research',
      });

      expect(folderId).toBeDefined();

      const folders = await getFolders(TEST_USER_ID);
      expect(folders.length).toBe(1);
      expect(folders[0].name).toBe('My Research');
    });

    test('creates folder with color and icon', async () => {
      const folderId = await createFolder(TEST_USER_ID, {
        name: 'Important Papers',
        color: '#FF5733',
        icon: 'star',
      });

      const folders = await getFolders(TEST_USER_ID);
      expect(folders[0].color).toBe('#FF5733');
      expect(folders[0].icon).toBe('star');
    });
  });

  describe('getFolders', () => {
    test('returns all folders sorted by name', async () => {
      await createFolder(TEST_USER_ID, { name: 'Zebra' });
      await createFolder(TEST_USER_ID, { name: 'Apple' });
      await createFolder(TEST_USER_ID, { name: 'Mango' });

      const folders = await getFolders(TEST_USER_ID);

      expect(folders.length).toBe(3);
      expect(folders[0].name).toBe('Apple');
      expect(folders[2].name).toBe('Zebra');
    });

    test('returns empty array when no folders', async () => {
      const folders = await getFolders(TEST_USER_ID);
      expect(folders).toEqual([]);
    });
  });

  describe('updateFolder', () => {
    test('updates folder name', async () => {
      const folderId = await createFolder(TEST_USER_ID, { name: 'Old Name' });
      await updateFolder(TEST_USER_ID, folderId, { name: 'New Name' });

      const folders = await getFolders(TEST_USER_ID);
      expect(folders[0].name).toBe('New Name');
    });
  });

  describe('deleteFolder', () => {
    test('deletes folder', async () => {
      const folderId = await createFolder(TEST_USER_ID, { name: 'To Delete' });
      await deleteFolder(TEST_USER_ID, folderId);

      const folders = await getFolders(TEST_USER_ID);
      expect(folders.length).toBe(0);
    });

    test('removes folder from references', async () => {
      const folderId = await createFolder(TEST_USER_ID, { name: 'Test Folder' });

      const ref = createTestReference({ folders: [folderId] });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      await deleteFolder(TEST_USER_ID, folderId);

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.folders).toEqual([]);
    });
  });

  describe('getReferencesByFolder', () => {
    test('returns references in folder', async () => {
      const folderId = await createFolder(TEST_USER_ID, { name: 'Test' });

      const ref1 = createTestReference({ folders: [folderId], title: 'In folder' });
      const ref2 = createTestReference({ folders: [], title: 'Not in folder' });

      const { id: id1, createdAt: c1, updatedAt: u1, ...data1 } = ref1;
      const { id: id2, createdAt: c2, updatedAt: u2, ...data2 } = ref2;

      await addReference(TEST_USER_ID, data1);
      await addReference(TEST_USER_ID, data2);

      const inFolder = await getReferencesByFolder(TEST_USER_ID, folderId);
      expect(inFolder.length).toBe(1);
      expect(inFolder[0].title).toBe('In folder');
    });
  });

  describe('addReferenceToFolder / removeReferenceFromFolder', () => {
    test('adds reference to folder', async () => {
      const folderId = await createFolder(TEST_USER_ID, { name: 'Test' });
      const ref = createTestReference({ folders: [] });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      await addReferenceToFolder(TEST_USER_ID, refId, folderId);

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.folders).toContain(folderId);
    });

    test('removes reference from folder', async () => {
      const folderId = await createFolder(TEST_USER_ID, { name: 'Test' });
      const ref = createTestReference({ folders: [folderId] });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      await removeReferenceFromFolder(TEST_USER_ID, refId, folderId);

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.folders).not.toContain(folderId);
    });

    test('does not add duplicate folder', async () => {
      const folderId = await createFolder(TEST_USER_ID, { name: 'Test' });
      const ref = createTestReference({ folders: [folderId] });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      await addReferenceToFolder(TEST_USER_ID, refId, folderId);

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.folders?.filter(f => f === folderId).length).toBe(1);
    });
  });
});

describe('Citation Library - Labels', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('createLabel', () => {
    test('creates label with name and color', async () => {
      const labelId = await createLabel(TEST_USER_ID, {
        name: 'Important',
        color: '#FF0000',
      });

      expect(labelId).toBeDefined();

      const labels = await getLabels(TEST_USER_ID);
      expect(labels.length).toBe(1);
      expect(labels[0].name).toBe('Important');
      expect(labels[0].color).toBe('#FF0000');
    });
  });

  describe('getLabels', () => {
    test('returns all labels sorted by name', async () => {
      await createLabel(TEST_USER_ID, { name: 'Zebra', color: '#000000' });
      await createLabel(TEST_USER_ID, { name: 'Apple', color: '#FF0000' });

      const labels = await getLabels(TEST_USER_ID);
      expect(labels[0].name).toBe('Apple');
      expect(labels[1].name).toBe('Zebra');
    });
  });

  describe('deleteLabel', () => {
    test('deletes label', async () => {
      const labelId = await createLabel(TEST_USER_ID, {
        name: 'To Delete',
        color: '#000000',
      });

      await deleteLabel(TEST_USER_ID, 'To Delete');

      const labels = await getLabels(TEST_USER_ID);
      expect(labels.length).toBe(0);
    });

    test('removes label from references', async () => {
      await createLabel(TEST_USER_ID, { name: 'TestLabel', color: '#000000' });

      const ref = createTestReference({ labels: ['TestLabel'] });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      await deleteLabel(TEST_USER_ID, 'TestLabel');

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.labels).toEqual([]);
    });
  });

  describe('getReferencesByLabel', () => {
    test('returns references with label', async () => {
      await createLabel(TEST_USER_ID, { name: 'Important', color: '#FF0000' });

      const ref1 = createTestReference({ labels: ['Important'], title: 'Has label' });
      const ref2 = createTestReference({ labels: [], title: 'No label' });

      const { id: id1, createdAt: c1, updatedAt: u1, ...data1 } = ref1;
      const { id: id2, createdAt: c2, updatedAt: u2, ...data2 } = ref2;

      await addReference(TEST_USER_ID, data1);
      await addReference(TEST_USER_ID, data2);

      const withLabel = await getReferencesByLabel(TEST_USER_ID, 'Important');
      expect(withLabel.length).toBe(1);
      expect(withLabel[0].title).toBe('Has label');
    });
  });

  describe('addLabelToReference / removeLabelFromReference', () => {
    test('adds label to reference', async () => {
      await createLabel(TEST_USER_ID, { name: 'TestLabel', color: '#000000' });

      const ref = createTestReference({ labels: [] });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      await addLabelToReference(TEST_USER_ID, refId, 'TestLabel');

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.labels).toContain('TestLabel');
    });

    test('removes label from reference', async () => {
      const ref = createTestReference({ labels: ['TestLabel'] });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      await removeLabelFromReference(TEST_USER_ID, refId, 'TestLabel');

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.labels).not.toContain('TestLabel');
    });
  });
});

describe('Citation Library - Utilities', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('toggleFavorite', () => {
    test('sets favorite to true', async () => {
      const ref = createTestReference({ favorite: false });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      const isFavorite = await toggleFavorite(TEST_USER_ID, refId);

      expect(isFavorite).toBe(true);

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.favorite).toBe(true);
    });

    test('sets favorite to false', async () => {
      const ref = createTestReference({ favorite: true });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      const isFavorite = await toggleFavorite(TEST_USER_ID, refId);

      expect(isFavorite).toBe(false);
    });
  });

  describe('updateReadStatus', () => {
    test('updates read status', async () => {
      const ref = createTestReference({ readStatus: 'unread' });
      const { id, createdAt, updatedAt, ...refData } = ref;
      const refId = await addReference(TEST_USER_ID, refData);

      await updateReadStatus(TEST_USER_ID, refId, 'reading');

      const updated = await getReference(TEST_USER_ID, refId);
      expect(updated?.readStatus).toBe('reading');
    });
  });

  describe('getLibraryStats', () => {
    test('calculates library statistics', async () => {
      const refs = [
        createTestReference({ type: 'article-journal', favorite: true, readStatus: 'read', issued: { year: 2024 } }),
        createTestReference({ type: 'article-journal', favorite: false, readStatus: 'unread', issued: { year: 2024 } }),
        createTestReference({ type: 'book', favorite: true, readStatus: 'reading', issued: { year: 2023 } }),
      ];

      const refData = refs.map(({ id, createdAt, updatedAt, ...rest }) => rest);
      await addReferences(TEST_USER_ID, refData);

      const stats = await getLibraryStats(TEST_USER_ID);

      expect(stats.totalReferences).toBe(3);
      expect(stats.byType['article-journal']).toBe(2);
      expect(stats.byType['book']).toBe(1);
      expect(stats.byYear[2024]).toBe(2);
      expect(stats.byYear[2023]).toBe(1);
      expect(stats.favorites).toBe(2);
      expect(stats.unread).toBe(1);
    });

    test('returns empty stats for empty library', async () => {
      const stats = await getLibraryStats(TEST_USER_ID);

      expect(stats.totalReferences).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byYear).toEqual({});
      expect(stats.favorites).toBe(0);
      expect(stats.unread).toBe(0);
    });
  });
});
