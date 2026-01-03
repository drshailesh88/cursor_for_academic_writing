// Deep Research - CrossRef Search Provider
// Uses CrossRef API for DOI-based metadata and citation data

import { BaseProvider, type ProviderConfig, registerProvider } from './base-provider';
import type { SearchQuery, SearchResults, SearchPaper } from './types';
import type { Author } from '../types';

/**
 * CrossRef API response types
 */
interface CrossRefResponse {
  status: string;
  'message-type': string;
  'message-version': string;
  message: {
    'total-results': number;
    items: CrossRefWork[];
    'items-per-page': number;
    query: {
      'start-index': number;
      'search-terms': string;
    };
  };
}

interface CrossRefWork {
  DOI: string;
  title?: string[];
  author?: Array<{
    given?: string;
    family?: string;
    name?: string;
    affiliation?: Array<{ name: string }>;
    ORCID?: string;
  }>;
  'container-title'?: string[];
  published?: {
    'date-parts': number[][];
  };
  'published-print'?: {
    'date-parts': number[][];
  };
  'published-online'?: {
    'date-parts': number[][];
  };
  abstract?: string;
  type?: string;
  volume?: string;
  issue?: string;
  page?: string;
  URL?: string;
  'is-referenced-by-count'?: number;
  'references-count'?: number;
  license?: Array<{
    URL: string;
    'content-version': string;
    'delay-in-days': number;
  }>;
  link?: Array<{
    URL: string;
    'content-type': string;
    'content-version': string;
  }>;
  subject?: string[];
}

/**
 * CrossRef Provider Configuration
 */
const CROSSREF_CONFIG: ProviderConfig = {
  name: 'crossref',
  displayName: 'CrossRef',
  description: 'Official DOI registration agency with comprehensive scholarly metadata',
  baseUrl: 'https://api.crossref.org',
  rateLimit: {
    requestsPerSecond: 20, // Polite pool with mailto
    burstLimit: 50,
  },
  timeout: 30000,
  retryAttempts: 3,
};

/**
 * CrossRef Search Provider
 *
 * Provides access to over 130 million metadata records
 * with DOI resolution and citation counts.
 */
export class CrossRefProvider extends BaseProvider {
  private mailto: string;

  constructor() {
    super(CROSSREF_CONFIG);
    // Using mailto gets access to polite pool with higher rate limits
    this.mailto = process.env.CROSSREF_MAILTO || 'research@example.com';
  }

  /**
   * Get request headers with polite pool identification
   */
  private getHeaders(): HeadersInit {
    return {
      'User-Agent': `DeepResearch/1.0 (${this.mailto}; mailto:${this.mailto})`,
    };
  }

  /**
   * Check if CrossRef API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/works?rows=1&mailto=${this.mailto}`;
      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Search CrossRef for works
   */
  async search(query: SearchQuery): Promise<SearchResults> {
    const url = new URL(`${this.config.baseUrl}/works`);

    // Query parameters
    url.searchParams.set('query', query.query);
    url.searchParams.set('rows', Math.min(query.limit, 100).toString());
    url.searchParams.set('offset', query.offset.toString());
    url.searchParams.set('mailto', this.mailto);

    // Sort by relevance (default) or publication date
    url.searchParams.set('sort', 'relevance');

    // Date filter
    if (query.filters.dateRange) {
      const fromDate = this.formatDate(query.filters.dateRange.start);
      const untilDate = this.formatDate(query.filters.dateRange.end);
      url.searchParams.set('filter', `from-pub-date:${fromDate},until-pub-date:${untilDate}`);
    }

    // Type filter
    if (query.filters.articleTypes?.length) {
      const types = this.mapArticleTypes(query.filters.articleTypes);
      if (types.length > 0) {
        const existingFilter = url.searchParams.get('filter') || '';
        const typeFilter = `type:${types.join(',type:')}`;
        url.searchParams.set('filter', existingFilter ? `${existingFilter},${typeFilter}` : typeFilter);
      }
    }

    const response = await this.fetchWithRetry(url.toString(), {
      headers: this.getHeaders(),
    });

    const data: CrossRefResponse = await response.json();

    return {
      source: 'crossref',
      query: query.query,
      totalResults: data.message['total-results'],
      papers: data.message.items.map((work, index) => this.toSearchPaper(work, index)),
      nextOffset: query.offset + data.message.items.length < data.message['total-results']
        ? query.offset + data.message.items.length
        : undefined,
      executedAt: new Date(),
    };
  }

