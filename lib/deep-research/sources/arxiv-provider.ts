// Deep Research - arXiv Search Provider
// Uses arXiv API for preprint and open access research

import { BaseProvider, type ProviderConfig, registerProvider } from './base-provider';
import type { SearchQuery, SearchResults, SearchPaper } from './types';
import type { Author } from '../types';

/**
 * arXiv Provider Configuration
 */
const ARXIV_CONFIG: ProviderConfig = {
  name: 'arxiv',
  displayName: 'arXiv',
  description: 'Open access archive for scholarly preprints in physics, mathematics, computer science, and more',
  baseUrl: 'http://export.arxiv.org/api/query',
  rateLimit: {
    requestsPerSecond: 1, // arXiv is strict about rate limiting
    burstLimit: 3,
  },
  timeout: 30000,
  retryAttempts: 3,
};

/**
 * arXiv category mapping for article types
 */
const CATEGORY_MAPPING: Record<string, string[]> = {
  'cs': ['cs.AI', 'cs.CL', 'cs.CV', 'cs.LG', 'cs.NE'],
  'physics': ['physics', 'hep-ph', 'hep-th', 'cond-mat'],
  'math': ['math.CO', 'math.PR', 'math.ST', 'stat.ML'],
  'biology': ['q-bio', 'q-bio.GN', 'q-bio.NC'],
  'medicine': ['q-bio.QM', 'physics.med-ph'],
};

/**
 * arXiv Search Provider
 *
 * Provides access to over 2 million preprints across
 * physics, mathematics, computer science, and related fields.
 */
export class ArxivProvider extends BaseProvider {
  constructor() {
    super(ARXIV_CONFIG);
  }

  /**
   * Check if arXiv API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}?search_query=all:test&max_results=1`;
      const response = await this.fetchWithRetry(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Search arXiv for papers
   */
  async search(query: SearchQuery): Promise<SearchResults> {
    const searchQuery = this.buildSearchQuery(query);

    const url = new URL(this.config.baseUrl);
    url.searchParams.set('search_query', searchQuery);
    url.searchParams.set('start', query.offset.toString());
    url.searchParams.set('max_results', Math.min(query.limit, 100).toString());
    url.searchParams.set('sortBy', 'relevance');
    url.searchParams.set('sortOrder', 'descending');

    const response = await this.fetchWithRetry(url.toString());
    const xmlText = await response.text();

    const { papers, totalResults } = this.parseAtomFeed(xmlText);

    return {
      source: 'arxiv',
      query: query.query,
      totalResults,
      papers: papers.map((paper, index) => ({ ...paper, relevanceScore: 1 - (index * 0.02) })),
      nextOffset: query.offset + papers.length < totalResults
        ? query.offset + papers.length
        : undefined,
      executedAt: new Date(),
    };
  }

