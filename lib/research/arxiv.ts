/**
 * arXiv API Client
 *
 * Searches arXiv.org for preprints in physics, mathematics,
 * computer science, quantitative biology, and more.
 *
 * API Documentation: https://arxiv.org/help/api
 * Rate Limit: 1 request per second (we add delay)
 */

import {
  type SearchQuery,
  type SearchResponse,
  type SearchResult,
  type Author,
  type DatabaseClient,
  normalizeTitle,
} from './types';

// arXiv category mappings
export const ARXIV_CATEGORIES = {
  // Physics
  'physics': 'physics',
  'hep-ph': 'hep-ph',      // High Energy Physics - Phenomenology
  'hep-th': 'hep-th',      // High Energy Physics - Theory
  'hep-ex': 'hep-ex',      // High Energy Physics - Experiment
  'cond-mat': 'cond-mat',  // Condensed Matter
  'quant-ph': 'quant-ph',  // Quantum Physics
  'gr-qc': 'gr-qc',        // General Relativity
  'nucl-th': 'nucl-th',    // Nuclear Theory

  // Astrophysics
  'astro-ph': 'astro-ph',

  // Mathematics
  'math': 'math',

  // Computer Science
  'cs': 'cs',
  'cs.AI': 'cs.AI',        // Artificial Intelligence
  'cs.LG': 'cs.LG',        // Machine Learning
  'cs.CV': 'cs.CV',        // Computer Vision
  'cs.CL': 'cs.CL',        // Computation and Language
  'cs.DS': 'cs.DS',        // Data Structures

  // Quantitative Biology
  'q-bio': 'q-bio',

  // Statistics
  'stat': 'stat',
  'stat.ML': 'stat.ML',    // Machine Learning

  // Economics
  'econ': 'econ',

  // Electrical Engineering
  'eess': 'eess',
} as const;

export type ArxivCategory = keyof typeof ARXIV_CATEGORIES;

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  authors: { name: string }[];
  published: string;
  updated: string;
  links: { href: string; type?: string; title?: string }[];
  categories: string[];
  doi?: string;
}

/**
 * Parse arXiv Atom feed XML
 */
function parseAtomFeed(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = [];

  // Match all entry elements
  const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);

  for (const match of entryMatches) {
    const entryXml = match[1];

    // Extract ID (arXiv ID from URL)
    const idMatch = entryXml.match(/<id>([^<]+)<\/id>/);
    const fullId = idMatch ? idMatch[1] : '';
    const arxivId = fullId.replace('http://arxiv.org/abs/', '');

    // Extract title (clean whitespace)
    const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

    // Extract summary/abstract
    const summaryMatch = entryXml.match(/<summary>([^<]+)<\/summary>/);
    const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';

    // Extract authors
    const authors: { name: string }[] = [];
    const authorMatches = entryXml.matchAll(/<author>\s*<name>([^<]+)<\/name>/g);
    for (const authorMatch of authorMatches) {
      authors.push({ name: authorMatch[1].trim() });
    }

    // Extract dates
    const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/);
    const published = publishedMatch ? publishedMatch[1] : '';

    const updatedMatch = entryXml.match(/<updated>([^<]+)<\/updated>/);
    const updated = updatedMatch ? updatedMatch[1] : '';

    // Extract links
    const links: { href: string; type?: string; title?: string }[] = [];
    const linkMatches = entryXml.matchAll(/<link\s+([^>]+)\/>/g);
    for (const linkMatch of linkMatches) {
      const attrs = linkMatch[1];
      const hrefMatch = attrs.match(/href="([^"]+)"/);
      const typeMatch = attrs.match(/type="([^"]+)"/);
      const titleMatch = attrs.match(/title="([^"]+)"/);

      if (hrefMatch) {
        links.push({
          href: hrefMatch[1],
          type: typeMatch?.[1],
          title: titleMatch?.[1],
        });
      }
    }

    // Extract categories
    const categories: string[] = [];
    const categoryMatches = entryXml.matchAll(/<category[^>]*term="([^"]+)"/g);
    for (const catMatch of categoryMatches) {
      categories.push(catMatch[1]);
    }

    // Extract DOI if present
    const doiMatch = entryXml.match(/<arxiv:doi[^>]*>([^<]+)<\/arxiv:doi>/);
    const doi = doiMatch ? doiMatch[1] : undefined;

    entries.push({
      id: arxivId,
      title,
      summary,
      authors,
      published,
      updated,
      links,
      categories,
      doi,
    });
  }

  return entries;
}

