// Deep Research - Europe PMC Search Provider
// Uses Europe PMC API for open access biomedical literature

import { BaseProvider, type ProviderConfig, registerProvider } from './base-provider';
import type { SearchQuery, SearchResults, SearchPaper } from './types';
import type { Author } from '../types';

/**
 * Europe PMC API response types
 */
interface EuropePMCResponse {
  version: string;
  hitCount: number;
  nextCursorMark?: string;
  resultList: {
    result: EuropePMCArticle[];
  };
}

interface EuropePMCArticle {
  id: string;
  source: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  authorString?: string;
  authorList?: {
    author: Array<{
      firstName?: string;
      lastName?: string;
      fullName?: string;
      affiliation?: string;
    }>;
  };
  journalInfo?: {
    journal?: {
      title?: string;
      medlineAbbreviation?: string;
      isoabbreviation?: string;
    };
    volume?: string;
    issue?: string;
  };
  pubYear?: string;
  firstPublicationDate?: string;
  abstractText?: string;
  pageInfo?: string;
  citedByCount?: number;
  isOpenAccess?: string;
  inEPMC?: string;
  inPMC?: string;
  hasPDF?: string;
  hasBook?: string;
  hasSuppl?: string;
  hasTextMinedTerms?: string;
  hasDbCrossReferences?: string;
  hasLabsLinks?: string;
  license?: string;
  pubTypeList?: {
    pubType: string[];
  };
  fullTextUrlList?: {
    fullTextUrl: Array<{
      documentStyle: string;
      site: string;
      url: string;
      availability: string;
    }>;
  };
}

/**
 * Europe PMC Provider Configuration
 */
const EPMC_CONFIG: ProviderConfig = {
  name: 'europe_pmc',
  displayName: 'Europe PMC',
  description: 'Open science platform for life sciences literature from EMBL-EBI',
  baseUrl: 'https://www.ebi.ac.uk/europepmc/webservices/rest',
  rateLimit: {
    requestsPerSecond: 10,
    burstLimit: 30,
  },
  timeout: 30000,
  retryAttempts: 3,
};

/**
 * Europe PMC Search Provider
 *
 * Provides access to over 40 million life sciences publications
 * with strong focus on open access and European research.
 */
export class EuropePMCProvider extends BaseProvider {
  constructor() {
    super(EPMC_CONFIG);
  }

  /**
   * Check if Europe PMC API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/search?query=test&format=json&pageSize=1`;
      const response = await this.fetchWithRetry(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Search Europe PMC for articles
   */
  async search(query: SearchQuery): Promise<SearchResults> {
    const searchQuery = this.buildSearchQuery(query);

    const url = new URL(`${this.config.baseUrl}/search`);
    url.searchParams.set('query', searchQuery);
    url.searchParams.set('format', 'json');
    url.searchParams.set('pageSize', Math.min(query.limit, 1000).toString());
    url.searchParams.set('cursorMark', query.offset > 0 ? '*' : '');
    url.searchParams.set('resultType', 'core'); // Get full article details

    // Sort by relevance or date
    url.searchParams.set('sort', 'RELEVANCE desc');

    const response = await this.fetchWithRetry(url.toString());
    const data: EuropePMCResponse = await response.json();

    return {
      source: 'europe_pmc',
      query: query.query,
      totalResults: data.hitCount,
      papers: data.resultList.result.map((article, index) => this.toSearchPaper(article, index)),
      nextOffset: data.nextCursorMark ? query.offset + data.resultList.result.length : undefined,
      executedAt: new Date(),
    };
  }

  /**
   * Get detailed paper information
   */
  async getPaperDetails(id: string): Promise<SearchPaper | null> {
    try {
      // Determine ID type and format query
      let query: string;
      if (id.startsWith('PMC')) {
        query = `PMCID:${id}`;
      } else if (/^\d+$/.test(id)) {
        query = `EXT_ID:${id}`;
      } else {
        query = `DOI:${id}`;
      }

      const url = `${this.config.baseUrl}/search?query=${encodeURIComponent(query)}&format=json&resultType=core`;
      const response = await this.fetchWithRetry(url);

      if (!response.ok) return null;

      const data: EuropePMCResponse = await response.json();
      if (data.resultList.result.length === 0) return null;

      return this.toSearchPaper(data.resultList.result[0], 0);
    } catch {
      return null;
    }
  }

  /**
   * Get papers that cite this paper
   */
  async getCitingPapers(id: string, limit: number = 20): Promise<SearchPaper[]> {
    try {
      // Determine source for citation lookup
      let source = 'MED';
      let lookupId = id;

      if (id.startsWith('PMC')) {
        source = 'PMC';
      }

      const url = `${this.config.baseUrl}/${source}/${lookupId}/citations?format=json&page=1&pageSize=${limit}`;
      const response = await this.fetchWithRetry(url);

      if (!response.ok) return [];

      const data: {
        citationList?: {
          citation: Array<{
            id: string;
            source: string;
            title?: string;
            authorString?: string;
            pubYear?: string;
          }>;
        };
      } = await response.json();

      if (!data.citationList?.citation) return [];

      // Get full details for each citation
      const papers: SearchPaper[] = [];
      for (const citation of data.citationList.citation.slice(0, limit)) {
        const paper = await this.getPaperDetails(citation.id);
        if (paper) papers.push(paper);
      }

      return papers;
    } catch {
      return [];
    }
  }

