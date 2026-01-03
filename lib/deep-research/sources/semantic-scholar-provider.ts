// Deep Research - Semantic Scholar Search Provider
// Uses Semantic Scholar API for comprehensive academic search

import { BaseProvider, type ProviderConfig, registerProvider } from './base-provider';
import type { SearchQuery, SearchResults, SearchPaper, SearchFilters } from './types';
import type { Author } from '../types';

/**
 * Semantic Scholar API response types
 */
interface S2SearchResponse {
  total: number;
  offset: number;
  next?: number;
  data: S2Paper[];
}

interface S2Paper {
  paperId: string;
  title: string;
  abstract?: string;
  year?: number;
  authors: Array<{ authorId: string; name: string }>;
  venue?: string;
  publicationVenue?: {
    name?: string;
    type?: string;
  };
  journal?: {
    name?: string;
    volume?: string;
    pages?: string;
  };
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
    MAG?: string;
    CorpusId?: string;
  };
  url?: string;
  openAccessPdf?: {
    url: string;
    status: string;
  };
  citationCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  fieldsOfStudy?: string[];
  s2FieldsOfStudy?: Array<{ category: string; source: string }>;
  publicationTypes?: string[];
  publicationDate?: string;
}

/**
 * Semantic Scholar Provider Configuration
 */
const S2_CONFIG: ProviderConfig = {
  name: 'semantic_scholar',
  displayName: 'Semantic Scholar',
  description: 'AI-powered research tool for scientific literature from Allen Institute for AI',
  baseUrl: 'https://api.semanticscholar.org/graph/v1',
  apiKey: process.env.SEMANTIC_SCHOLAR_API_KEY,
  rateLimit: {
    requestsPerSecond: process.env.SEMANTIC_SCHOLAR_API_KEY ? 10 : 1,
    burstLimit: process.env.SEMANTIC_SCHOLAR_API_KEY ? 30 : 5,
  },
  timeout: 30000,
  retryAttempts: 3,
};

/**
 * Fields to request from Semantic Scholar API
 */
const PAPER_FIELDS = [
  'paperId',
  'title',
  'abstract',
  'year',
  'authors',
  'venue',
  'publicationVenue',
  'journal',
  'externalIds',
  'url',
  'openAccessPdf',
  'citationCount',
  'influentialCitationCount',
  'isOpenAccess',
  'fieldsOfStudy',
  'publicationTypes',
  'publicationDate',
].join(',');

/**
 * Semantic Scholar Search Provider
 *
 * Provides access to over 200 million academic papers with
 * AI-powered relevance ranking and citation analysis.
 */
export class SemanticScholarProvider extends BaseProvider {
  constructor() {
    super(S2_CONFIG);
  }

  /**
   * Get request headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }
    return headers;
  }

  /**
   * Check if Semantic Scholar API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/paper/CorpusId:215416146?fields=title`;
      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Search Semantic Scholar for papers
   */
  async search(query: SearchQuery): Promise<SearchResults> {
    const searchUrl = new URL(`${this.config.baseUrl}/paper/search`);
    searchUrl.searchParams.set('query', query.query);
    searchUrl.searchParams.set('limit', Math.min(query.limit, 100).toString());
    searchUrl.searchParams.set('offset', query.offset.toString());
    searchUrl.searchParams.set('fields', PAPER_FIELDS);

    // Apply year filter
    if (query.filters.dateRange) {
      searchUrl.searchParams.set('year',
        `${query.filters.dateRange.start.getFullYear()}-${query.filters.dateRange.end.getFullYear()}`
      );
    }

    // Apply open access filter
    if (query.filters.openAccessOnly) {
      searchUrl.searchParams.set('openAccessPdf', '');
    }

    // Apply field of study filter (approximate article type matching)
    if (query.filters.articleTypes?.includes('clinical_trial')) {
      searchUrl.searchParams.set('fieldsOfStudy', 'Medicine');
    }

    const response = await this.fetchWithRetry(searchUrl.toString(), {
      headers: this.getHeaders(),
    });

    const data: S2SearchResponse = await response.json();

    return {
      source: 'semantic_scholar',
      query: query.query,
      totalResults: data.total,
      papers: data.data.map((paper, index) => this.toSearchPaper(paper, index)),
      nextOffset: data.next,
      executedAt: new Date(),
    };
  }

  /**
   * Get detailed paper information
   */
  async getPaperDetails(paperId: string): Promise<SearchPaper | null> {
    try {
      const url = `${this.config.baseUrl}/paper/${paperId}?fields=${PAPER_FIELDS}`;
      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;

      const paper: S2Paper = await response.json();
      return this.toSearchPaper(paper, 0);
    } catch {
      return null;
    }
  }

