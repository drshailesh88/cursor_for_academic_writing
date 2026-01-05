/**
 * Deep Research Utilities
 *
 * Helper functions for deduplication, scoring, and data processing.
 */

import type { SearchResult } from '../types';
import { normalizeTitle } from '../types';

/**
 * Deduplicate sources across multiple searches
 */
export function deduplicateAcrossSources(sources: SearchResult[]): {
  deduplicated: SearchResult[];
  duplicateCount: number;
  deduplicationMap: Map<string, string[]>;
} {
  const seen = new Map<string, SearchResult>();
  const deduplicationMap = new Map<string, string[]>();

  for (const source of sources) {
    let key: string | null = null;

    // Try DOI first (most reliable)
    if (source.doi) {
      key = `doi:${source.doi.toLowerCase()}`;
    }
    // Try PMID
    else if (source.pmid) {
      key = `pmid:${source.pmid}`;
    }
    // Try arXiv ID
    else if (source.arxivId) {
      key = `arxiv:${source.arxivId.toLowerCase()}`;
    }
    // Fall back to normalized title
    else {
      const normalized = source.normalizedTitle || normalizeTitle(source.title);
      if (normalized.length > 20) {
        key = `title:${normalized}`;
      }
    }

    // If we found a deduplication key
    if (key) {
      if (seen.has(key)) {
        // Record the duplicate
        const existing = deduplicationMap.get(key) || [];
        existing.push(source.id);
        deduplicationMap.set(key, existing);

        // Merge with existing entry
        const existingSource = seen.get(key)!;
        seen.set(key, mergeSearchResults(existingSource, source));
      } else {
        // First time seeing this source
        seen.set(key, source);
        deduplicationMap.set(key, [source.id]);
      }
    } else {
      // No good deduplication key, keep as-is
      const uniqueKey = `unique:${source.source}:${source.id}`;
      seen.set(uniqueKey, source);
      deduplicationMap.set(uniqueKey, [source.id]);
    }
  }

  const deduplicated = Array.from(seen.values());

  return {
    deduplicated,
    duplicateCount: sources.length - deduplicated.length,
    deduplicationMap,
  };
}

/**
 * Merge two search results, preferring more complete data
 */
function mergeSearchResults(a: SearchResult, b: SearchResult): SearchResult {
  return {
    ...a,
    // Prefer non-empty values
    abstract: a.abstract || b.abstract,
    doi: a.doi || b.doi,
    pmid: a.pmid || b.pmid,
    pmcid: a.pmcid || b.pmcid,
    arxivId: a.arxivId || b.arxivId,
    pdfUrl: a.pdfUrl || b.pdfUrl,
    // Prefer higher citation count
    citationCount: Math.max(a.citationCount || 0, b.citationCount || 0) || undefined,
    // Prefer more detailed metadata
    journal: a.journal || b.journal,
    venue: a.venue || b.venue,
    volume: a.volume || b.volume,
    issue: a.issue || b.issue,
    pages: a.pages || b.pages,
    // Combine keywords and categories
    keywords: [...(a.keywords || []), ...(b.keywords || [])],
    categories: [...(a.categories || []), ...(b.categories || [])],
    // Prefer open access
    openAccess: a.openAccess || b.openAccess,
  };
}

/**
 * Score source relevance to a query
 */
export function scoreRelevance(source: SearchResult, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  const title = source.title.toLowerCase();
  const abstract = source.abstract.toLowerCase();

  let score = 0;

  // Title matches (highest weight)
  for (const term of queryTerms) {
    if (title.includes(term)) {
      score += 3;
    }
  }

  // Abstract matches
  for (const term of queryTerms) {
    if (abstract.includes(term)) {
      score += 1;
    }
  }

  // Citation count bonus (logarithmic scale)
  if (source.citationCount) {
    score += Math.log10(source.citationCount + 1);
  }

  // Recency bonus
  const currentYear = new Date().getFullYear();
  const age = currentYear - source.year;
  if (age <= 3) {
    score += 2;
  } else if (age <= 5) {
    score += 1;
  }

  // Open access bonus
  if (source.openAccess) {
    score += 0.5;
  }

  return score;
}

/**
 * Rank sources by relevance
 */
export function rankSources(
  sources: SearchResult[],
  query: string
): SearchResult[] {
  return sources
    .map((source) => ({
      source,
      score: scoreRelevance(source, query),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.source);
}

/**
 * Filter sources by minimum quality criteria
 */
export function filterByQuality(
  sources: SearchResult[],
  minCitations: number = 5,
  minYear?: number
): SearchResult[] {
  return sources.filter((source) => {
    // Citation count filter
    if (source.citationCount !== undefined && source.citationCount < minCitations) {
      return false;
    }

    // Year filter
    if (minYear && source.year < minYear) {
      return false;
    }

    // Must have abstract
    if (!source.abstract || source.abstract.length < 100) {
      return false;
    }

    return true;
  });
}

/**
 * Group sources by year
 */
export function groupByYear(sources: SearchResult[]): Map<number, SearchResult[]> {
  const grouped = new Map<number, SearchResult[]>();

  for (const source of sources) {
    const existing = grouped.get(source.year) || [];
    existing.push(source);
    grouped.set(source.year, existing);
  }

  return grouped;
}

/**
 * Calculate distribution statistics
 */
export function calculateStats(sources: SearchResult[]): {
  total: number;
  bySource: Record<string, number>;
  byYear: Record<number, number>;
  avgCitations: number;
  openAccessPercent: number;
  dateRange: { start: number; end: number };
} {
  const bySource: Record<string, number> = {};
  const byYear: Record<number, number> = {};
  let totalCitations = 0;
  let citationCount = 0;
  let openAccessCount = 0;

  for (const source of sources) {
    // Count by source
    bySource[source.source] = (bySource[source.source] || 0) + 1;

    // Count by year
    byYear[source.year] = (byYear[source.year] || 0) + 1;

    // Citations
    if (source.citationCount !== undefined) {
      totalCitations += source.citationCount;
      citationCount++;
    }

    // Open access
    if (source.openAccess) {
      openAccessCount++;
    }
  }

  const years = sources.map((s) => s.year);
  const dateRange = {
    start: Math.min(...years),
    end: Math.max(...years),
  };

  return {
    total: sources.length,
    bySource,
    byYear,
    avgCitations: citationCount > 0 ? totalCitations / citationCount : 0,
    openAccessPercent: (openAccessCount / sources.length) * 100,
    dateRange,
  };
}
