// Deep Research - Source Search Types

import type { DatabaseSource, ArticleType, Author } from '../types';

export interface SearchQuery {
  query: string;
  source: DatabaseSource;
  filters: SearchFilters;
  limit: number;
  offset: number;
}

export interface SearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  articleTypes?: ArticleType[];
  languages?: string[];
  openAccessOnly?: boolean;
  minCitations?: number;
}

export interface SearchResults {
  source: DatabaseSource;
  query: string;
  totalResults: number;
  papers: SearchPaper[];
  nextOffset?: number;
  executedAt: Date;
}

export interface SearchPaper {
  id: string;
  source: DatabaseSource;
  externalId: string; // PMID, arXiv ID, etc.

  // Core metadata
  title: string;
  authors: Author[];
  year: number;
  abstract?: string;

  // Publication info
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;

  // Access
  url?: string;
  pdfUrl?: string;
  openAccess: boolean;

  // Metrics
  citationCount?: number;

  // Relevance
  relevanceScore?: number;
}

export interface SearchProvider {
  name: DatabaseSource;
  displayName: string;
  description: string;

  // Check if provider is available
  isAvailable(): Promise<boolean>;

  // Execute search
  search(query: SearchQuery): Promise<SearchResults>;

  // Get paper details
  getPaperDetails(externalId: string): Promise<SearchPaper | null>;

  // Get citing papers
  getCitingPapers(externalId: string, limit?: number): Promise<SearchPaper[]>;

  // Get referenced papers
  getReferencedPapers(externalId: string, limit?: number): Promise<SearchPaper[]>;
}
