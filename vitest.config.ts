import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',

    // Global test utilities (describe, test, expect, etc.)
    globals: true,

    // Setup files - runs before all tests
    setupFiles: ['./__tests__/setup.ts'],

    // Include patterns - where to look for tests
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', '.next', 'dist'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'lib/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/__tests__/**',
        '**/mocks/**',
        '**/*.config.*',
        '.next/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Mock behavior
    clearMocks: true,
    restoreMocks: true,

    // Reporter - verbose output
    reporters: ['verbose'],

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Dependencies to inline (for ESM compatibility)
    deps: {
      inline: [
        /msw/,
      ],
    },

    // Server configuration for optional dependencies
    server: {
      deps: {
        inline: ['pptxgenjs'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // Mock pptxgenjs for tests when not installed
      'pptxgenjs': path.resolve(__dirname, './__tests__/mocks/pptxgenjs.ts'),
    },
  },
});
