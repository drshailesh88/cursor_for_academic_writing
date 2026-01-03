// Deep Research - PubMed Search Provider
// Uses NCBI E-utilities API for PubMed/MEDLINE searches

import { BaseProvider, type ProviderConfig, registerProvider } from './base-provider';
import type { SearchQuery, SearchResults, SearchPaper, SearchFilters } from './types';
import type { Author } from '../types';

/**
 * PubMed API response types
 */
interface ESearchResult {
  esearchresult: {
    count: string;
    retmax: string;
    retstart: string;
    idlist: string[];
    translationset?: Array<{ from: string; to: string }>;
    querytranslation?: string;
  };
}

interface EFetchArticle {
  pmid: string;
  title: string;
  authors: Author[];
  journal: string;
  year: number;
  abstract: string;
  doi?: string;
  pmcid?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  meshTerms?: string[];
  publicationTypes?: string[];
}

/**
 * PubMed Provider Configuration
 */
const PUBMED_CONFIG: ProviderConfig = {
  name: 'pubmed',
  displayName: 'PubMed',
  description: 'MEDLINE database of biomedical literature from the National Library of Medicine',
  baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
  apiKey: process.env.PUBMED_API_KEY,
  rateLimit: {
    requestsPerSecond: process.env.PUBMED_API_KEY ? 10 : 3,
    burstLimit: process.env.PUBMED_API_KEY ? 30 : 10,
  },
  timeout: 30000,
  retryAttempts: 3,
};

/**
 * PubMed Search Provider
 *
 * Provides access to over 35 million citations for biomedical literature
 * through the NCBI E-utilities API.
 */
export class PubMedProvider extends BaseProvider {
  constructor() {
    super(PUBMED_CONFIG);
  }

  /**
   * Check if PubMed API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/einfo.fcgi?db=pubmed&retmode=json`;
      const response = await this.fetchWithRetry(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Search PubMed for articles
   */
  async search(query: SearchQuery): Promise<SearchResults> {
    const searchTerm = this.buildSearchTerm(query.query, query.filters);

    // Step 1: Search for PMIDs
    const searchUrl = new URL(`${this.config.baseUrl}/esearch.fcgi`);
    searchUrl.searchParams.set('db', 'pubmed');
    searchUrl.searchParams.set('term', searchTerm);
    searchUrl.searchParams.set('retmax', query.limit.toString());
    searchUrl.searchParams.set('retstart', query.offset.toString());
    searchUrl.searchParams.set('sort', 'relevance');
    searchUrl.searchParams.set('retmode', 'json');

    if (this.config.apiKey) {
      searchUrl.searchParams.set('api_key', this.config.apiKey);
    }

    const searchResponse = await this.fetchWithRetry(searchUrl.toString());
    const searchData: ESearchResult = await searchResponse.json();

    const pmids = searchData.esearchresult?.idlist || [];
    const totalResults = parseInt(searchData.esearchresult?.count || '0');

    if (pmids.length === 0) {
      return {
        source: 'pubmed',
        query: query.query,
        totalResults: 0,
        papers: [],
        executedAt: new Date(),
      };
    }

    // Step 2: Fetch article details
    const articles = await this.fetchArticleDetails(pmids);

    return {
      source: 'pubmed',
      query: query.query,
      totalResults,
      papers: articles.map((article, index) => this.toSearchPaper(article, index)),
      nextOffset: query.offset + pmids.length < totalResults
        ? query.offset + pmids.length
        : undefined,
      executedAt: new Date(),
    };
  }

  /**
   * Get detailed paper information
   */
  async getPaperDetails(pmid: string): Promise<SearchPaper | null> {
    const articles = await this.fetchArticleDetails([pmid]);
    if (articles.length === 0) return null;
    return this.toSearchPaper(articles[0], 0);
  }