  /**
   * Get detailed paper information by arXiv ID
   */
  async getPaperDetails(arxivId: string): Promise<SearchPaper | null> {
    try {
      // Clean the arXiv ID
      const cleanId = arxivId.replace(/^arxiv:/i, '').replace(/v\d+$/, '');

      const url = `${this.config.baseUrl}?id_list=${cleanId}`;
      const response = await this.fetchWithRetry(url);
      const xmlText = await response.text();

      const { papers } = this.parseAtomFeed(xmlText);
      return papers.length > 0 ? papers[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Get papers that cite this paper (via Semantic Scholar)
   * Note: arXiv doesn't have a native citation API
   */
  async getCitingPapers(_arxivId: string, _limit: number = 20): Promise<SearchPaper[]> {
    // arXiv doesn't provide citation data
    // This would need to be implemented via Semantic Scholar or other service
    return [];
  }

  /**
   * Get papers referenced by this paper
   * Note: arXiv doesn't have a native reference API
   */
  async getReferencedPapers(_arxivId: string, _limit: number = 20): Promise<SearchPaper[]> {
    // arXiv doesn't provide reference data directly
    return [];
  }

  /**
   * Build arXiv search query with filters
   */
  private buildSearchQuery(query: SearchQuery): string {
    let searchTerms: string[] = [];

    // Main query - search in title and abstract
    const cleanQuery = query.query.replace(/[()]/g, ''); // Remove parentheses
    searchTerms.push(`all:${cleanQuery}`);

    // Date filter (arXiv uses submittedDate)
    if (query.filters.dateRange) {
      const startDate = this.formatDate(query.filters.dateRange.start);
      const endDate = this.formatDate(query.filters.dateRange.end);
      searchTerms.push(`submittedDate:[${startDate} TO ${endDate}]`);
    }

    return searchTerms.join(' AND ');
  }

  /**
   * Format date for arXiv query
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}0000`;
  }

  /**
   * Parse arXiv Atom feed response
   */
  private parseAtomFeed(xml: string): { papers: SearchPaper[]; totalResults: number } {
    const papers: SearchPaper[] = [];

    // Extract total results
    const totalMatch = xml.match(/<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/);
    const totalResults = totalMatch ? parseInt(totalMatch[1]) : 0;

    // Parse each entry
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const paper = this.parseEntry(match[1]);
      if (paper) {
        papers.push(paper);
      }
    }

    return { papers, totalResults };
  }

  /**
   * Parse a single Atom entry
   */
  private parseEntry(xml: string): SearchPaper | null {
    try {
      // ID (arXiv ID)
      const idMatch = xml.match(/<id>(.*?)<\/id>/);
      const fullId = idMatch?.[1] || '';
      const arxivId = fullId.replace('http://arxiv.org/abs/', '');
      if (!arxivId) return null;

      // Title
      const titleMatch = xml.match(/<title>([\s\S]*?)<\/title>/);
      const title = this.cleanText(titleMatch?.[1] || 'Untitled');

      // Abstract (summary)
      const summaryMatch = xml.match(/<summary>([\s\S]*?)<\/summary>/);
      const abstract = this.cleanText(summaryMatch?.[1] || '');

      // Published date
      const publishedMatch = xml.match(/<published>(.*?)<\/published>/);
      const publishedDate = publishedMatch?.[1] || '';
      const year = this.extractYear(publishedDate);

      // Authors
      const authors = this.parseAuthors(xml);

      // DOI (if available)
      const doiMatch = xml.match(/<arxiv:doi>(.*?)<\/arxiv:doi>/);
      const doi = doiMatch?.[1];

      // Categories
      const categories: string[] = [];
      const categoryRegex = /<category term="([^"]+)"/g;
      let catMatch;
      while ((catMatch = categoryRegex.exec(xml)) !== null) {
        categories.push(catMatch[1]);
      }

      // PDF link
      const pdfMatch = xml.match(/<link[^>]+title="pdf"[^>]+href="([^"]+)"/);
      const pdfUrl = pdfMatch?.[1];

      // Primary category as journal equivalent
      const primaryCategory = categories[0] || '';

      return {
        id: this.generatePaperId(arxivId),
        source: 'arxiv',
        externalId: arxivId,
        title,
        authors,
        year,
        abstract,
        journal: `arXiv:${primaryCategory}`,
        doi,
        url: `https://arxiv.org/abs/${arxivId}`,
        pdfUrl: pdfUrl || `https://arxiv.org/pdf/${arxivId}.pdf`,
        openAccess: true, // All arXiv papers are open access
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse authors from entry XML
   */
  private parseAuthors(xml: string): Author[] {
    const authors: Author[] = [];
    const authorRegex = /<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g;

    let match;
    while ((match = authorRegex.exec(xml)) !== null) {
      const name = this.cleanText(match[1]);
      authors.push({
        name,
        ...this.parseAuthorName(name),
      });
    }

    return authors;
  }

  /**
   * Extract year from ISO date string
   */
  private extractYear(dateStr: string): number {
    const match = dateStr.match(/^(\d{4})/);
    return match ? parseInt(match[1]) : new Date().getFullYear();
  }

  /**
   * Clean text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Create and register the provider
const arxivProvider = new ArxivProvider();
registerProvider(arxivProvider);

export { arxivProvider };
