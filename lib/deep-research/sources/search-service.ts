// Deep Research - Unified Search Service
// Orchestrates searches across multiple academic database providers

import type { DatabaseSource } from '../types';
import type { SearchQuery, SearchResults, SearchPaper, SearchFilters } from './types';
import {
  providerRegistry,
  getProvider,
  getAvailableProviders,
  type BaseProvider,
} from './base-provider';

// Import and register all providers
import './pubmed-provider';
import './semantic-scholar-provider';
import './arxiv-provider';
import './crossref-provider';
import './europe-pmc-provider';

/**
 * Search configuration for the unified service
 */
export interface UnifiedSearchConfig {
  sources: DatabaseSource[];
  query: string;
  filters: SearchFilters;
  maxResultsPerSource: number;
  deduplicateResults: boolean;
  parallelSearches: boolean;
  timeout?: number;
}

/**
 * Unified search result combining multiple sources
 */
export interface UnifiedSearchResults {
  query: string;
  totalResults: number;
  papers: SearchPaper[];
  sourceResults: Map<DatabaseSource, SearchResults>;
  errors: Map<DatabaseSource, string>;
  executedAt: Date;
  duration: number; // ms
}

/**
 * Deduplication result
 */
interface DeduplicationResult {
  unique: SearchPaper[];
  duplicateGroups: Map<string, SearchPaper[]>;
}

/**
 * Unified Search Service
 *
 * Orchestrates searches across multiple academic database providers,
 * with support for parallel execution, deduplication, and error handling.
 */
export class SearchService {
  private defaultConfig: Partial<UnifiedSearchConfig> = {
    maxResultsPerSource: 25,
    deduplicateResults: true,
    parallelSearches: true,
    timeout: 60000,
  };

  /**
   * Get all registered providers
   */
  getProviders(): Map<DatabaseSource, BaseProvider> {
    return providerRegistry;
  }

  /**
   * Get available (working) providers
   */
  async getAvailableProviders(): Promise<BaseProvider[]> {
    return getAvailableProviders();
  }

  /**
   * Check if a specific provider is available
   */
  async isProviderAvailable(source: DatabaseSource): Promise<boolean> {
    const provider = getProvider(source);
    if (!provider) return false;
    return provider.isAvailable();
  }

  /**
   * Execute a unified search across multiple sources
   */
  async search(config: UnifiedSearchConfig): Promise<UnifiedSearchResults> {
    const startTime = Date.now();
    const mergedConfig = { ...this.defaultConfig, ...config };

    const sourceResults = new Map<DatabaseSource, SearchResults>();
    const errors = new Map<DatabaseSource, string>();

    // Build search queries for each source
    const searchPromises = mergedConfig.sources.map(async (source) => {
      const provider = getProvider(source);
      if (!provider) {
        errors.set(source, `Provider not found for ${source}`);
        return;
      }

      try {
        const query: SearchQuery = {
          query: mergedConfig.query,
          source,
          filters: mergedConfig.filters,
          limit: mergedConfig.maxResultsPerSource,
          offset: 0,
        };

        const results = await this.searchWithTimeout(
          provider,
          query,
          mergedConfig.timeout || 60000
        );

        sourceResults.set(source, results);
      } catch (error) {
        errors.set(source, error instanceof Error ? error.message : 'Unknown error');
      }
    });

    // Execute searches (parallel or sequential)
    if (mergedConfig.parallelSearches) {
      await Promise.all(searchPromises);
    } else {
      for (const promise of searchPromises) {
        await promise;
      }
    }

    // Combine all papers
    let allPapers: SearchPaper[] = [];
    for (const results of sourceResults.values()) {
      allPapers.push(...results.papers);
    }

    // Deduplicate if enabled
    if (mergedConfig.deduplicateResults) {
      const deduped = this.deduplicatePapers(allPapers);
      allPapers = deduped.unique;
    }

    // Calculate total
    let totalResults = 0;
    for (const results of sourceResults.values()) {
      totalResults += results.totalResults;
    }

    return {
      query: mergedConfig.query,
      totalResults,
      papers: allPapers,
      sourceResults,
      errors,
      executedAt: new Date(),
      duration: Date.now() - startTime,
    };
  }

  /**
   * Search a single source
   */
  async searchSource(
    source: DatabaseSource,
    query: string,
    filters: SearchFilters = {},
    limit: number = 25,
    offset: number = 0
  ): Promise<SearchResults> {
    const provider = getProvider(source);
    if (!provider) {
      throw new Error(`Provider not found for ${source}`);
    }

    return provider.search({
      query,
      source,
      filters,
      limit,
      offset,
    });
  }

  /**
   * Get paper details from appropriate provider
   */
  async getPaperDetails(
    source: DatabaseSource,
    externalId: string
  ): Promise<SearchPaper | null> {
    const provider = getProvider(source);
    if (!provider) return null;
    return provider.getPaperDetails(externalId);
  }

  /**
   * Get citing papers from appropriate provider
   */
  async getCitingPapers(
    source: DatabaseSource,
    externalId: string,
    limit: number = 20
  ): Promise<SearchPaper[]> {
    const provider = getProvider(source);
    if (!provider) return [];
    return provider.getCitingPapers(externalId, limit);
  }

  /**
   * Get referenced papers from appropriate provider
   */
  async getReferencedPapers(
    source: DatabaseSource,
    externalId: string,
    limit: number = 20
  ): Promise<SearchPaper[]> {
    const provider = getProvider(source);
    if (!provider) return [];
    return provider.getReferencedPapers(externalId, limit);
  }

