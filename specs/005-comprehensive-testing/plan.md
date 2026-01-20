# Comprehensive Testing - Implementation Plan

**Feature ID:** 005
**Version:** 1.0
**Date:** 2026-01-04
**Mindset:** World-class product, not MVP. Zero tolerance for bugs.

---

## 1. Architecture Overview

### 1.1 Testing Philosophy

```
                    ┌─────────────────────────────────────────┐
                    │          QUALITY PYRAMID                │
                    │                                         │
                    │              ▲                          │
                    │             /│\     E2E Tests           │
                    │            / │ \    (Full journeys)     │
                    │           /  │  \                       │
                    │          /───┼───\  Integration Tests   │
                    │         /    │    \ (Components)        │
                    │        /     │     \                    │
                    │       /──────┼──────\  Unit Tests       │
                    │      /       │       \ (Functions)      │
                    │     /────────┼────────\                 │
                    │    /         │         \ Static Analysis│
                    │   /          │          \ (TypeScript)  │
                    │  ────────────┴───────────               │
                    │                                         │
                    │  More tests at base = faster feedback   │
                    │  Tests at top = more confidence         │
                    └─────────────────────────────────────────┘
```

### 1.2 Test Distribution

| Layer | Count | Purpose | Run Time |
|-------|-------|---------|----------|
| TypeScript | Continuous | Type safety | 0s (compile time) |
| Unit Tests | ~400+ | Individual functions | ~60s |
| Integration | ~80+ | Component interactions | ~120s |
| E2E | ~20+ | User journeys | ~300s |
| **Total** | **~500+ tests** | **Complete coverage** | **~8 min** |

---

## 2. Technical Architecture

### 2.1 Testing Stack

```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical paths require higher coverage
    './lib/supabase/': {
      branches: 95,
      functions: 95,
      lines: 95,
    },
    './lib/citations/': {
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
```

### 2.2 Mock Architecture

```typescript
// Mock Service Worker for API mocking
// __tests__/mocks/handlers.ts

import { http, HttpResponse } from 'msw';

export const handlers = [
  // PubMed API
  http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/*', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.includes('esearch')) {
      return HttpResponse.xml(mockPubMedSearchResponse);
    }
    if (url.pathname.includes('efetch')) {
      return HttpResponse.xml(mockPubMedFetchResponse);
    }
  }),

  // arXiv API
  http.get('http://export.arxiv.org/api/query', () => {
    return HttpResponse.xml(mockArxivResponse);
  }),

  // Semantic Scholar API
  http.get('https://api.semanticscholar.org/graph/v1/*', () => {
    return HttpResponse.json(mockSemanticScholarResponse);
  }),

  // OpenAlex API
  http.get('https://api.openalex.org/*', () => {
    return HttpResponse.json(mockOpenAlexResponse);
  }),

  // OpenRouter (AI)
  http.post('https://openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json(mockAIResponse);
  }),
];
```

### 2.3 Supabase Mock

```typescript
// __tests__/mocks/supabase.ts

import { jest } from '@jest/globals';

// In-memory Postgres simulation
class MockPostgres {
  private data: Map<string, Map<string, any>> = new Map();

  collection(path: string) {
    if (!this.data.has(path)) {
      this.data.set(path, new Map());
    }
    return new MockCollection(this.data.get(path)!);
  }

  // ... full implementation
}

// Mock Auth
class MockAuth {
  currentUser: MockUser | null = null;
  private listeners: Set<(user: MockUser | null) => void> = new Set();

  async signInWithPopup() {
    this.currentUser = createMockUser();
    this.notifyListeners();
    return { user: this.currentUser };
  }

  async signOut() {
    this.currentUser = null;
    this.notifyListeners();
  }

  onAuthStateChanged(callback: (user: MockUser | null) => void) {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }
}

export const mockSupabase = {
  auth: new MockAuth(),
  postgres: new MockPostgres(),
};
```

### 2.4 Test Data Generation

