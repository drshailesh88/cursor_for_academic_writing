/**
 * Vitest Global Setup
 *
 * This file runs before all tests and sets up:
 * - Testing Library DOM matchers
 * - Supabase mocks
 * - API mocks (MSW)
 * - Global test utilities
 */

import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll, vi, expect } from 'vitest';
import { server } from './mocks/server';
import { mockAuth, mockDatabase, MockTimestamp } from './mocks/supabase';

function createMockQuery() {
  const query: any = {};
  const noop = vi.fn(() => ({ data: null, error: null }));
  query.select = vi.fn(() => query);
  query.insert = vi.fn(() => ({ data: null, error: null }));
  query.update = vi.fn(() => ({ data: null, error: null }));
  query.upsert = vi.fn(() => ({ data: null, error: null }));
  query.delete = vi.fn(() => ({ data: null, error: null }));
  query.eq = vi.fn(() => query);
  query.in = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.single = vi.fn(noop);
  query.maybeSingle = vi.fn(noop);
  query.contains = vi.fn(() => query);
  query.ilike = vi.fn(() => query);
  return query;
}

const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    getUser: vi.fn(async () => ({ data: { user: mockAuth.currentUser }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithOAuth: vi.fn(async () => ({ data: null, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: { user: mockAuth.currentUser }, error: null })),
    signUp: vi.fn(async () => ({ data: { user: mockAuth.currentUser }, error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ data: null, error: null })),
    updateUser: vi.fn(async () => ({ data: { user: mockAuth.currentUser }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
  },
  from: vi.fn(() => createMockQuery()),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(async () => ({ data: null, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })),
    })),
  },
  rpc: vi.fn(async () => ({ data: null, error: null })),
  database: mockDatabase,
  timestamp: MockTimestamp,
};

vi.mock('@supabase/ssr', async () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@supabase/supabase-js', async () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock pptxgenjs for presentation export tests
// Note: Using vi.doMock would cause hoisting issues, so we create the mock inline
vi.mock('pptxgenjs', () => {
  const mockPptxSlide = {
    addText: vi.fn(),
    addImage: vi.fn(),
    addTable: vi.fn(),
    addChart: vi.fn(),
    addNotes: vi.fn(),
    background: undefined,
  };

  const mockPptxInstance = {
    title: '',
    author: '',
    subject: '',
    company: '',
    layout: '',
    defineSlideMaster: vi.fn(),
    addSlide: vi.fn(() => mockPptxSlide),
    write: vi.fn(async () => new Blob(['mock-pptx-content'], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    })),
  };

  class MockPptxGenJS {
    get title() { return mockPptxInstance.title; }
    set title(value: string) { mockPptxInstance.title = value; }

    get author() { return mockPptxInstance.author; }
    set author(value: string) { mockPptxInstance.author = value; }

    get subject() { return mockPptxInstance.subject; }
    set subject(value: string) { mockPptxInstance.subject = value; }

    get company() { return mockPptxInstance.company; }
    set company(value: string) { mockPptxInstance.company = value; }

    get layout() { return mockPptxInstance.layout; }
    set layout(value: string) { mockPptxInstance.layout = value; }

    defineSlideMaster = mockPptxInstance.defineSlideMaster;
    addSlide = mockPptxInstance.addSlide;
    write = mockPptxInstance.write;
  }

  return {
    default: MockPptxGenJS,
    MockPptxGenJS,
    mockPptxSlide,
    mockPptxInstance,
  };
});

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
export const waitForSupabase = () => new Promise((resolve) => setTimeout(resolve, 100));

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
