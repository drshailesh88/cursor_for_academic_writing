/**
 * PubMed Client using @cyanheads/pubmed-mcp-server
 *
 * High-reliability PubMed integration with enterprise-grade error handling
 */

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
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

export interface PubMedSearchOptions {
  query: string;
  maxResults?: number;
  sort?: 'relevance' | 'date' | 'pub_date';
  dateRange?: {
    startYear: number;
    endYear: number;
  };
  filters?: {
    articleTypes?: string[];
    journals?: string[];
    authors?: string[];
  };
}

/**
 * Search PubMed for articles
 */
export async function searchPubMed(options: PubMedSearchOptions): Promise<PubMedArticle[]> {
  const { query, maxResults = 20, sort = 'relevance', dateRange } = options;

  try {
    // Build search query with filters
    let searchQuery = query;

    if (dateRange) {
      searchQuery += ` AND ${dateRange.startYear}:${dateRange.endYear}[dp]`;
    }

    // Use NCBI E-utilities API
    const searchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
    searchUrl.searchParams.set('db', 'pubmed');
    searchUrl.searchParams.set('term', searchQuery);
    searchUrl.searchParams.set('retmax', maxResults.toString());
    searchUrl.searchParams.set('sort', sort);
    searchUrl.searchParams.set('retmode', 'json');

    // Add API key if available (10 req/sec vs 3 req/sec without)
    if (process.env.PUBMED_API_KEY) {
      searchUrl.searchParams.set('api_key', process.env.PUBMED_API_KEY);
    }

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      throw new Error(`PubMed API error: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const pmids = searchData.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      return [];
    }

    // Fetch detailed article information
    const articles = await fetchArticleDetails(pmids);
    return articles;
  } catch (error) {
    console.error('PubMed search error:', error);
    throw new Error(`Failed to search PubMed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch detailed information for multiple articles
 */
async function fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
  try {
    const fetchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi');
    fetchUrl.searchParams.set('db', 'pubmed');
    fetchUrl.searchParams.set('id', pmids.join(','));
    fetchUrl.searchParams.set('retmode', 'xml');

    if (process.env.PUBMED_API_KEY) {
      fetchUrl.searchParams.set('api_key', process.env.PUBMED_API_KEY);
    }

    const response = await fetch(fetchUrl.toString());

    if (!response.ok) {
      throw new Error(`PubMed fetch error: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const articles = parseXML(xmlText);

    return articles;
  } catch (error) {
    console.error('PubMed fetch error:', error);
    return [];
  }
}

/**
 * Parse PubMed XML response
 */
function parseXML(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  try {
    // Simple XML parsing (in production, use xml2js or similar)
    const articleMatches = xml.matchAll(/<PubmedArticle>(.*?)<\/PubmedArticle>/gs);

    for (const match of articleMatches) {
      const articleXml = match[1];

      // Extract PMID
      const pmidMatch = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : '';

      // Extract title
      const titleMatch = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : '';

      // Extract abstract
      const abstractMatch = articleXml.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/);
      const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '') : '';

      // Extract journal
      const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
      const journal = journalMatch ? journalMatch[1] : '';

      // Extract year
      const yearMatch = articleXml.match(/<PubDate>.*?<Year>(.*?)<\/Year>/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

      // Extract authors
      const authors: string[] = [];
      const authorMatches = articleXml.matchAll(/<Author[^>]*>.*?<LastName>(.*?)<\/LastName>.*?<Initials>(.*?)<\/Initials>.*?<\/Author>/gs);
      for (const authorMatch of authorMatches) {
        authors.push(`${authorMatch[1]} ${authorMatch[2]}`);
      }

      // Extract DOI
      const doiMatch = articleXml.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
      const doi = doiMatch ? doiMatch[1] : undefined;

      // Extract PMCID
      const pmcidMatch = articleXml.match(/<ArticleId IdType="pmc">(.*?)<\/ArticleId>/);
      const pmcid = pmcidMatch ? pmcidMatch[1] : undefined;

      articles.push({
        pmid,
        title,
        authors,
        journal,
        year,
        abstract,
        doi,
        pmcid,
      });
    }
  } catch (error) {
    console.error('XML parsing error:', error);
  }

  return articles;
}

/**
 * Get a single article by PMID
 */
export async function getArticleByPMID(pmid: string): Promise<PubMedArticle | null> {
  const articles = await fetchArticleDetails([pmid]);
  return articles.length > 0 ? articles[0] : null;
}

/**
 * Convert PubMed article to author-year citation
 */
export function articleToCitation(article: PubMedArticle): string {
  if (article.authors.length === 0) return `(Unknown, ${article.year})`;

  const firstAuthor = article.authors[0].split(' ')[0]; // Get last name

  if (article.authors.length === 1) {
    return `(${firstAuthor}, ${article.year})`;
  } else if (article.authors.length === 2) {
    const secondAuthor = article.authors[1].split(' ')[0];
    return `(${firstAuthor} & ${secondAuthor}, ${article.year})`;
  } else {
    return `(${firstAuthor} et al., ${article.year})`;
  }
}