```typescript
// __tests__/mocks/test-data.ts

import { faker } from '@faker-js/faker';
import type { Document, Reference, Presentation } from '@/lib/supabase/schema';

export function createMockDocument(overrides?: Partial<Document>): Document {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(5),
    wordCount: faker.number.int({ min: 100, max: 5000 }),
    discipline: faker.helpers.arrayElement([
      'life-sciences', 'clinical-medicine', 'computer-science'
    ]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockReference(overrides?: Partial<Reference>): Reference {
  return {
    id: faker.string.uuid(),
    type: 'article-journal',
    title: faker.lorem.sentence(),
    author: [
      { family: faker.person.lastName(), given: faker.person.firstName() },
      { family: faker.person.lastName(), given: faker.person.firstName() },
    ],
    issued: { 'date-parts': [[faker.number.int({ min: 2000, max: 2024 })]] },
    'container-title': faker.company.name() + ' Journal',
    volume: String(faker.number.int({ min: 1, max: 100 })),
    page: `${faker.number.int({ min: 1, max: 100 })}-${faker.number.int({ min: 101, max: 200 })}`,
    DOI: `10.${faker.number.int({ min: 1000, max: 9999 })}/${faker.string.alphanumeric(8)}`,
    ...overrides,
  };
}

export function createMockPresentation(overrides?: Partial<Presentation>): Presentation {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title: faker.lorem.sentence(),
    theme: faker.helpers.arrayElement(['academic', 'dark', 'minimal']),
    slides: [
      createMockSlide('title'),
      createMockSlide('content'),
      createMockSlide('data-visualization'),
    ],
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Edge case generators
export const edgeCases = {
  emptyDocument: () => createMockDocument({ content: '', wordCount: 0 }),

  veryLongDocument: () => createMockDocument({
    content: faker.lorem.paragraphs(500),
    wordCount: 50000,
  }),

  documentWithSpecialChars: () => createMockDocument({
    title: 'Test: "Quotes" & <HTML> © ™ emoji 🎉',
    content: 'Special chars: é, ü, ñ, ø, α, β, γ, 中文, العربية',
  }),

  referenceWith100Authors: () => createMockReference({
    author: Array.from({ length: 100 }, () => ({
      family: faker.person.lastName(),
      given: faker.person.firstName(),
    })),
  }),

  referenceWithMissingFields: () => ({
    id: faker.string.uuid(),
    type: 'article-journal',
    // No title, no authors, no year
  }),
};
```

---

## 3. Test Module Architecture

### 3.1 Unit Test Structure

Each test file follows this pattern:

```typescript
// __tests__/unit/citations/csl-formatter.test.ts

import { formatCitation, formatBibliography } from '@/lib/citations/csl-formatter';
import { createMockReference, edgeCases } from '../../mocks/test-data';

describe('CSL Citation Formatter', () => {
  // Group by style
  describe('APA 7th Edition', () => {
    // Group by scenario
    describe('in-text citations', () => {
      // Individual tests with clear names
      test('formats single author: (Smith, 2024)', () => {
        const ref = createMockReference({
          author: [{ family: 'Smith', given: 'John' }],
          issued: { 'date-parts': [[2024]] },
        });
        expect(formatCitation(ref, 'apa')).toBe('(Smith, 2024)');
      });

      test('formats two authors with ampersand: (Smith & Jones, 2024)', () => {
        const ref = createMockReference({
          author: [
            { family: 'Smith', given: 'John' },
            { family: 'Jones', given: 'Mary' },
          ],
          issued: { 'date-parts': [[2024]] },
        });
        expect(formatCitation(ref, 'apa')).toBe('(Smith & Jones, 2024)');
      });

      test('formats 3+ authors with et al.: (Smith et al., 2024)', () => {
        const ref = createMockReference({
          author: [
            { family: 'Smith', given: 'John' },
            { family: 'Jones', given: 'Mary' },
            { family: 'Lee', given: 'David' },
          ],
          issued: { 'date-parts': [[2024]] },
        });
        expect(formatCitation(ref, 'apa')).toBe('(Smith et al., 2024)');
      });
    });

    describe('edge cases', () => {
      test('handles missing year: (Smith, n.d.)', () => {
        const ref = createMockReference({
          author: [{ family: 'Smith', given: 'John' }],
          issued: undefined,
        });
        expect(formatCitation(ref, 'apa')).toBe('(Smith, n.d.)');
      });

      test('handles 100+ authors correctly', () => {
        const ref = edgeCases.referenceWith100Authors();
        const citation = formatCitation(ref, 'apa');
        expect(citation).toMatch(/et al\./);
        expect(citation.length).toBeLessThan(100); // Should truncate
      });

      test('handles unicode in author names: (Müller, 2024)', () => {
        const ref = createMockReference({
          author: [{ family: 'Müller', given: 'François' }],
          issued: { 'date-parts': [[2024]] },
        });
        expect(formatCitation(ref, 'apa')).toBe('(Müller, 2024)');
      });
    });
  });

  // Test all 10 styles
  describe.each([
    ['apa', '(Smith, 2024)'],
    ['mla', '(Smith)'],
    ['chicago', '(Smith 2024)'],
    ['vancouver', '[1]'],
    ['harvard', '(Smith 2024)'],
    ['ieee', '[1]'],
    ['ama', '1'],
    ['nature', '1'],
    ['cell', '(Smith, 2024)'],
    ['science', '(1)'],
  ])('%s style', (style, expectedPattern) => {
    test(`produces valid ${style} citation`, () => {
      const ref = createMockReference();
      const citation = formatCitation(ref, style);
      expect(citation).toBeDefined();
      expect(citation.length).toBeGreaterThan(0);
    });
  });
});
```