  /**
   * Get papers that cite this paper
   * Uses PubMed's "cited by" feature via elink
   */
  async getCitingPapers(pmid: string, limit: number = 20): Promise<SearchPaper[]> {
    try {
      const linkUrl = new URL(`${this.config.baseUrl}/elink.fcgi`);
      linkUrl.searchParams.set('dbfrom', 'pubmed');
      linkUrl.searchParams.set('db', 'pubmed');
      linkUrl.searchParams.set('id', pmid);
      linkUrl.searchParams.set('linkname', 'pubmed_pubmed_citedin');
      linkUrl.searchParams.set('retmode', 'json');

      if (this.config.apiKey) {
        linkUrl.searchParams.set('api_key', this.config.apiKey);
      }

      const response = await this.fetchWithRetry(linkUrl.toString());
      const data = await response.json();

      const linkedIds = data.linksets?.[0]?.linksetdbs?.[0]?.links || [];
      const limitedIds = linkedIds.slice(0, limit);

      if (limitedIds.length === 0) return [];

      const articles = await this.fetchArticleDetails(limitedIds);
      return articles.map((article, index) => this.toSearchPaper(article, index));
    } catch {
      return [];
    }
  }

  /**
   * Get papers referenced by this paper
   * Uses PubMed's references feature via elink
   */
  async getReferencedPapers(pmid: string, limit: number = 20): Promise<SearchPaper[]> {
    try {
      const linkUrl = new URL(`${this.config.baseUrl}/elink.fcgi`);
      linkUrl.searchParams.set('dbfrom', 'pubmed');
      linkUrl.searchParams.set('db', 'pubmed');
      linkUrl.searchParams.set('id', pmid);
      linkUrl.searchParams.set('linkname', 'pubmed_pubmed_refs');
      linkUrl.searchParams.set('retmode', 'json');

      if (this.config.apiKey) {
        linkUrl.searchParams.set('api_key', this.config.apiKey);
      }

      const response = await this.fetchWithRetry(linkUrl.toString());
      const data = await response.json();

      const linkedIds = data.linksets?.[0]?.linksetdbs?.[0]?.links || [];
      const limitedIds = linkedIds.slice(0, limit);

      if (limitedIds.length === 0) return [];

      const articles = await this.fetchArticleDetails(limitedIds);
      return articles.map((article, index) => this.toSearchPaper(article, index));
    } catch {
      return [];
    }
  }

  /**
   * Build PubMed search term with filters
   */
  private buildSearchTerm(query: string, filters: SearchFilters): string {
    let searchTerm = query;

    // Date range filter
    if (filters.dateRange) {
      const startYear = filters.dateRange.start.getFullYear();
      const endYear = filters.dateRange.end.getFullYear();
      searchTerm += ` AND ${startYear}:${endYear}[dp]`;
    }

    // Article type filters
    if (filters.articleTypes && filters.articleTypes.length > 0) {
      const typeFilters = filters.articleTypes.map(type => {
        switch (type) {
          case 'review': return 'review[pt]';
          case 'meta_analysis': return 'meta-analysis[pt]';
          case 'systematic_review': return 'systematic review[pt]';
          case 'clinical_trial': return 'clinical trial[pt]';
          case 'case_report': return 'case reports[pt]';
          default: return '';
        }
      }).filter(Boolean);

      if (typeFilters.length > 0) {
        searchTerm += ` AND (${typeFilters.join(' OR ')})`;
      }
    }

    // Language filter
    if (filters.languages && filters.languages.length > 0) {
      const langFilter = filters.languages.map(l => `${l}[la]`).join(' OR ');
      searchTerm += ` AND (${langFilter})`;
    }

    // Open access filter
    if (filters.openAccessOnly) {
      searchTerm += ' AND "open access"[filter]';
    }

    return searchTerm;
  }

  /**
   * Fetch detailed article information for PMIDs
   */
  private async fetchArticleDetails(pmids: string[]): Promise<EFetchArticle[]> {
    if (pmids.length === 0) return [];

    const fetchUrl = new URL(`${this.config.baseUrl}/efetch.fcgi`);
    fetchUrl.searchParams.set('db', 'pubmed');
    fetchUrl.searchParams.set('id', pmids.join(','));
    fetchUrl.searchParams.set('retmode', 'xml');

    if (this.config.apiKey) {
      fetchUrl.searchParams.set('api_key', this.config.apiKey);
    }

    const response = await this.fetchWithRetry(fetchUrl.toString());
    const xmlText = await response.text();

    return this.parseArticlesXML(xmlText);
  }

