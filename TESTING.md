# Test-Driven Development Guide

## Overview

This project follows Test-Driven Development (TDD) principles. All new features must have tests written BEFORE implementation.

## Test Suite Status

| Metric | Value |
|--------|-------|
| Total Tests | 1,213 |
| Passing | 1,127 (92.9%) |
| Test Files | 29 |
| Coverage Target | 95% |

## Quick Start

```bash
# Run all tests
npm run test:run

# Watch mode (re-runs on file changes)
npm run test:watch

# Run specific test file
npm run test:run -- __tests__/unit/citations/csl-formatter.test.ts

# Run tests with coverage
npm run test:coverage

# Visual UI for tests
npm run test:ui
```

## TDD Workflow

### The Red-Green-Refactor Cycle

1. **RED**: Write a failing test first
2. **GREEN**: Write minimum code to pass the test
3. **REFACTOR**: Improve the code while keeping tests green

### Before Writing ANY Code

```
1. Create test file in appropriate directory
2. Write failing test cases
3. Run tests to confirm they fail
4. THEN write implementation
5. Run tests to confirm they pass
6. Commit with tests + implementation together
```

## Test File Structure

```
__tests__/
├── mocks/                    # Shared mocks
│   ├── firebase.ts           # Firebase SDK mocks
│   ├── handlers.ts           # MSW API handlers
│   ├── server.ts             # MSW server setup
│   └── test-data.ts          # Faker-based test data
├── setup.ts                  # Global test setup
└── unit/                     # Unit tests
    ├── citations/            # Citation system tests
    ├── collaboration/        # Collaboration feature tests
    ├── export/               # Export functionality tests
    ├── firebase/             # Firebase/auth tests
    ├── plagiarism/           # Plagiarism detection tests
    ├── presentations/        # Presentation generator tests
    ├── research/             # Research API tests
    └── writing-analysis/     # Writing analysis tests
```

## Writing Tests

### Test File Naming

```
- Unit tests: `{feature}.test.ts`
- Component tests: `{component}.test.tsx`
- Integration tests: `{feature}.integration.test.ts`
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionToTest } from '@/lib/module';

describe('Feature Name', () => {
  describe('Function Name', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should do expected behavior', () => {
      // Arrange
      const input = 'test data';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected output');
    });

    it('handles edge case', () => {
      expect(functionToTest('')).toBeNull();
    });
  });
});
```

## Mocking Guidelines

### Firebase Mocks

The project uses comprehensive Firebase mocks in `__tests__/mocks/firebase.ts`:

```typescript
import { mockAuth, mockFirestore } from '@/__tests__/mocks/firebase';

// Auth is automatically mocked via setup.ts
// Firestore operations use mockFirestore
```

### API Mocks (MSW)

External APIs are mocked using MSW handlers in `__tests__/mocks/handlers.ts`:

```typescript
// PubMed, arXiv, Semantic Scholar, OpenAlex all have mock handlers
// Add new handlers for new external APIs
```

### Test Data Generation

Use Faker.js generators from `__tests__/mocks/test-data.ts`:

```typescript
import { createTestReference, createTestDocument } from '@/__tests__/mocks/test-data';

const ref = createTestReference({ title: 'Custom Title' });
```

## CI/CD Integration

Tests run automatically on:
- Every push to `main`, `develop`, `claude/*`
- Every pull request to `main`, `develop`

### Required for Merge
- All tests must pass
- Type checking must pass
- Build must succeed

## Test Categories

### Critical Path Tests (Must Pass)

1. **Authentication**: Sign-in, session management
2. **Document CRUD**: Create, read, update, delete
3. **Auto-save**: Debounced saves to Firestore
4. **Citation Formatting**: All 10 citation styles
5. **Export**: DOCX, PDF, PPTX generation

### Edge Case Tests

1. **Empty inputs**: Handle gracefully
2. **Unicode**: International characters
3. **Large data**: Performance with many items
4. **Malformed data**: Invalid formats

## Common Patterns

### Testing Async Functions

```typescript
it('fetches data asynchronously', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Testing Error Handling

```typescript
it('throws on invalid input', () => {
  expect(() => processData(null)).toThrow('Invalid input');
});
```

### Testing with Timeouts

```typescript
it('debounces correctly', async () => {
  vi.useFakeTimers();

  triggerAutoSave();
  expect(saveFunction).not.toHaveBeenCalled();

  vi.advanceTimersByTime(30000);
  expect(saveFunction).toHaveBeenCalled();

  vi.useRealTimers();
});
```

## Troubleshooting

### Tests Hang or Timeout

```bash
# Increase timeout
npm run test:run -- --testTimeout=30000
```

### Mock Not Working

1. Check `vi.mock()` is at module level (not inside describe)
2. Verify mock path matches actual import
3. Clear mocks in `beforeEach`

### Firebase Mock Issues

The Firebase mock in `setup.ts` must match SDK method signatures exactly.

## Adding Tests for New Features

1. Create test file in appropriate `__tests__/unit/` subdirectory
2. Import functions to test
3. Write describe blocks for each function
4. Write it blocks for each behavior
5. Include edge cases
6. Run `npm run test:run -- path/to/test.ts`
7. Commit with feature implementation

## Best Practices

1. **One assertion per test** (when practical)
2. **Descriptive test names**: "should return null for empty input"
3. **Arrange-Act-Assert** pattern
4. **Don't test implementation details** - test behavior
5. **Use beforeEach** for common setup
6. **Clean up** in afterEach when needed
7. **Mock external dependencies** - never hit real APIs in tests

## Coverage Goals

| Category | Target |
|----------|--------|
| Statements | 80% |
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |
| Critical Paths | 95% |

Run coverage report:
```bash
npm run test:coverage
```