  /**
   * Get paper details by DOI
   */
  async getPaperDetails(doi: string): Promise<SearchPaper | null> {
    try {
      // Clean DOI
      const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '');

      const url = `${this.config.baseUrl}/works/${encodeURIComponent(cleanDoi)}?mailto=${this.mailto}`;
      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;

      const data: { message: CrossRefWork } = await response.json();
      return this.toSearchPaper(data.message, 0);
    } catch {
      return null;
    }
  }

  /**
   * Get papers that cite this paper
   */
  async getCitingPapers(doi: string, limit: number = 20): Promise<SearchPaper[]> {
    try {
      const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '');

      // Search for papers that reference this DOI
      const url = new URL(`${this.config.baseUrl}/works`);
      url.searchParams.set('filter', `references:${cleanDoi}`);
      url.searchParams.set('rows', limit.toString());
      url.searchParams.set('mailto', this.mailto);

      const response = await this.fetchWithRetry(url.toString(), {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];

      const data: CrossRefResponse = await response.json();
      return data.message.items.map((work, index) => this.toSearchPaper(work, index));
    } catch {
      return [];
    }
  }

  /**
   * Get papers referenced by this paper
   */
  async getReferencedPapers(doi: string, limit: number = 20): Promise<SearchPaper[]> {
    try {
      const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '');

      // Get the work with reference data
      const url = `${this.config.baseUrl}/works/${encodeURIComponent(cleanDoi)}?mailto=${this.mailto}`;
      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];

      const data: { message: CrossRefWork & { reference?: Array<{ DOI?: string }> } } = await response.json();

      // Extract DOIs from references
      const refDois = (data.message.reference || [])
        .filter(ref => ref.DOI)
        .map(ref => ref.DOI!)
        .slice(0, limit);

      if (refDois.length === 0) return [];

      // Fetch each referenced paper
      const papers: SearchPaper[] = [];
      for (const refDoi of refDois) {
        const paper = await this.getPaperDetails(refDoi);
        if (paper) papers.push(paper);
      }

      return papers;
    } catch {
      return [];
    }
  }

  /**
   * Map article types to CrossRef types
   */
  private mapArticleTypes(types: string[]): string[] {
    const mapping: Record<string, string> = {
      'research_article': 'journal-article',
      'review': 'journal-article', // CrossRef doesn't distinguish review articles
      'meta_analysis': 'journal-article',
      'systematic_review': 'journal-article',
      'clinical_trial': 'journal-article',
      'case_report': 'journal-article',
      'preprint': 'posted-content',
    };

    return [...new Set(types.map(t => mapping[t]).filter(Boolean))];
  }

  /**
   * Format date for CrossRef filter
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert CrossRefWork to SearchPaper
   */
  private toSearchPaper(work: CrossRefWork, index: number): SearchPaper {
    return {
      id: this.generatePaperId(work.DOI),
      source: 'crossref',
      externalId: work.DOI,
      title: work.title?.[0] || 'Untitled',
      authors: this.parseAuthors(work.author || []),
      year: this.extractYear(work),
      abstract: work.abstract ? this.cleanAbstract(work.abstract) : undefined,
      journal: work['container-title']?.[0],
      volume: work.volume,
      issue: work.issue,
      pages: work.page,
      doi: work.DOI,
      url: work.URL || `https://doi.org/${work.DOI}`,
      pdfUrl: this.extractPdfUrl(work),
      openAccess: this.isOpenAccess(work),
      citationCount: work['is-referenced-by-count'],
      relevanceScore: 1 - (index * 0.02),
    };
  }

  /**
   * Parse authors from CrossRef format
   */
  private parseAuthors(authors: CrossRefWork['author']): Author[] {
    if (!authors) return [];

    return authors.map(author => {
      if (author.name) {
        return {
          name: author.name,
          ...this.parseAuthorName(author.name),
        };
      }

      const name = [author.given, author.family].filter(Boolean).join(' ');
      return {
        name,
        firstName: author.given,
        lastName: author.family,
        orcid: author.ORCID,
        affiliation: author.affiliation?.[0]?.name,
      };
    });
  }

  /**
   * Extract year from CrossRef date fields
   */
  private extractYear(work: CrossRefWork): number {
    const dateParts = work.published?.['date-parts']?.[0] ||
                      work['published-print']?.['date-parts']?.[0] ||
                      work['published-online']?.['date-parts']?.[0];

    if (dateParts && dateParts[0]) {
      return dateParts[0];
    }

    return new Date().getFullYear();
  }

  /**
   * Clean abstract text (remove JATS tags if present)
   */
  private cleanAbstract(abstract: string): string {
    return abstract
      .replace(/<jats:[^>]+>/g, '')
      .replace(/<\/jats:[^>]+>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract PDF URL from work links
   */
  private extractPdfUrl(work: CrossRefWork): string | undefined {
    const pdfLink = work.link?.find(l =>
      l['content-type'] === 'application/pdf' ||
      l.URL?.includes('.pdf')
    );
    return pdfLink?.URL;
  }

  /**
   * Check if work is open access
   */
  private isOpenAccess(work: CrossRefWork): boolean {
    // Check for open access license
    const hasOpenLicense = work.license?.some(l =>
      l.URL?.includes('creativecommons.org') ||
      l['delay-in-days'] === 0
    );

    return !!hasOpenLicense;
  }
}

// Create and register the provider
const crossrefProvider = new CrossRefProvider();
registerProvider(crossrefProvider);

export { crossrefProvider };
