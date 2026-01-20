/**
 * Supabase SDK Mocks
 *
 * Lightweight mocks for Supabase clients used in tests.
 */

import { vi } from 'vitest';
import { mockAuth, mockDatabase, MockTimestamp } from './supabase';

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

export const mockSupabaseClient = {
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

export function setupSupabaseMocks() {
  vi.mock('@supabase/ssr', () => ({
    createBrowserClient: vi.fn(() => mockSupabaseClient),
  }));

  vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
  }));
}
