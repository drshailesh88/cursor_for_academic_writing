// Response Cache (Supabase)

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { Citation, CacheEntry } from './types';

const CACHE_TTL_HOURS = 24;
const MAX_CACHE_ENTRIES_PER_USER = 100;

export function generateCacheKey(query: string, paperIds: string[]): string {
  const normalizedQuery = query.toLowerCase().trim();
  const sortedPaperIds = [...paperIds].sort();
  const input = `${normalizedQuery}:${sortedPaperIds.join(',')}`;

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `cache_${Math.abs(hash).toString(16)}`;
}

export async function getCachedResponse(
  userId: string,
  query: string,
  paperIds: string[]
): Promise<{ response: string; citations: Citation[] } | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const cacheKey = generateCacheKey(query, paperIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('rag_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) {
      return null;
    }

    const cacheRow = data as {
      id: string;
      expires_at: string | null;
      hit_count: number | null;
      response: string;
      citations: unknown;
    };

    const expiresAt = cacheRow.expires_at ? new Date(cacheRow.expires_at) : null;
    if (expiresAt && new Date() > expiresAt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('rag_cache').delete().eq('id', cacheRow.id);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('rag_cache')
      .update({ hit_count: (cacheRow.hit_count || 0) + 1 })
      .eq('id', cacheRow.id)
      .then(() => {})
      .catch(() => {});

    return {
      response: cacheRow.response,
      citations: (cacheRow.citations as Citation[]) || [],
    };
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export async function setCachedResponse(
  userId: string,
  query: string,
  paperIds: string[],
  response: string,
  citations: Citation[]
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    const cacheKey = generateCacheKey(query, paperIds);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('rag_cache')
      .upsert({
        user_id: userId,
        cache_key: cacheKey,
        query,
        paper_ids: paperIds,
        response,
        citations,
        hit_count: 0,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id,cache_key' });

    if (error) {
      console.error('Cache write error:', error);
    }

    cleanupOldEntries(userId).catch(() => {});
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

async function cleanupOldEntries(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('rag_cache')
      .select('id, expires_at, hit_count')
      .eq('user_id', userId);

    if (error || !data) {
      return;
    }

    if (data.length <= MAX_CACHE_ENTRIES_PER_USER) {
      return;
    }

    type CacheEntryRow = { id: string; expires_at: string | null; hit_count: number | null };
    const entries = (data as CacheEntryRow[]).map((row) => ({
      id: row.id,
      expiresAt: row.expires_at ? new Date(row.expires_at) : new Date(0),
      hitCount: row.hit_count || 0,
    }));

    entries.sort((a, b) => {
      const timeDiff = a.expiresAt.getTime() - b.expiresAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.hitCount - b.hitCount;
    });

    const toDelete = entries.slice(0, entries.length - MAX_CACHE_ENTRIES_PER_USER);
    if (toDelete.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('rag_cache').delete().in('id', toDelete.map((e) => e.id));
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

export async function invalidatePaperCache(
  userId: string,
  paperIds: string[]
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('rag_cache')
      .select('id, paper_ids')
      .eq('user_id', userId);

    if (error || !data) {
      return;
    }

    type CachePaperRow = { id: string; paper_ids: string[] | null };
    const toDelete = (data as CachePaperRow[])
      .filter((row) => {
        const cached = row.paper_ids || [];
        return paperIds.some((id) => cached.includes(id));
      })
      .map((row) => row.id);

    if (toDelete.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('rag_cache').delete().in('id', toDelete);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

export async function clearUserCache(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('rag_cache').delete().eq('user_id', userId);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

export async function getCacheStats(userId: string): Promise<{
  totalEntries: number;
  totalHits: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  try {
    const supabase = getSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('rag_cache')
      .select('created_at, hit_count')
      .eq('user_id', userId);

    if (error || !data) {
      return {
        totalEntries: 0,
        totalHits: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }

    let totalHits = 0;
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;

    type CacheStatsRow = { created_at: string | null; hit_count: number | null };
    (data as CacheStatsRow[]).forEach((row) => {
      totalHits += row.hit_count || 0;
      const createdAt = row.created_at ? new Date(row.created_at) : null;
      if (createdAt) {
        if (!oldestEntry || createdAt < oldestEntry) oldestEntry = createdAt;
        if (!newestEntry || createdAt > newestEntry) newestEntry = createdAt;
      }
    });

    return {
      totalEntries: data.length,
      totalHits,
      oldestEntry,
      newestEntry,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return {
      totalEntries: 0,
      totalHits: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }
}