  /**
   * Get papers referenced by this paper
   */
  async getReferencedPapers(id: string, limit: number = 20): Promise<SearchPaper[]> {
    try {
      let source = 'MED';
      let lookupId = id;

      if (id.startsWith('PMC')) {
        source = 'PMC';
      }

      const url = `${this.config.baseUrl}/${source}/${lookupId}/references?format=json&page=1&pageSize=${limit}`;
      const response = await this.fetchWithRetry(url);

      if (!response.ok) return [];

      const data: {
        referenceList?: {
          reference: Array<{
            id?: string;
            source?: string;
            title?: string;
            authorString?: string;
            pubYear?: string;
          }>;
        };
      } = await response.json();

      if (!data.referenceList?.reference) return [];

      // Get full details for each reference
      const papers: SearchPaper[] = [];
      for (const ref of data.referenceList.reference.slice(0, limit)) {
        if (ref.id) {
          const paper = await this.getPaperDetails(ref.id);
          if (paper) papers.push(paper);
        }
      }

      return papers;
    } catch {
      return [];
    }
  }

  /**
   * Build Europe PMC search query with filters
   */
  private buildSearchQuery(query: SearchQuery): string {
    let searchTerms: string[] = [query.query];

    // Date filter
    if (query.filters.dateRange) {
      const startYear = query.filters.dateRange.start.getFullYear();
      const endYear = query.filters.dateRange.end.getFullYear();
      searchTerms.push(`(PUB_YEAR:[${startYear} TO ${endYear}])`);
    }

    // Open access filter
    if (query.filters.openAccessOnly) {
      searchTerms.push('(OPEN_ACCESS:y)');
    }

    // Article type filters
    if (query.filters.articleTypes?.length) {
      const typeFilters = query.filters.articleTypes.map(type => {
        switch (type) {
          case 'review': return 'PUB_TYPE:review';
          case 'meta_analysis': return 'PUB_TYPE:"meta-analysis"';
          case 'systematic_review': return 'PUB_TYPE:"systematic review"';
          case 'clinical_trial': return 'PUB_TYPE:"clinical trial"';
          case 'case_report': return 'PUB_TYPE:"case reports"';
          default: return '';
        }
      }).filter(Boolean);

      if (typeFilters.length > 0) {
        searchTerms.push(`(${typeFilters.join(' OR ')})`);
      }
    }

    // Language filter
    if (query.filters.languages?.length) {
      const langFilters = query.filters.languages.map(l => `LANG:${l}`);
      searchTerms.push(`(${langFilters.join(' OR ')})`);
    }

    return searchTerms.join(' AND ');
  }

  /**
   * Convert EuropePMCArticle to SearchPaper
   */
  private toSearchPaper(article: EuropePMCArticle, index: number): SearchPaper {
    const id = article.pmid || article.pmcid || article.id;

    return {
      id: this.generatePaperId(id),
      source: 'europe_pmc',
      externalId: id,
      title: article.title,
      authors: this.parseAuthors(article),
      year: this.extractYear(article),
      abstract: article.abstractText,
      journal: article.journalInfo?.journal?.title ||
               article.journalInfo?.journal?.medlineAbbreviation,
      volume: article.journalInfo?.volume,
      issue: article.journalInfo?.issue,
      pages: article.pageInfo,
      doi: article.doi,
      url: this.buildArticleUrl(article),
      pdfUrl: this.extractPdfUrl(article),
      openAccess: article.isOpenAccess === 'Y' || article.inPMC === 'Y',
      citationCount: article.citedByCount,
      relevanceScore: 1 - (index * 0.02),
    };
  }

  /**
   * Parse authors from article
   */
  private parseAuthors(article: EuropePMCArticle): Author[] {
    // Try structured author list first
    if (article.authorList?.author) {
      return article.authorList.author.map(a => ({
        name: a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim(),
        firstName: a.firstName,
        lastName: a.lastName,
        affiliation: a.affiliation,
      }));
    }

    // Fall back to author string
    if (article.authorString) {
      return article.authorString.split(', ').map(name => ({
        name: name.replace(/\.$/, ''),
        ...this.parseAuthorName(name),
      }));
    }

    return [];
  }

  /**
   * Extract publication year
   */
  private extractYear(article: EuropePMCArticle): number {
    if (article.pubYear) {
      return parseInt(article.pubYear);
    }

    if (article.firstPublicationDate) {
      const match = article.firstPublicationDate.match(/^(\d{4})/);
      if (match) return parseInt(match[1]);
    }

    return new Date().getFullYear();
  }

  /**
   * Build article URL
   */
  private buildArticleUrl(article: EuropePMCArticle): string {
    if (article.pmcid) {
      return `https://europepmc.org/article/PMC/${article.pmcid}`;
    }
    if (article.pmid) {
      return `https://europepmc.org/article/MED/${article.pmid}`;
    }
    return `https://europepmc.org/article/${article.source}/${article.id}`;
  }

  /**
   * Extract PDF URL
   */
  private extractPdfUrl(article: EuropePMCArticle): string | undefined {
    if (article.fullTextUrlList?.fullTextUrl) {
      const pdfEntry = article.fullTextUrlList.fullTextUrl.find(
        u => u.documentStyle === 'pdf' && u.availability === 'Open access'
      );
      if (pdfEntry) return pdfEntry.url;
    }

    // Construct PMC PDF URL if available
    if (article.pmcid && (article.isOpenAccess === 'Y' || article.hasPDF === 'Y')) {
      return `https://europepmc.org/backend/ptpmcrender.fcgi?accid=${article.pmcid}&blobtype=pdf`;
    }

    return undefined;
  }
}

// Create and register the provider
const europePMCProvider = new EuropePMCProvider();
registerProvider(europePMCProvider);

export { europePMCProvider };