/**
 * Convert arXiv entry to SearchResult
 */
function toSearchResult(entry: ArxivEntry): SearchResult {
  const authors: Author[] = entry.authors.map((a) => {
    const parts = a.name.split(' ');
    return {
      name: a.name,
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1],
    };
  });

  // Find PDF link
  const pdfLink = entry.links.find((l) => l.title === 'pdf' || l.type === 'application/pdf');
  const abstractLink = entry.links.find((l) => l.type === 'text/html') || entry.links[0];

  // Extract year from published date
  const year = entry.published ? new Date(entry.published).getFullYear() : new Date().getFullYear();

  return {
    id: entry.id,
    source: 'arxiv',
    title: entry.title,
    authors,
    abstract: entry.summary,
    year,
    doi: entry.doi,
    arxivId: entry.id,
    url: abstractLink?.href || `https://arxiv.org/abs/${entry.id}`,
    pdfUrl: pdfLink?.href || `https://arxiv.org/pdf/${entry.id}.pdf`,
    openAccess: true, // arXiv is always open access
    categories: entry.categories,
    normalizedTitle: normalizeTitle(entry.title),
  };
}

/**
 * Build arXiv API query string
 */
function buildQuery(query: SearchQuery): string {
  const parts: string[] = [];

  // Main search text
  if (query.text) {
    if (query.fields?.includes('title')) {
      parts.push(`ti:${query.text}`);
    } else if (query.fields?.includes('abstract')) {
      parts.push(`abs:${query.text}`);
    } else if (query.fields?.includes('author')) {
      parts.push(`au:${query.text}`);
    } else {
      // Default: search all fields
      parts.push(`all:${query.text}`);
    }
  }

  // Category filter
  if (query.categories && query.categories.length > 0) {
    const catQuery = query.categories.map((c) => `cat:${c}`).join(' OR ');
    parts.push(`(${catQuery})`);
  }

  return parts.join(' AND ');
}

/**
 * Search arXiv
 */
export async function searchArxiv(query: SearchQuery): Promise<SearchResponse> {
  const startTime = Date.now();

  const searchQuery = buildQuery(query);
  const maxResults = query.limit || 20;
  const start = query.offset || 0;

  const url = new URL('http://export.arxiv.org/api/query');
  url.searchParams.set('search_query', searchQuery);
  url.searchParams.set('start', String(start));
  url.searchParams.set('max_results', String(maxResults));
  url.searchParams.set('sortBy', 'relevance');
  url.searchParams.set('sortOrder', 'descending');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AcademicWritingPlatform/1.0 (mailto:contact@academicwriting.app)',
      },
    });

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const entries = parseAtomFeed(xml);

    // Filter by year if specified
    let results = entries.map(toSearchResult);

    if (query.yearRange) {
      results = results.filter((r) => {
        if (query.yearRange?.start && r.year < query.yearRange.start) return false;
        if (query.yearRange?.end && r.year > query.yearRange.end) return false;
        return true;
      });
    }

    // Extract total from feed (if available)
    const totalMatch = xml.match(/<opensearch:totalResults>(\d+)<\/opensearch:totalResults>/);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : results.length;

    return {
      results,
      total,
      source: 'arxiv',
      query,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('arXiv search error:', error);
    throw error;
  }
}

/**
 * Get arXiv paper by ID
 */
export async function getArxivById(arxivId: string): Promise<SearchResult | null> {
  const url = new URL('http://export.arxiv.org/api/query');
  url.searchParams.set('id_list', arxivId);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const xml = await response.text();
    const entries = parseAtomFeed(xml);

    return entries.length > 0 ? toSearchResult(entries[0]) : null;
  } catch {
    return null;
  }
}

/**
 * arXiv Database Client
 */
export const arxivClient: DatabaseClient = {
  id: 'arxiv',
  name: 'arXiv',

  async search(query: SearchQuery): Promise<SearchResponse> {
    return searchArxiv(query);
  },

  async getById(id: string): Promise<SearchResult | null> {
    return getArxivById(id);
  },

  supportsFullText(): boolean {
    return false; // arXiv API doesn't support full-text search
  },

  supportsCitationCount(): boolean {
    return false; // arXiv doesn't provide citation counts
  },

  supportsRelatedPapers(): boolean {
    return false;
  },
};

export default arxivClient;