  /**
   * Get papers that cite this paper
   */
  async getCitingPapers(paperId: string, limit: number = 20): Promise<SearchPaper[]> {
    try {
      const url = `${this.config.baseUrl}/paper/${paperId}/citations?fields=${PAPER_FIELDS}&limit=${limit}`;
      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];

      const data: { data: Array<{ citingPaper: S2Paper }> } = await response.json();
      return data.data
        .filter(item => item.citingPaper)
        .map((item, index) => this.toSearchPaper(item.citingPaper, index));
    } catch {
      return [];
    }
  }

  /**
   * Get papers referenced by this paper
   */
  async getReferencedPapers(paperId: string, limit: number = 20): Promise<SearchPaper[]> {
    try {
      const url = `${this.config.baseUrl}/paper/${paperId}/references?fields=${PAPER_FIELDS}&limit=${limit}`;
      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];

      const data: { data: Array<{ citedPaper: S2Paper }> } = await response.json();
      return data.data
        .filter(item => item.citedPaper)
        .map((item, index) => this.toSearchPaper(item.citedPaper, index));
    } catch {
      return [];
    }
  }

  /**
   * Batch lookup papers by their IDs
   */
  async batchGetPapers(paperIds: string[]): Promise<SearchPaper[]> {
    if (paperIds.length === 0) return [];

    try {
      const url = `${this.config.baseUrl}/paper/batch?fields=${PAPER_FIELDS}`;
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ ids: paperIds }),
      });

      if (!response.ok) return [];

      const papers: S2Paper[] = await response.json();
      return papers
        .filter(p => p !== null)
        .map((paper, index) => this.toSearchPaper(paper, index));
    } catch {
      return [];
    }
  }

  /**
   * Search by DOI, ArXiv ID, or other external ID
   */
  async searchByExternalId(
    idType: 'DOI' | 'ArXiv' | 'PubMed' | 'MAG' | 'CorpusId',
    id: string
  ): Promise<SearchPaper | null> {
    const prefixedId = idType === 'CorpusId' ? `CorpusId:${id}` : `${idType}:${id}`;
    return this.getPaperDetails(prefixedId);
  }

  /**
   * Get recommendations based on a paper
   */
  async getRecommendations(paperId: string, limit: number = 10): Promise<SearchPaper[]> {
    try {
      const url = `${this.config.baseUrl}/recommendations/v1/papers/forpaper/${paperId}?limit=${limit}&fields=${PAPER_FIELDS}`;
      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];

      const data: { recommendedPapers: S2Paper[] } = await response.json();
      return data.recommendedPapers.map((paper, index) => this.toSearchPaper(paper, index));
    } catch {
      return [];
    }
  }

  /**
   * Convert S2Paper to SearchPaper
   */
  private toSearchPaper(paper: S2Paper, index: number): SearchPaper {
    return {
      id: this.generatePaperId(paper.paperId),
      source: 'semantic_scholar',
      externalId: paper.paperId,
      title: paper.title,
      authors: paper.authors.map(a => ({
        name: a.name,
        ...this.parseAuthorName(a.name),
      })),
      year: paper.year || this.extractYear(paper.publicationDate),
      abstract: paper.abstract,
      journal: paper.journal?.name || paper.venue || paper.publicationVenue?.name,
      volume: paper.journal?.volume,
      pages: paper.journal?.pages,
      doi: paper.externalIds?.DOI,
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      pdfUrl: paper.openAccessPdf?.url,
      openAccess: paper.isOpenAccess || !!paper.openAccessPdf,
      citationCount: paper.citationCount,
      relevanceScore: this.calculateRelevanceScore(paper, index),
    };
  }

  /**
   * Extract year from publication date string
   */
  private extractYear(dateStr?: string): number {
    if (!dateStr) return new Date().getFullYear();
    const match = dateStr.match(/^\d{4}/);
    return match ? parseInt(match[0]) : new Date().getFullYear();
  }

  /**
   * Calculate relevance score based on multiple factors
   */
  private calculateRelevanceScore(paper: S2Paper, index: number): number {
    let score = 1 - (index * 0.02); // Base from position

    // Boost for influential citations
    if (paper.influentialCitationCount && paper.influentialCitationCount > 10) {
      score += 0.1;
    }

    // Boost for high citation count
    if (paper.citationCount && paper.citationCount > 100) {
      score += 0.05;
    }

    // Boost for open access
    if (paper.isOpenAccess) {
      score += 0.02;
    }

    return Math.min(1, Math.max(0, score));
  }
}

// Create and register the provider
const semanticScholarProvider = new SemanticScholarProvider();
registerProvider(semanticScholarProvider);

export { semanticScholarProvider };