  /**
   * Search with timeout
   */
  private async searchWithTimeout(
    provider: BaseProvider,
    query: SearchQuery,
    timeout: number
  ): Promise<SearchResults> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Search timeout after ${timeout}ms`));
      }, timeout);

      provider.search(query)
        .then(results => {
          clearTimeout(timeoutId);
          resolve(results);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Deduplicate papers across sources
   */
  private deduplicatePapers(papers: SearchPaper[]): DeduplicationResult {
    const unique: SearchPaper[] = [];
    const duplicateGroups = new Map<string, SearchPaper[]>();
    const seen = new Map<string, SearchPaper>();

    for (const paper of papers) {
      // Generate deduplication keys
      const keys = this.generateDeduplicationKeys(paper);

      // Check if we've seen any of these keys
      let existingPaper: SearchPaper | undefined;
      let matchedKey: string | undefined;

      for (const key of keys) {
        if (seen.has(key)) {
          existingPaper = seen.get(key);
          matchedKey = key;
          break;
        }
      }

      if (existingPaper && matchedKey) {
        // This is a duplicate
        const group = duplicateGroups.get(matchedKey) || [existingPaper];
        group.push(paper);
        duplicateGroups.set(matchedKey, group);

        // Keep the paper with more information
        const better = this.selectBetterPaper(existingPaper, paper);
        if (better !== existingPaper) {
          // Replace the existing paper
          const idx = unique.indexOf(existingPaper);
          if (idx !== -1) {
            unique[idx] = better;
          }
          // Update the seen map
          for (const key of keys) {
            seen.set(key, better);
          }
        }
      } else {
        // This is unique
        unique.push(paper);
        for (const key of keys) {
          seen.set(key, paper);
        }
      }
    }

    return { unique, duplicateGroups };
  }

  /**
   * Generate keys for deduplication
   */
  private generateDeduplicationKeys(paper: SearchPaper): string[] {
    const keys: string[] = [];

    // DOI is the strongest identifier
    if (paper.doi) {
      keys.push(`doi:${paper.doi.toLowerCase()}`);
    }

    // Title + year combination
    if (paper.title && paper.year) {
      const normalizedTitle = this.normalizeTitle(paper.title);
      keys.push(`title:${normalizedTitle}:${paper.year}`);
    }

    // First author + title
    if (paper.authors.length > 0 && paper.title) {
      const firstAuthor = paper.authors[0].lastName?.toLowerCase() ||
                          paper.authors[0].name.split(' ').pop()?.toLowerCase();
      const normalizedTitle = this.normalizeTitle(paper.title);
      if (firstAuthor) {
        keys.push(`author:${firstAuthor}:${normalizedTitle.substring(0, 50)}`);
      }
    }

    return keys;
  }

  /**
   * Normalize title for comparison
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Select the better paper when duplicates are found
   */
  private selectBetterPaper(a: SearchPaper, b: SearchPaper): SearchPaper {
    let scoreA = 0;
    let scoreB = 0;

    // Prefer paper with abstract
    if (a.abstract) scoreA += 5;
    if (b.abstract) scoreB += 5;

    // Prefer paper with DOI
    if (a.doi) scoreA += 3;
    if (b.doi) scoreB += 3;

    // Prefer paper with more authors
    scoreA += a.authors.length;
    scoreB += b.authors.length;

    // Prefer paper with citation count
    if (a.citationCount !== undefined) scoreA += 2;
    if (b.citationCount !== undefined) scoreB += 2;

    // Prefer paper with PDF URL
    if (a.pdfUrl) scoreA += 2;
    if (b.pdfUrl) scoreB += 2;

    // Prefer open access
    if (a.openAccess) scoreA += 1;
    if (b.openAccess) scoreB += 1;

    return scoreA >= scoreB ? a : b;
  }

  /**
   * Rank papers by relevance and quality
   */
  rankPapers(papers: SearchPaper[], query: string): SearchPaper[] {
    return papers.sort((a, b) => {
      const scoreA = this.calculateRankingScore(a, query);
      const scoreB = this.calculateRankingScore(b, query);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate ranking score for a paper
   */
  private calculateRankingScore(paper: SearchPaper, query: string): number {
    let score = paper.relevanceScore || 0.5;

    // Boost for title match
    const queryTerms = query.toLowerCase().split(/\s+/);
    const titleLower = paper.title.toLowerCase();
    const titleMatches = queryTerms.filter(t => titleLower.includes(t)).length;
    score += (titleMatches / queryTerms.length) * 0.3;

    // Boost for abstract match
    if (paper.abstract) {
      const abstractLower = paper.abstract.toLowerCase();
      const abstractMatches = queryTerms.filter(t => abstractLower.includes(t)).length;
      score += (abstractMatches / queryTerms.length) * 0.1;
    }

    // Boost for citations
    if (paper.citationCount) {
      score += Math.min(0.2, paper.citationCount / 1000);
    }

    // Boost for recency
    const age = new Date().getFullYear() - paper.year;
    if (age <= 2) score += 0.1;
    else if (age <= 5) score += 0.05;

    // Boost for open access
    if (paper.openAccess) score += 0.05;

    // Boost for PDF availability
    if (paper.pdfUrl) score += 0.05;

    return Math.min(1, score);
  }
}

// Export singleton instance
export const searchService = new SearchService();