### 3.2 Integration Test Structure

```typescript
// __tests__/integration/document-workflow.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThreePanelLayout } from '@/components/layout/three-panel-layout';
import { mockSupabase } from '../mocks/supabase';

// Mock modules
jest.mock('@/lib/supabase/client', () => mockSupabase);

describe('Document Workflow', () => {
  beforeEach(() => {
    // Reset mock state
    mockSupabase.postgres.clear();
    mockSupabase.auth.signOut();
  });

  test('create → edit → auto-save → reload → verify', async () => {
    // 1. Sign in
    await mockSupabase.auth.signInWithPopup();

    // 2. Render app
    render(<ThreePanelLayout />);

    // 3. Create new document
    const newDocButton = await screen.findByText('New Document');
    await userEvent.click(newDocButton);

    // 4. Select template
    const blankTemplate = await screen.findByText('Blank Document');
    await userEvent.click(blankTemplate);

    // 5. Wait for editor
    const editor = await screen.findByRole('textbox');

    // 6. Type content
    await userEvent.type(editor, 'This is test content for my document.');

    // 7. Wait for auto-save (mock 30 second timer)
    jest.advanceTimersByTime(30000);

    // 8. Verify save indicator
    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });

    // 9. Reload (unmount and remount)
    const { unmount } = render(<ThreePanelLayout />);
    unmount();
    render(<ThreePanelLayout />);

    // 10. Verify content persisted
    await waitFor(() => {
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });
  });

  test('handles offline mode gracefully', async () => {
    await mockSupabase.auth.signInWithPopup();
    render(<ThreePanelLayout />);

    // Simulate going offline
    mockSupabase.setOffline(true);

    // Try to create document
    const newDocButton = await screen.findByText('New Document');
    await userEvent.click(newDocButton);

    // Should show offline indicator
    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    // Content should still be editable (local)
    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'Offline content');

    // Simulate going back online
    mockSupabase.setOffline(false);

    // Should sync automatically
    await waitFor(() => {
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
    });
  });
});
```

### 3.3 E2E Test Structure

