// Paper Metadata Enrichment
// Enriches paper metadata from external sources: CrossRef, PubMed, OpenAlex, ORCID

import type { PaperAuthor } from '@/lib/firebase/schema';
import { pubmedProvider } from '@/lib/deep-research/sources/pubmed-provider';
import { crossrefProvider } from '@/lib/deep-research/sources/crossref-provider';
import type { EnrichmentResult, EnrichmentSource } from './types';

/**
 * Paper metadata extracted from text/PDF
 */
export interface ExtractedMetadata {
  title: string;
  authors: PaperAuthor[];
  year?: number;
  journal?: string;
  doi?: string;
  pmid?: string;
  abstract?: string;
  keywords?: string[];
}

/**
 * Enriched metadata from external sources
 */
export interface EnrichedMetadata extends ExtractedMetadata {
  citationCount?: number;
  impactFactor?: number;
  openAccess?: boolean;
  meshTerms?: string[];
  references?: string[];
  citedByCount?: number;
  publicationTypes?: string[];
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  pdfUrl?: string;
  enrichmentSources: EnrichmentSource[];
}

/**
 * Extract metadata from paper text and PDF metadata
 * Primary extraction before enrichment
 */
export function extractMetadata(
  text: string,
  pdfMetadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  }
): ExtractedMetadata {
  // Extract title (PDF metadata preferred, fallback to text)
  let title = pdfMetadata?.title?.trim() || '';

  if (!title || title.length < 3) {
    // Try to find title in first few lines
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      // Title heuristics: not too short, not a header, capitalized
      if (line.length > 10 && line.length < 500 && /^[A-Z]/.test(line) && !line.match(/^(abstract|introduction|background)/i)) {
        title = line;
        break;
      }
    }
    if (!title) {
      title = 'Untitled Paper';
    }
  }

  // Extract authors
  const authors = extractAuthorsFromText(text, pdfMetadata?.author);

  // Extract DOI
  const doiMatch = text.match(/(?:doi:?\s*)?10\.\d{4,}\/[^\s,;]+/i);
  const doi = doiMatch ? doiMatch[0].replace(/^doi:?\s*/i, '').trim() : undefined;

  // Extract PMID
  const pmidMatch = text.match(/PMID:?\s*(\d{6,})/i);
  const pmid = pmidMatch ? pmidMatch[1] : undefined;

  // Extract year
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

  // Extract journal
  const journal = extractJournal(text);

  // Extract abstract
  const abstract = extractAbstractText(text);

  // Extract keywords
  const keywords = extractKeywordsFromText(text, pdfMetadata?.keywords);

  return {
    title: title.slice(0, 500),
    authors,
    year,
    journal,
    doi,
    pmid,
    abstract,
    keywords,
  };
}

/**
 * Enrich metadata from CrossRef using DOI
 */
export async function enrichFromCrossRef(doi: string): Promise<EnrichmentResult | null> {
  try {
    const paper = await crossrefProvider.getPaperDetails(doi);
    if (!paper) return null;

    return {
      source: 'crossref',
      doi: paper.doi,
      title: paper.title,
      authors: paper.authors as PaperAuthor[],
      year: paper.year,
      journal: paper.journal,
      abstract: paper.abstract,
      citationCount: paper.citationCount,
      openAccess: paper.openAccess,
    };
  } catch (error) {
    console.error('CrossRef enrichment failed:', error);
    return null;
  }
}

/**
 * Enrich metadata from PubMed using PMID
 */
export async function enrichFromPubMed(pmid: string): Promise<EnrichmentResult | null> {
  try {
    const paper = await pubmedProvider.getPaperDetails(pmid);
    if (!paper) return null;

    // PubMed doesn't provide citation count directly
    // But we can get MeSH terms and publication types
    return {
      source: 'pubmed',
      pmid: paper.externalId,
      doi: paper.doi,
      title: paper.title,
      authors: paper.authors as PaperAuthor[],
      year: paper.year,
      journal: paper.journal,
      abstract: paper.abstract,
      openAccess: paper.openAccess,
      // Note: MeSH terms would need to be extracted from detailed PubMed data
      keywords: [], // Placeholder
    };
  } catch (error) {
    console.error('PubMed enrichment failed:', error);
    return null;
  }
}

/**
 * Enrich metadata from multiple sources
 * Tries DOI first (CrossRef), then PMID (PubMed), then title search
 */
