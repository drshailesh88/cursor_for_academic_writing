/**
 * Author-Year Citation Parser
 *
 * Handles author-year citations like (Mbachu et al., 2020) for easy integration
 * with citation managers like Paperpile, Zotero, and Mendeley.
 */

export interface AuthorYearCitation {
  authors: string[];
  year: number;
  citationText: string; // e.g., "(Mbachu et al., 2020)"
  pmid?: string;
  doi?: string;
}

export interface Reference {
  id: string;
  authors: string[];
  year: number;
  title: string;
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  url?: string;
}

/**
 * Format authors in "et al." style for in-text citations
 */
export function formatAuthorsForCitation(authors: string[]): string {
  if (authors.length === 0) return 'Unknown';
  if (authors.length === 1) return authors[0].split(' ').pop() || authors[0];
  if (authors.length === 2) {
    const author1 = authors[0].split(' ').pop() || authors[0];
    const author2 = authors[1].split(' ').pop() || authors[1];
    return `${author1} & ${author2}`;
  }
  // 3+ authors: use et al.
  const firstAuthor = authors[0].split(' ').pop() || authors[0];
  return `${firstAuthor} et al.`;
}

/**
 * Generate author-year citation text
 */
export function generateCitationText(authors: string[], year: number): string {
  const authorText = formatAuthorsForCitation(authors);
  return `(${authorText}, ${year})`;
}

/**
 * Extract citations from text
 * Matches patterns like (Author, YYYY), (Author et al., YYYY), (Author & Author, YYYY)
 */
export function extractCitations(text: string): string[] {
  const citationPattern = /\([A-Z][a-zA-Z\s&\.]+,\s*\d{4}\)/g;
  return text.match(citationPattern) || [];
}

/**
 * Parse a citation string into components
 * Example: "(Mbachu et al., 2020)" -> { authors: "Mbachu et al.", year: 2020 }
 */
export function parseCitation(citation: string): { authors: string; year: number } | null {
  const match = citation.match(/\(([^,]+),\s*(\d{4})\)/);
  if (!match) return null;

  return {
    authors: match[1].trim(),
    year: parseInt(match[2]),
  };
}

/**
 * Format reference for bibliography (Vancouver style)
 */
export function formatReferenceVancouver(ref: Reference, index: number): string {
  const authors = ref.authors.slice(0, 6).join(', ');
  const authorsText = ref.authors.length > 6 ? `${authors}, et al` : authors;

  let result = `${index}. ${authorsText}. ${ref.title}. ${ref.journal}. ${ref.year}`;

  if (ref.volume) {
    result += `;${ref.volume}`;
    if (ref.issue) result += `(${ref.issue})`;
    if (ref.pages) result += `:${ref.pages}`;
  }

  result += '.';

  if (ref.doi) {
    result += ` doi:${ref.doi}`;
  }

  return result;
}

/**
 * Format reference for bibliography (APA style)
 */
export function formatReferenceAPA(ref: Reference): string {
  const authors = ref.authors.map((author, index) => {
    const parts = author.split(' ');
    const lastName = parts.pop();
    const initials = parts.map(name => name[0] + '.').join(' ');
    return index === ref.authors.length - 1 && ref.authors.length > 1
      ? `& ${lastName}, ${initials}`
      : `${lastName}, ${initials}`;
  }).join(', ');

  let result = `${authors} (${ref.year}). ${ref.title}. *${ref.journal}*`;

  if (ref.volume) {
    result += `, *${ref.volume}*`;
    if (ref.issue) result += `(${ref.issue})`;
    if (ref.pages) result += `, ${ref.pages}`;
  }

  result += '.';

  if (ref.doi) {
    result += ` https://doi.org/${ref.doi}`;
  }

  return result;
}

/**
 * Convert PubMed article to reference object
 */
export function pubmedToReference(article: any): Reference {
  return {
    id: article.pmid || article.id || Math.random().toString(),
    authors: article.authors || [],
    year: article.year || new Date().getFullYear(),
    title: article.title || '',
    journal: article.journal || '',
    volume: article.volume,
    issue: article.issue,
    pages: article.pages,
    doi: article.doi,
    pmid: article.pmid,
    url: article.doi ? `https://doi.org/${article.doi}` : undefined,
  };
}