```typescript
// __tests__/e2e/new-user-journey.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/app/page';

describe('New User Journey', () => {
  test('complete first-time user flow', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Step 1: See sign-in prompt
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();

    // Step 2: Click sign in
    await user.click(screen.getByRole('button', { name: /sign in with google/i }));

    // Step 3: Wait for auth (mocked)
    await waitFor(() => {
      expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
    });

    // Step 4: See empty document list
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();

    // Step 5: Create document
    await user.click(screen.getByText(/new document/i));

    // Step 6: Select template
    await user.click(screen.getByText(/research article/i));

    // Step 7: Editor loads with template content
    await waitFor(() => {
      expect(screen.getByText(/introduction/i)).toBeInTheDocument();
    });

    // Step 8: Type some content
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.keyboard('This is my research about AI in healthcare.');

    // Step 9: See word count update
    await waitFor(() => {
      expect(screen.getByText(/\d+ words/)).toBeInTheDocument();
    });

    // Step 10: Open AI chat
    await user.click(screen.getByText(/ai chat/i));

    // Step 11: Search PubMed
    const chatInput = screen.getByPlaceholderText(/ask ai/i);
    await user.type(chatInput, 'Search PubMed for AI in healthcare diagnosis');
    await user.keyboard('{Enter}');

    // Step 12: See results
    await waitFor(() => {
      expect(screen.getByText(/found \d+ papers/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // Step 13: Add citation
    await user.keyboard('{Meta>}{Shift>}P{/Shift}{/Meta}'); // Cmd+Shift+P
    await waitFor(() => {
      expect(screen.getByText(/citation picker/i)).toBeInTheDocument();
    });

    // Step 14: Check writing analysis
    await user.click(screen.getByText(/analysis/i));
    await waitFor(() => {
      expect(screen.getByText(/readability/i)).toBeInTheDocument();
    });

    // Step 15: Export to PDF
    await user.click(screen.getByText(/export/i));
    await user.click(screen.getByText(/pdf/i));

    // Step 16: Verify download initiated
    await waitFor(() => {
      expect(screen.getByText(/exporting/i)).toBeInTheDocument();
    });

    // Step 17: Sign out
    await user.click(screen.getByText(/sign out/i));

    // Step 18: Back to sign-in screen
    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });
});
```

---

## 4. Continuous Integration

### 4.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --legacy-peer-deps
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --legacy-peer-deps
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --legacy-peer-deps
      - run: npm run build
      - run: npm run test:e2e

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --legacy-peer-deps
      - run: npm run type-check
```

### 4.2 Pre-commit Hooks

```json
// package.json additions
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "pre-commit": "npm run type-check && npm run lint && npm run test:unit"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run pre-commit"
    }
  }
}
```

---

## 5. Bug Tracking & Resolution

### 5.1 Bug Report Format

When tests reveal bugs, document them as:

```markdown
## BUG-001: APA citation missing period after et al.

**Severity:** Medium
**Component:** lib/citations/csl-formatter.ts
**Test File:** __tests__/unit/citations/csl-formatter.test.ts

### Expected
(Smith et al., 2024)

### Actual
(Smith et al, 2024)

### Test Case
```typescript
test('formats 3+ authors with et al. and period', () => {
  const ref = createMockReference({
    author: [
      { family: 'Smith', given: 'John' },
      { family: 'Jones', given: 'Mary' },
      { family: 'Lee', given: 'David' },
    ],
  });
  expect(formatCitation(ref, 'apa')).toBe('(Smith et al., 2024)');
});
```

### Root Cause
Missing period in template string at line 47.

### Fix
Change `${firstAuthor} et al` to `${firstAuthor} et al.`

### Status
✅ Fixed in commit abc123
```

### 5.2 Bug Priority Matrix

| Severity | Impact | Examples | Fix Timeline |
|----------|--------|----------|--------------|
| Critical | Data loss, security | Auth bypass, save failure | Immediate |
| High | Incorrect output | Wrong citation format | Same day |
| Medium | Degraded UX | Missing loading state | This sprint |
| Low | Cosmetic | Minor spacing issue | Backlog |

---

## 6. Execution Plan

### Phase 1: Infrastructure Setup (Day 1)
- Install Jest, Testing Library, MSW
- Configure jest.config.ts
- Set up mock architecture
- Create test utilities

### Phase 2: Core Tests (Days 2-3)
- Supabase auth tests
- Document CRUD tests
- Auto-save tests
- Basic hooks tests

### Phase 3: Feature Tests (Days 4-7)
- Citation system (100% coverage)
- Research APIs (all 4 databases)
- Writing analysis
- Plagiarism detection
- Export systems

### Phase 4: Integration Tests (Days 8-9)
- Authentication flows
- Document workflows
- Presentation generation

### Phase 5: E2E Tests (Day 10)
- User journeys
- Cross-feature workflows

### Phase 6: Bug Fixes (Days 11-14)
- Fix all discovered bugs
- Re-run test suite
- Verify 0 failures

---

**Document History:**
- v1.0 (2026-01-04): Initial plan