export async function enrichMetadata(
  metadata: ExtractedMetadata
): Promise<EnrichedMetadata> {
  const enrichmentSources: EnrichmentSource[] = [];
  let enriched: Partial<EnrichedMetadata> = { ...metadata };

  // Try CrossRef if we have a DOI
  if (metadata.doi) {
    const crossrefData = await enrichFromCrossRef(metadata.doi);
    if (crossrefData) {
      enrichmentSources.push('crossref');
      enriched = mergeMetadata(enriched, crossrefData);
    }
  }

  // Try PubMed if we have a PMID
  if (metadata.pmid) {
    const pubmedData = await enrichFromPubMed(metadata.pmid);
    if (pubmedData) {
      enrichmentSources.push('pubmed');
      enriched = mergeMetadata(enriched, pubmedData);
    }
  }

  // If no DOI/PMID, try searching by title
  if (!metadata.doi && !metadata.pmid && metadata.title !== 'Untitled Paper') {
    const searchResults = await searchByTitle(metadata.title);
    if (searchResults) {
      enrichmentSources.push(searchResults.source);
      enriched = mergeMetadata(enriched, searchResults);
    }
  }

  return {
    ...enriched,
    enrichmentSources,
  } as EnrichedMetadata;
}

/**
 * Search for paper by title to find DOI/PMID
 */
