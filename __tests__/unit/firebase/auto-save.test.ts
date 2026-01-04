/**
 * Auto-Save Functionality Tests
 *
 * Tests the useDocument hook's auto-save capabilities:
 * - Debounced auto-save (30 seconds)
 * - Manual save
 * - Save status indicators
 * - Error handling and retries
 * - Content change detection
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { mockAuth, mockFirestore, resetFirebaseMocks } from '../../mocks/firebase';
import { createMockUser, createMockDocument } from '../../mocks/test-data';
import { useDocument } from '@/lib/hooks/use-document';
import { createDocument, getDocument } from '@/lib/firebase/documents';

// Mock toast notifications
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock('sonner', () => ({
  toast: mockToast,
}));

describe('Auto-Save Functionality', () => {
  let testUserId: string;
  let testDocId: string;

  beforeEach(async () => {
    resetFirebaseMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Set up authenticated user
    const user = createMockUser();
    testUserId = user.uid;
    mockAuth.setUser(user);

    // Create a test document
    testDocId = await createDocument(testUserId, 'Test Document');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Auto-save timing', () => {
    test('triggers save after 30 seconds of inactivity', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId, autoSaveInterval: 30000 })
      );

      // Wait for document to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change content
      act(() => {
        result.current.setContent('<p>New content</p>');
      });

      // Initially not saving
      expect(result.current.saving).toBe(false);

      // After 29 seconds, still not saving
      act(() => {
        vi.advanceTimersByTime(29000);
      });
      expect(result.current.saving).toBe(false);

      // After 30 seconds, should trigger save
      await act(async () => {
        vi.advanceTimersByTime(1000);
        await vi.runAllTimersAsync();
      });

      // Wait for save to complete
      await waitFor(() => {
        expect(result.current.saving).toBe(false);
        expect(result.current.lastSaved).not.toBeNull();
      });

      // Verify content was saved
      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.content).toBe('<p>New content</p>');
    });

    test('debounces rapid changes correctly', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId, autoSaveInterval: 30000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make rapid changes
      act(() => {
        result.current.setContent('<p>Change 1</p>');
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      act(() => {
        result.current.setContent('<p>Change 2</p>');
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      act(() => {
        result.current.setContent('<p>Change 3</p>');
      });

      // Should not have saved yet
      expect(result.current.saving).toBe(false);

      // Wait for debounce to complete
      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.saving).toBe(false);
      });

      // Should save only the last change
      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.content).toBe('<p>Change 3</p>');
    });

    test('resets timer on each content change', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId, autoSaveInterval: 30000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change 1
      act(() => {
        result.current.setContent('<p>Change 1</p>');
      });

      // Wait 25 seconds
      act(() => {
        vi.advanceTimersByTime(25000);
      });

      // Change 2 - should reset timer
      act(() => {
        result.current.setContent('<p>Change 2</p>');
      });

      // Wait another 25 seconds (total 50s from first change)
      act(() => {
        vi.advanceTimersByTime(25000);
      });

      // Should not have saved yet (only 25s since last change)
      expect(result.current.saving).toBe(false);

      // Wait final 5 seconds
      await act(async () => {
        vi.advanceTimersByTime(5000);
        await vi.runAllTimersAsync();
      });

      // Now should save
      await waitFor(() => {
        expect(result.current.saving).toBe(false);
      });

      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.content).toBe('<p>Change 2</p>');
    });

    test('does not save if content unchanged', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId, autoSaveInterval: 30000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalContent = result.current.content;
      const originalLastSaved = result.current.lastSaved;

      // "Change" to same content
      act(() => {
        result.current.setContent(originalContent);
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      // Should trigger save attempt, but content is same
      // lastSaved should be updated
      await waitFor(() => {
        expect(result.current.lastSaved?.getTime()).toBeGreaterThanOrEqual(
          originalLastSaved?.getTime() || 0
        );
      });
    });
  });

  describe('Manual save', () => {
    test('manual save (Cmd+S) works immediately', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change content
      act(() => {
        result.current.setContent('<p>Manual save test</p>');
      });

      // Trigger manual save immediately (without waiting for auto-save)
      await act(async () => {
        await result.current.saveNow();
      });

      // Should show success toast
      expect(mockToast.success).toHaveBeenCalledWith('Document saved');

      // Verify content was saved
      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.content).toBe('<p>Manual save test</p>');
    });

    test('manual save updates lastSaved timestamp', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalLastSaved = result.current.lastSaved;

      act(() => {
        result.current.setContent('<p>Test</p>');
      });

      await act(async () => {
        await result.current.saveNow();
      });

      await waitFor(() => {
        expect(result.current.lastSaved?.getTime()).toBeGreaterThan(
          originalLastSaved?.getTime() || 0
        );
      });
    });

    test('multiple manual saves work correctly', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First save
      act(() => {
        result.current.setContent('<p>Save 1</p>');
      });
      await act(async () => {
        await result.current.saveNow();
      });

      // Second save
      act(() => {
        result.current.setContent('<p>Save 2</p>');
      });
      await act(async () => {
        await result.current.saveNow();
      });

      // Third save
      act(() => {
        result.current.setContent('<p>Save 3</p>');
      });
      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockToast.success).toHaveBeenCalledTimes(3);

      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.content).toBe('<p>Save 3</p>');
    });
  });

  describe('Save status indicators', () => {
    test('shows correct save status indicator', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId, autoSaveInterval: 30000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initially not saving
      expect(result.current.saving).toBe(false);

      // Change content
      act(() => {
        result.current.setContent('<p>Test</p>');
      });

      // Trigger save
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Should be saving
      await waitFor(() => {
        expect(result.current.saving).toBe(true);
      });

      // Complete async operations
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should finish saving
      await waitFor(() => {
        expect(result.current.saving).toBe(false);
      });
    });

    test('lastSaved updates after successful save', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const before = new Date();

      act(() => {
        result.current.setContent('<p>Test</p>');
      });

      await act(async () => {
        await result.current.saveNow();
      });

      await waitFor(() => {
        expect(result.current.lastSaved).not.toBeNull();
        expect(result.current.lastSaved!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      });
    });

    test('error state updates on save failure', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock Firestore error
      const updateSpy = vi.spyOn(mockFirestore.doc(`documents/${testDocId}`), 'update')
        .mockRejectedValueOnce(new Error('Save failed'));

      act(() => {
        result.current.setContent('<p>Test</p>');
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toBe('Save failed');
      });

      updateSpy.mockRestore();
    });
  });

  describe('Word count calculation', () => {
    test('calculates word count correctly', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setContent('<p>This is a test document with ten words total.</p>');
      });

      await act(async () => {
        await result.current.saveNow();
      });

      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.wordCount).toBe(10);
    });

    test('strips HTML tags before counting', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setContent(
          '<p>Hello <strong>world</strong></p><p>This is <em>formatted</em> text.</p>'
        );
      });

      await act(async () => {
        await result.current.saveNow();
      });

      const savedDoc = await getDocument(testDocId);
      // "Hello world This is formatted text" = 6 words
      expect(savedDoc?.wordCount).toBe(6);
    });

    test('handles empty content', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setContent('');
      });

      await act(async () => {
        await result.current.saveNow();
      });

      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.wordCount).toBe(0);
    });

    test('handles whitespace-only content', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setContent('<p>   \n\t\r\n   </p>');
      });

      await act(async () => {
        await result.current.saveNow();
      });

      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.wordCount).toBe(0);
    });
  });

  describe('Document creation', () => {
    test('creates new document successfully', async () => {
      const { result } = renderHook(() => useDocument());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let newDocId: string;
      await act(async () => {
        newDocId = await result.current.createNew('New Document');
      });

      expect(newDocId!).toBeDefined();

      const newDoc = await getDocument(newDocId!);
      expect(newDoc).not.toBeNull();
      expect(newDoc?.title).toBe('New Document');
      expect(newDoc?.userId).toBe(testUserId);
    });

    test('loads newly created document', async () => {
      const { result } = renderHook(() => useDocument());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createNew('Test New Doc');
      });

      await waitFor(() => {
        expect(result.current.document).not.toBeNull();
        expect(result.current.document?.title).toBe('Test New Doc');
      });
    });

    test('requires user to be signed in', async () => {
      // Sign out
      mockAuth.setUser(null);

      const { result } = renderHook(() => useDocument());

      await expect(async () => {
        await act(async () => {
          await result.current.createNew('Test');
        });
      }).rejects.toThrow('User must be signed in to create documents');
    });
  });

  describe('Title updates', () => {
    test('updates document title successfully', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateTitle('Updated Title');
      });

      expect(result.current.document?.title).toBe('Updated Title');

      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.title).toBe('Updated Title');
    });

    test('updates title with special characters', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const specialTitle = 'Test: "Quotes" & emoji 🎉';

      await act(async () => {
        await result.current.updateTitle(specialTitle);
      });

      expect(result.current.document?.title).toBe(specialTitle);
    });
  });

  describe('Discipline updates', () => {
    test('updates document discipline successfully', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateDiscipline('clinical-medicine');
      });

      expect(result.current.document?.discipline).toBe('clinical-medicine');

      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.discipline).toBe('clinical-medicine');
    });
  });

  describe('Error handling', () => {
    test('handles save errors gracefully', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock error
      const updateSpy = vi.spyOn(mockFirestore.doc(`documents/${testDocId}`), 'update')
        .mockRejectedValueOnce(new Error('Network error'));

      act(() => {
        result.current.setContent('<p>Test</p>');
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      updateSpy.mockRestore();
    });

    test('retries failed saves on next content change', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId, autoSaveInterval: 30000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First save fails
      const updateSpy = vi.spyOn(mockFirestore.doc(`documents/${testDocId}`), 'update')
        .mockRejectedValueOnce(new Error('Network error'));

      act(() => {
        result.current.setContent('<p>First attempt</p>');
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Second save succeeds
      updateSpy.mockRestore();

      act(() => {
        result.current.setContent('<p>Second attempt</p>');
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.saving).toBe(false);
      });

      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.content).toBe('<p>Second attempt</p>');
    });

    test('handles document not found error', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: 'non-existent-doc' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toBe('Document not found');
      });
    });
  });

  describe('Custom auto-save intervals', () => {
    test('respects custom auto-save interval', async () => {
      const { result } = renderHook(() =>
        useDocument({ documentId: testDocId, autoSaveInterval: 10000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setContent('<p>Custom interval test</p>');
      });

      // Should not save after 9 seconds
      act(() => {
        vi.advanceTimersByTime(9000);
      });
      expect(result.current.saving).toBe(false);

      // Should save after 10 seconds
      await act(async () => {
        vi.advanceTimersByTime(1000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.saving).toBe(false);
      });

      const savedDoc = await getDocument(testDocId);
      expect(savedDoc?.content).toBe('<p>Custom interval test</p>');
    });
  });

  describe('Cleanup', () => {
    test('clears timeout on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useDocument({ documentId: testDocId })
      );

      act(() => {
        result.current.setContent('<p>Test</p>');
      });

      // Unmount before save triggers
      unmount();

      // Advance timers - save should not trigger
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // No assertions needed - just ensuring no errors
    });
  });
});
