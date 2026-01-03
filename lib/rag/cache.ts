// Response Cache
// Uses Firestore for persistent caching of RAG responses
// Reduces costs by avoiding repeated LLM calls for similar queries

import { db } from '@/lib/firebase/client';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { Citation, CacheEntry } from './types';
import crypto from 'crypto';

const CACHE_COLLECTION = 'rag_cache';
const CACHE_TTL_HOURS = 24; // Cache entries expire after 24 hours
const MAX_CACHE_ENTRIES_PER_USER = 100;

/**
 * Generate a cache key from query and paper IDs
 * Uses SHA-256 hash for consistent, collision-resistant keys
 */
export function generateCacheKey(query: string, paperIds: string[]): string {
  const normalizedQuery = query.toLowerCase().trim();
  const sortedPaperIds = [...paperIds].sort();
  const input = `${normalizedQuery}:${sortedPaperIds.join(',')}`;

  // Use a simple hash for browser compatibility
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `cache_${Math.abs(hash).toString(16)}`;
}

/**
 * Check if a cached response exists and is valid
 */
export async function getCachedResponse(
  userId: string,
  query: string,
  paperIds: string[]
): Promise<{ response: string; citations: Citation[] } | null> {
  try {
    const cacheKey = generateCacheKey(query, paperIds);
    const cacheRef = doc(db, 'users', userId, CACHE_COLLECTION, cacheKey);
    const cacheDoc = await getDoc(cacheRef);

    if (!cacheDoc.exists()) {
      return null;
    }

    const data = cacheDoc.data() as CacheEntry & {
      createdAt: Timestamp;
      expiresAt: Timestamp;
    };

    // Check if expired
    const now = new Date();
    const expiresAt = data.expiresAt.toDate();

    if (now > expiresAt) {
      // Delete expired entry
      await deleteDoc(cacheRef);
      return null;
    }

    // Update hit count (fire and forget)
    setDoc(
      cacheRef,
      { hitCount: (data.hitCount || 0) + 1 },
      { merge: true }
    ).catch(() => {}); // Ignore errors

    return {
      response: data.response,
      citations: data.citations,
    };
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Store a response in the cache
 */
export async function setCachedResponse(
  userId: string,
  query: string,
  paperIds: string[],
  response: string,
  citations: Citation[]
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(query, paperIds);
    const cacheRef = doc(db, 'users', userId, CACHE_COLLECTION, cacheKey);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000);

    const cacheEntry: Omit<CacheEntry, 'createdAt' | 'expiresAt'> & {
      createdAt: Timestamp;
      expiresAt: Timestamp;
    } = {
      key: cacheKey,
      query,
      paperIds,
      response,
      citations,
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
      hitCount: 0,
    };

    await setDoc(cacheRef, cacheEntry);

    // Clean up old entries if needed (fire and forget)
    cleanupOldEntries(userId).catch(() => {});
  } catch (error) {
    console.error('Cache write error:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Clean up old cache entries to stay within limits
 */
async function cleanupOldEntries(userId: string): Promise<void> {
  try {
    const cacheRef = collection(db, 'users', userId, CACHE_COLLECTION);
    const q = query(cacheRef);
    const snapshot = await getDocs(q);

    if (snapshot.size <= MAX_CACHE_ENTRIES_PER_USER) {
      return;
    }

    // Get all entries with their expiry times
    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ref: doc.ref,
      expiresAt: (doc.data() as { expiresAt: Timestamp }).expiresAt?.toDate() || new Date(0),
      hitCount: (doc.data() as { hitCount: number }).hitCount || 0,
    }));

    // Sort by expiry time (oldest first), then by hit count (lowest first)
    entries.sort((a, b) => {
      const timeDiff = a.expiresAt.getTime() - b.expiresAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.hitCount - b.hitCount;
    });

    // Delete oldest entries to get under the limit
    const toDelete = entries.slice(0, entries.length - MAX_CACHE_ENTRIES_PER_USER);
    await Promise.all(toDelete.map((entry) => deleteDoc(entry.ref)));
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

/**
 * Invalidate cache for specific papers
 * Call this when paper content is updated
 */
export async function invalidatePaperCache(
  userId: string,
  paperIds: string[]
): Promise<void> {
  try {
    const cacheRef = collection(db, 'users', userId, CACHE_COLLECTION);
    const snapshot = await getDocs(cacheRef);

    const toDelete: Promise<void>[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as CacheEntry;
      // Check if any of the paper IDs are in this cache entry
      const hasOverlap = paperIds.some((id) => data.paperIds?.includes(id));
      if (hasOverlap) {
        toDelete.push(deleteDoc(doc.ref));
      }
    });

    await Promise.all(toDelete);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Clear all cache for a user
 */
export async function clearUserCache(userId: string): Promise<void> {
  try {
    const cacheRef = collection(db, 'users', userId, CACHE_COLLECTION);
    const snapshot = await getDocs(cacheRef);

    await Promise.all(snapshot.docs.map((doc) => deleteDoc(doc.ref)));
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Get cache statistics for a user
 */
export async function getCacheStats(userId: string): Promise<{
  totalEntries: number;
  totalHits: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  try {
    const cacheRef = collection(db, 'users', userId, CACHE_COLLECTION);
    const snapshot = await getDocs(cacheRef);

    let totalHits = 0;
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as CacheEntry & { createdAt: Timestamp };
      totalHits += data.hitCount || 0;

      const createdAt = data.createdAt?.toDate();
      if (createdAt) {
        if (!oldestEntry || createdAt < oldestEntry) {
          oldestEntry = createdAt;
        }
        if (!newestEntry || createdAt > newestEntry) {
          newestEntry = createdAt;
        }
      }
    });

    return {
      totalEntries: snapshot.size,
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