  /**
   * Parse PubMed XML response into article objects
   */
  private parseArticlesXML(xml: string): EFetchArticle[] {
    const articles: EFetchArticle[] = [];

    try {
      // Match each PubmedArticle element
      const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
      let match;

      while ((match = articleRegex.exec(xml)) !== null) {
        const articleXml = match[1];
        const article = this.parseArticleXML(articleXml);
        if (article) {
          articles.push(article);
        }
      }
    } catch (error) {
      console.error('PubMed XML parsing error:', error);
    }

    return articles;
  }

  /**
   * Parse a single article XML
   */
  private parseArticleXML(xml: string): EFetchArticle | null {
    try {
      // PMID
      const pmidMatch = xml.match(/<PMID[^>]*>(.*?)<\/PMID>/);
      const pmid = pmidMatch?.[1] || '';
      if (!pmid) return null;

      // Title
      const titleMatch = xml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
      const title = this.cleanXmlText(titleMatch?.[1] || 'Untitled');

      // Abstract
      const abstractMatch = xml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
      const abstract = this.cleanXmlText(abstractMatch?.[1] || '');

      // Journal
      const journalMatch = xml.match(/<Title>([\s\S]*?)<\/Title>/);
      const journal = this.cleanXmlText(journalMatch?.[1] || '');

      // Year
      const yearMatch = xml.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

      // Authors
      const authors = this.parseAuthors(xml);

      // DOI
      const doiMatch = xml.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
      const doi = doiMatch?.[1];

      // PMCID
      const pmcidMatch = xml.match(/<ArticleId IdType="pmc">(.*?)<\/ArticleId>/);
      const pmcid = pmcidMatch?.[1];

      // Volume, Issue, Pages
      const volumeMatch = xml.match(/<Volume>(.*?)<\/Volume>/);
      const issueMatch = xml.match(/<Issue>(.*?)<\/Issue>/);
      const pagesMatch = xml.match(/<MedlinePgn>(.*?)<\/MedlinePgn>/);

      return {
        pmid,
        title,
        authors,
        journal,
        year,
        abstract,
        doi,
        pmcid,
        volume: volumeMatch?.[1],
        issue: issueMatch?.[1],
        pages: pagesMatch?.[1],
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse authors from article XML
   */
  private parseAuthors(xml: string): Author[] {
    const authors: Author[] = [];
    const authorRegex = /<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?(?:<ForeName>(.*?)<\/ForeName>|<Initials>(.*?)<\/Initials>)[\s\S]*?<\/Author>/g;

    let match;
    while ((match = authorRegex.exec(xml)) !== null) {
      const lastName = match[1];
      const firstName = match[2] || match[3] || '';

      authors.push({
        name: `${firstName} ${lastName}`.trim(),
        firstName: firstName || undefined,
        lastName,
      });
    }

    return authors;
  }

  /**
   * Clean XML text content
   */
  private cleanXmlText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove XML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Convert EFetchArticle to SearchPaper
   */
  private toSearchPaper(article: EFetchArticle, index: number): SearchPaper {
    return {
      id: this.generatePaperId(article.pmid),
      source: 'pubmed',
      externalId: article.pmid,
      title: article.title,
      authors: article.authors,
      year: article.year,
      abstract: article.abstract,
      journal: article.journal,
      volume: article.volume,
      issue: article.issue,
      pages: article.pages,
      doi: article.doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
      pdfUrl: article.pmcid
        ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${article.pmcid}/pdf/`
        : undefined,
      openAccess: !!article.pmcid,
      relevanceScore: 1 - (index * 0.02), // Approximate from position
    };
  }
}

// Create and register the provider
const pubmedProvider = new PubMedProvider();
registerProvider(pubmedProvider);

export { pubmedProvider };