async function searchByTitle(title: string): Promise<EnrichmentResult | null> {
  try {
    // Try CrossRef first (broader coverage)
    const crossrefResults = await crossrefProvider.search({
      query: title,
      source: 'crossref',
      limit: 1,
      offset: 0,
      filters: {},
    });

    if (crossrefResults.papers.length > 0) {
      const paper = crossrefResults.papers[0];
      // Check if title is similar enough (basic fuzzy matching)
      if (titleSimilarity(title, paper.title) > 0.7) {
        return {
          source: 'crossref',
          doi: paper.doi,
          title: paper.title,
          authors: paper.authors as PaperAuthor[],
          year: paper.year,
          journal: paper.journal,
          abstract: paper.abstract,
          citationCount: paper.citationCount,
          openAccess: paper.openAccess,
        };
      }
    }

    // Try PubMed if CrossRef didn't work
    const pubmedResults = await pubmedProvider.search({
      query: title,
      source: 'pubmed',
      limit: 1,
      offset: 0,
      filters: {},
    });

    if (pubmedResults.papers.length > 0) {
      const paper = pubmedResults.papers[0];
      if (titleSimilarity(title, paper.title) > 0.7) {
        return {
          source: 'pubmed',
          pmid: paper.externalId,
          doi: paper.doi,
          title: paper.title,
          authors: paper.authors as PaperAuthor[],
          year: paper.year,
          journal: paper.journal,
          abstract: paper.abstract,
          openAccess: paper.openAccess,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Title search failed:', error);
    return null;
  }
}

/**
 * Disambiguate authors and link to ORCID
 * Note: Full ORCID integration would require ORCID API
 */
export async function disambiguateAuthors(authors: PaperAuthor[]): Promise<PaperAuthor[]> {
  // This is a placeholder for ORCID disambiguation
  // In a full implementation, we would:
  // 1. Query ORCID API for each author
  // 2. Match based on name + affiliation
  // 3. Add ORCID ID to author object

  // For now, just return authors as-is
  // TODO: Implement ORCID API integration
  return authors;
}

/**
 * Get citation count from multiple sources
 */
export async function getCitationCount(doi?: string, pmid?: string): Promise<number> {
  let citationCount = 0;

  // Try CrossRef
  if (doi) {
    try {
      const crossrefData = await enrichFromCrossRef(doi);
      citationCount = Math.max(citationCount, crossrefData?.citationCount || 0);
    } catch {
      // Ignore errors
    }
  }

  // Try OpenCitations (would need to be implemented)
  // Try Semantic Scholar (would need to be implemented)

  return citationCount;
}

// Helper functions

function extractAuthorsFromText(text: string, pdfAuthor?: string): PaperAuthor[] {
  const authors: PaperAuthor[] = [];

  // Try PDF metadata first
  if (pdfAuthor) {
    const names = pdfAuthor.split(/[,;&]/).map((n) => n.trim()).filter(Boolean);
    names.forEach((name) => {
      authors.push(parseAuthorName(name));
    });
  }

  // If no authors from metadata, try to extract from text
  if (authors.length === 0) {
    const authorSection = text.slice(0, 2000);
    const lines = authorSection.split('\n');

    for (let i = 1; i < Math.min(10, lines.length); i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      // Skip if it looks like a section header
      if (/^(abstract|introduction|summary|keywords)/i.test(line)) break;

      // Heuristic: lines with multiple capitalized words might be authors
      const capitalizedWords = line.match(/\b[A-Z][a-z]+\b/g) || [];
      if (capitalizedWords.length >= 2 && capitalizedWords.length <= 10 && line.length < 300) {
        const potentialAuthors = line.split(/[,;&]/).map((n) => n.trim()).filter(Boolean);

        potentialAuthors.forEach((name) => {
          // Filter out obvious non-names
          if (name.length > 3 && name.length < 100 && /^[A-Z]/.test(name)) {
            const parts = name.split(/\s+/).filter(Boolean);
            if (parts.length >= 2 && parts.length <= 6) {
              authors.push(parseAuthorName(name));
            }
          }
        });

        if (authors.length > 0) break;
      }
    }
  }

  return authors.slice(0, 50); // Limit to 50 authors
}

function parseAuthorName(name: string): PaperAuthor {
  const parts = name.split(/\s+/).filter(Boolean);

  // Common patterns:
  // "John Smith" -> firstName: John, lastName: Smith
  // "Smith, John" -> lastName: Smith, firstName: John
  // "J. Smith" -> firstName: J., lastName: Smith

  if (name.includes(',')) {
    // "LastName, FirstName" format
    const [last, first] = name.split(',').map((p) => p.trim());
    return {
      name,
      firstName: first || undefined,
      lastName: last,
    };
  } else {
    // "FirstName LastName" format
    return {
      name,
      firstName: parts.length > 1 ? parts[0] : undefined,
      lastName: parts.length > 1 ? parts[parts.length - 1] : parts[0],
    };
  }
}

function extractJournal(text: string): string | undefined {
  // Try to find journal name in first 2000 chars
  const upperText = text.slice(0, 2000);

  // Look for common journal name patterns
  const journalPatterns = [
    /(?:published in|appeared in|journal:|journal of|journal)\s+([A-Z][^\n.]{5,100})/i,
    /\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\d{4};/,  // "Journal Name 2023;"
  ];

  for (const pattern of journalPatterns) {
    const match = upperText.match(pattern);
    if (match) {
      return match[1].trim().slice(0, 200);
    }
  }

  return undefined;
}

function extractAbstractText(text: string): string | undefined {
  // Look for abstract section
  const abstractMatch = text.match(
    /(?:^|\n)\s*abstract\s*[:\n]([\s\S]+?)(?=\n\s*(?:introduction|keywords|background|1\.|$))/i
  );

  if (abstractMatch) {
    return abstractMatch[1].trim().slice(0, 5000);
  }

  return undefined;
}

function extractKeywordsFromText(text: string, pdfKeywords?: string): string[] | undefined {
  const keywords: string[] = [];

  // From PDF metadata
  if (pdfKeywords) {
    keywords.push(...pdfKeywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean));
  }

  // Look for keywords section in text
  const keywordsMatch = text.match(
    /(?:^|\n)\s*keywords?\s*[:]\s*([\s\S]+?)(?=\n\s*(?:introduction|abstract|1\.|$))/i
  );

  if (keywordsMatch) {
    const found = keywordsMatch[1]
      .split(/[,;]/)
      .map((k) => k.trim())
      .filter(Boolean);
    keywords.push(...found);
  }

  return keywords.length > 0 ? [...new Set(keywords)].slice(0, 20) : undefined;
}

function mergeMetadata(
  base: Partial<EnrichedMetadata>,
  enrichment: EnrichmentResult
): Partial<EnrichedMetadata> {
  return {
    ...base,
    // Only override if base doesn't have the field or enrichment has better data
    doi: base.doi || enrichment.doi,
    pmid: base.pmid || enrichment.pmid,
    title: enrichment.title && enrichment.title.length > (base.title?.length || 0)
      ? enrichment.title
      : base.title,
    authors: enrichment.authors && enrichment.authors.length > (base.authors?.length || 0)
      ? enrichment.authors
      : base.authors,
    year: base.year || enrichment.year,
    journal: base.journal || enrichment.journal,
    abstract: enrichment.abstract && enrichment.abstract.length > (base.abstract?.length || 0)
      ? enrichment.abstract
      : base.abstract,
    citationCount: Math.max(base.citationCount || 0, enrichment.citationCount || 0),
    openAccess: base.openAccess || enrichment.openAccess,
    keywords: [
      ...(base.keywords || []),
      ...(enrichment.keywords || []),
    ].slice(0, 20),
  };
}

/**
 * Simple title similarity metric (Jaccard similarity on words)
 */
function titleSimilarity(title1: string, title2: string): number {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  const words1 = new Set(normalize(title1));
  const words2 = new Set(normalize(title2));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
