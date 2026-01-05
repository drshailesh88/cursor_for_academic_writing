import { test as base, expect, Page } from '@playwright/test';

/**
 * Test fixtures for Academic Writing Platform E2E tests
 *
 * Provides common utilities and setup for all tests:
 * - Authenticated user session
 * - Common page object patterns
 * - Helper methods for common operations
 */

// Test data constants
export const TEST_USER = {
  email: 'test@example.com',
  name: 'Test User',
};

export const TEST_DOCUMENT = {
  title: 'Test Document',
  content: '<p>This is a test document content.</p>',
};

// Extended page with helper methods
type ExtendedPage = Page & {
  // Auth helpers
  waitForAuth: () => Promise<void>;
  signOut: () => Promise<void>;

  // Document helpers
  createDocument: (title: string) => Promise<void>;
  openDocument: (title: string) => Promise<void>;
  deleteDocument: (title: string) => Promise<void>;

  // Editor helpers
  getEditorContent: () => Promise<string>;
  setEditorContent: (content: string) => Promise<void>;
  waitForAutoSave: () => Promise<void>;
};

// Extend base test with custom fixtures
export const test = base.extend<{
  authenticatedPage: ExtendedPage;
}>({
  // Authenticated page fixture that signs in before each test
  authenticatedPage: async ({ page }, use) => {
    const extendedPage = page as ExtendedPage;

    // Add helper methods
    extendedPage.waitForAuth = async () => {
      // Wait for auth state to be ready
      await page.waitForSelector('[data-testid="user-menu"], [data-testid="sign-in-button"]', {
        timeout: 10000,
      });
    };

    extendedPage.signOut = async () => {
      // Click user menu
      await page.click('[data-testid="user-menu"]');
      // Click sign out
      await page.click('[data-testid="sign-out-button"]');
      // Wait for sign in button to appear
      await page.waitForSelector('[data-testid="sign-in-button"]');
    };

    extendedPage.createDocument = async (title: string) => {
      // Click new document button
      await page.click('[data-testid="new-document-button"]');
      // Wait for document to be created
      await page.waitForTimeout(1000);
      // Find the newly created document and rename it
      const titleInput = page.locator('[data-testid="document-title-input"]').first();
      await titleInput.fill(title);
      await page.keyboard.press('Enter');
      // Wait for save
      await page.waitForTimeout(500);
    };

    extendedPage.openDocument = async (title: string) => {
      // Find and click document in list
      await page.click(`[data-testid="document-item"]:has-text("${title}")`);
      // Wait for editor to load
      await page.waitForSelector('.tiptap.ProseMirror');
    };

    extendedPage.deleteDocument = async (title: string) => {
      // Find document in list
      const doc = page.locator(`[data-testid="document-item"]:has-text("${title}")`);
      // Hover to show actions
      await doc.hover();
      // Click delete button
      await doc.locator('[data-testid="delete-document-button"]').click();
      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');
      // Wait for document to be removed
      await page.waitForTimeout(500);
    };

    extendedPage.getEditorContent = async () => {
      // Get content from TipTap editor
      return await page.locator('.tiptap.ProseMirror').innerHTML();
    };

    extendedPage.setEditorContent = async (content: string) => {
      // Click in editor
      await page.click('.tiptap.ProseMirror');
      // Select all and delete
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      // Type new content
      await page.keyboard.type(content);
      // Wait for content to be set
      await page.waitForTimeout(500);
    };

    extendedPage.waitForAutoSave = async () => {
      // Wait for auto-save indicator to appear and disappear
      // Auto-save happens every 30 seconds
      await page.waitForTimeout(31000);
    };

    // Navigate to app
    await page.goto('/');

    // Wait for page to load
    await extendedPage.waitForAuth();

    // Use the page in the test
    await use(extendedPage);

    // Cleanup: sign out after test
    try {
      const userMenu = await page.locator('[data-testid="user-menu"]').count();
      if (userMenu > 0) {
        await extendedPage.signOut();
      }
    } catch (e) {
      // Ignore errors during cleanup
    }
  },
});

// Re-export expect from @playwright/test
export { expect };

/**
 * Helper function to wait for network idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  return page.waitForLoadState('networkidle', { timeout });
}

/**
 * Helper function to take a screenshot with a timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `test-results/${name}-${timestamp}.png` });
}

/**
 * Helper function to check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Helper function to wait for Firebase auth
 */
export async function waitForFirebaseAuth(page: Page) {
  // Wait for Firebase to initialize
  await page.waitForFunction(() => {
    return window && (window as any).firebase !== undefined;
  }, { timeout: 10000 });
}

/**
 * Mock Firebase auth for testing without actual Google sign-in
 */
export async function mockFirebaseAuth(page: Page) {
  await page.addInitScript(() => {
    // Mock Firebase auth state
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      photoURL: 'https://via.placeholder.com/150',
    };

    // Override Firebase auth methods
    (window as any).__TEST_USER__ = mockUser;
  });
}
