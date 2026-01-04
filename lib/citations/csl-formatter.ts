/**
 * CSL (Citation Style Language) Formatter
 *
 * Formats citations and bibliographies in popular academic styles.
 * Supports author-date, numeric, and note-based citation systems.
 */

import type { Reference, ReferenceAuthor, ReferenceDate } from './types';

/**
 * Supported citation styles
 */
export type CitationStyleId =
  | 'apa-7'           // American Psychological Association 7th
  | 'mla-9'           // Modern Language Association 9th
  | 'chicago-notes'   // Chicago Manual of Style (Notes-Bibliography)
  | 'chicago-author'  // Chicago Manual of Style (Author-Date)
  | 'vancouver'       // Vancouver (ICMJE) - medical/biomedical
  | 'harvard'         // Harvard referencing
  | 'ieee'            // IEEE - engineering/CS
  | 'ama'             // American Medical Association
  | 'nature'          // Nature journal style
  | 'cell';           // Cell journal style

export interface CitationStyle {
  id: CitationStyleId;
  name: string;
  category: 'author-date' | 'numeric' | 'note';
  fields: string[]; // Academic fields this is common in
}

/**
 * Available citation styles
 */
export const CITATION_STYLES: CitationStyle[] = [
  { id: 'apa-7', name: 'APA 7th Edition', category: 'author-date', fields: ['psychology', 'education', 'social-sciences'] },
  { id: 'mla-9', name: 'MLA 9th Edition', category: 'author-date', fields: ['humanities', 'literature'] },
  { id: 'chicago-notes', name: 'Chicago (Notes)', category: 'note', fields: ['history', 'arts'] },
  { id: 'chicago-author', name: 'Chicago (Author-Date)', category: 'author-date', fields: ['sciences', 'social-sciences'] },
  { id: 'vancouver', name: 'Vancouver', category: 'numeric', fields: ['medicine', 'nursing', 'biomedical'] },
  { id: 'harvard', name: 'Harvard', category: 'author-date', fields: ['business', 'general'] },
  { id: 'ieee', name: 'IEEE', category: 'numeric', fields: ['engineering', 'computer-science', 'electronics'] },
  { id: 'ama', name: 'AMA 11th Edition', category: 'numeric', fields: ['medicine', 'health-sciences'] },
  { id: 'nature', name: 'Nature', category: 'numeric', fields: ['natural-sciences', 'biology', 'multidisciplinary'] },
  { id: 'cell', name: 'Cell', category: 'author-date', fields: ['biology', 'life-sciences'] },
];

/**
 * Citation formatting options
 */
export interface CitationFormatOptions {
  suppressAuthor?: boolean;
  prefix?: string;
  suffix?: string;
  locator?: string;
  locatorType?: 'page' | 'chapter' | 'section' | 'paragraph' | 'figure' | 'table';
  position?: number; // For numeric styles - the citation number
}

// ============================================================================
// AUTHOR FORMATTING
// ============================================================================

function formatAuthorLastFirst(author: ReferenceAuthor): string {
  if (author.suffix) {
    return `${author.family}, ${author.given} ${author.suffix}`;
  }
  return `${author.family}, ${author.given}`;
}

function formatAuthorFirstLast(author: ReferenceAuthor): string {
  if (author.suffix) {
    return `${author.given} ${author.family} ${author.suffix}`;
  }
  return `${author.given} ${author.family}`;
}

function formatAuthorInitials(author: ReferenceAuthor): string {
  const initials = author.given
    .split(/[\s-]+/)
    .map(part => part.charAt(0).toUpperCase() + '.')
    .join('');
  return `${author.family} ${initials}`;
}

function formatAuthorInitialsFirst(author: ReferenceAuthor): string {
  const initials = author.given
    .split(/[\s-]+/)
    .map(part => part.charAt(0).toUpperCase() + '.')
    .join('');
  return `${initials} ${author.family}`;
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

function formatYear(date: ReferenceDate | undefined): string {
  if (!date || date.year === undefined || date.year === null) return 'n.d.';
  if (date.literal) return date.literal;
  return String(date.year);
}

function formatFullDate(date: ReferenceDate | undefined): string {
  if (!date) return 'n.d.';
  if (date.literal) return date.literal;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (date.month && date.day) {
    return `${months[date.month - 1]} ${date.day}, ${date.year}`;
  }
  if (date.month) {
    return `${months[date.month - 1]} ${date.year}`;
  }
  return String(date.year);
}

function formatMonthDay(date: ReferenceDate | undefined): string {
  if (!date || !date.month) return '';

  const months = [
    'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.',
    'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'
  ];

  if (date.day) {
    return `${date.year} ${months[date.month - 1]} ${date.day}`;
  }
  return `${date.year} ${months[date.month - 1]}`;
}

// ============================================================================
// IN-TEXT CITATION FORMATTERS
// ============================================================================

/**
 * Format in-text citation for APA style
 * (Author, Year) or (Author, Year, p. 42)
 */
function formatCitationAPA(ref: Reference, options: CitationFormatOptions = {}): string {
  const year = formatYear(ref.issued);
  let citation = '';

  if (options.suppressAuthor) {
    citation = year;
  } else if (ref.authors.length === 0) {
    citation = `${ref.title.substring(0, 20)}..., ${year}`;
  } else if (ref.authors.length === 1) {
    citation = `${ref.authors[0].family}, ${year}`;
  } else if (ref.authors.length === 2) {
    citation = `${ref.authors[0].family} & ${ref.authors[1].family}, ${year}`;
  } else {
    citation = `${ref.authors[0].family} et al., ${year}`;
  }

  if (options.locator) {
    const locatorLabel = options.locatorType === 'page' ? 'p.' :
                        options.locatorType === 'chapter' ? 'Chapter' :
                        options.locatorType || 'p.';
    citation += `, ${locatorLabel} ${options.locator}`;
  }

  const prefix = options.prefix ? `${options.prefix} ` : '';
  const suffix = options.suffix ? ` ${options.suffix}` : '';

  return `(${prefix}${citation}${suffix})`;
}

/**
 * Format in-text citation for MLA style
 * (Author Page) - no comma, no p.
 */
function formatCitationMLA(ref: Reference, options: CitationFormatOptions = {}): string {
  let citation = '';

  if (options.suppressAuthor) {
    citation = options.locator || '';
  } else if (ref.authors.length === 0) {
    citation = `"${ref.title.substring(0, 20)}..."`;
  } else if (ref.authors.length === 1) {
    citation = ref.authors[0].family;
  } else if (ref.authors.length === 2) {
    citation = `${ref.authors[0].family} and ${ref.authors[1].family}`;
  } else {
    citation = `${ref.authors[0].family} et al.`;
  }

  if (options.locator && !options.suppressAuthor) {
    citation += ` ${options.locator}`;
  }

  const prefix = options.prefix ? `${options.prefix} ` : '';
  const suffix = options.suffix ? ` ${options.suffix}` : '';

  return `(${prefix}${citation}${suffix})`;
}

/**
 * Format in-text citation for Harvard style
 * (Author Year) or (Author Year, p. 42)
 */
function formatCitationHarvard(ref: Reference, options: CitationFormatOptions = {}): string {
  const year = formatYear(ref.issued);
  let citation = '';

  if (options.suppressAuthor) {
    citation = year;
  } else if (ref.authors.length === 0) {
    citation = `${year}`;
  } else if (ref.authors.length === 1) {
    citation = `${ref.authors[0].family} ${year}`;
  } else if (ref.authors.length === 2) {
    citation = `${ref.authors[0].family} and ${ref.authors[1].family} ${year}`;
  } else if (ref.authors.length <= 3) {
    const names = ref.authors.slice(0, -1).map(a => a.family).join(', ');
    citation = `${names} and ${ref.authors[ref.authors.length - 1].family} ${year}`;
  } else {
    citation = `${ref.authors[0].family} et al. ${year}`;
  }

  if (options.locator) {
    citation += `, p. ${options.locator}`;
  }

  const prefix = options.prefix ? `${options.prefix} ` : '';
  const suffix = options.suffix ? ` ${options.suffix}` : '';

  return `(${prefix}${citation}${suffix})`;
}

/**
 * Format in-text citation for Chicago Author-Date
 * (Author Year, page)
 */
function formatCitationChicagoAuthor(ref: Reference, options: CitationFormatOptions = {}): string {
  const year = formatYear(ref.issued);
  let citation = '';

  if (options.suppressAuthor) {
    citation = year;
  } else if (ref.authors.length === 0) {
    citation = `${year}`;
  } else if (ref.authors.length === 1) {
    citation = `${ref.authors[0].family} ${year}`;
  } else if (ref.authors.length === 2) {
    citation = `${ref.authors[0].family} and ${ref.authors[1].family} ${year}`;
  } else if (ref.authors.length === 3) {
    citation = `${ref.authors[0].family}, ${ref.authors[1].family}, and ${ref.authors[2].family} ${year}`;
  } else {
    citation = `${ref.authors[0].family} et al. ${year}`;
  }

  if (options.locator) {
    citation += `, ${options.locator}`;
  }

  const prefix = options.prefix ? `${options.prefix} ` : '';
  const suffix = options.suffix ? ` ${options.suffix}` : '';

  return `(${prefix}${citation}${suffix})`;
}

/**
 * Format in-text citation for Cell style
 * (Author et al., Year)
 */
function formatCitationCell(ref: Reference, options: CitationFormatOptions = {}): string {
  const year = formatYear(ref.issued);
  let citation = '';

  if (options.suppressAuthor) {
    citation = year;
  } else if (ref.authors.length === 0) {
    citation = year;
  } else if (ref.authors.length === 1) {
    citation = `${ref.authors[0].family}, ${year}`;
  } else if (ref.authors.length === 2) {
    citation = `${ref.authors[0].family} and ${ref.authors[1].family}, ${year}`;
  } else {
    citation = `${ref.authors[0].family} et al., ${year}`;
  }

  const prefix = options.prefix ? `${options.prefix} ` : '';
  const suffix = options.suffix ? ` ${options.suffix}` : '';

  return `(${prefix}${citation}${suffix})`;
}

/**
 * Format numeric citation (Vancouver, IEEE, AMA, Nature)
 * [1] or [1, p. 42] or (1)
 */
function formatCitationNumeric(
  ref: Reference,
  options: CitationFormatOptions = {},
  brackets: '[' | '(' = '['
): string {
  const num = options.position ?? 1;
  const closeBracket = brackets === '[' ? ']' : ')';

  let citation = String(num);

  if (options.locator && options.locatorType === 'page') {
    citation += `, p. ${options.locator}`;
  }

  const prefix = options.prefix ? `${options.prefix} ` : '';
  const suffix = options.suffix ? ` ${options.suffix}` : '';

  return `${brackets}${prefix}${citation}${suffix}${closeBracket}`;
}

// ============================================================================
// BIBLIOGRAPHY FORMATTERS
// ============================================================================

/**
 * Format bibliography entry for APA 7th Edition
 */
function formatBibliographyAPA(ref: Reference): string {
  const parts: string[] = [];

  // Authors
  if (ref.authors.length > 0) {
    if (ref.authors.length === 1) {
      parts.push(`${formatAuthorLastFirst(ref.authors[0])}.`);
    } else if (ref.authors.length <= 20) {
      const authorList = ref.authors.map((a, i) => {
        if (i === ref.authors.length - 1 && ref.authors.length > 1) {
          return `& ${formatAuthorLastFirst(a)}`;
        }
        return formatAuthorLastFirst(a);
      }).join(', ');
      parts.push(`${authorList}.`);
    } else {
      const first19 = ref.authors.slice(0, 19).map(a => formatAuthorLastFirst(a)).join(', ');
      parts.push(`${first19}, . . . ${formatAuthorLastFirst(ref.authors[ref.authors.length - 1])}.`);
    }
  }

  // Year
  parts.push(`(${formatYear(ref.issued)}).`);

  // Title
  if (ref.type === 'article-journal' || ref.type === 'article-magazine') {
    parts.push(`${ref.title}.`);
  } else {
    parts.push(`*${ref.title}*.`);
  }

  // Source
  if (ref.venue?.name) {
    parts.push(`*${ref.venue.name}*`);
    if (ref.venue.volume) {
      parts.push(`, *${ref.venue.volume}*`);
      if (ref.venue.issue) {
        parts.push(`(${ref.venue.issue})`);
      }
    }
    if (ref.venue.pages) {
      parts.push(`, ${ref.venue.pages}`);
    }
    parts.push('.');
  } else if (ref.publisher?.name) {
    parts.push(`${ref.publisher.name}.`);
  }

  // DOI
  if (ref.identifiers.doi) {
    parts.push(`https://doi.org/${ref.identifiers.doi}`);
  }

  return parts.join(' ').replace(/\s+/g, ' ').replace(/\.\./g, '.');
}

/**
 * Format bibliography entry for MLA 9th Edition
 */
function formatBibliographyMLA(ref: Reference): string {
  const parts: string[] = [];

  // Authors
  if (ref.authors.length > 0) {
    if (ref.authors.length === 1) {
      parts.push(`${formatAuthorLastFirst(ref.authors[0])}.`);
    } else if (ref.authors.length === 2) {
      parts.push(`${formatAuthorLastFirst(ref.authors[0])}, and ${formatAuthorFirstLast(ref.authors[1])}.`);
    } else {
      parts.push(`${formatAuthorLastFirst(ref.authors[0])}, et al.`);
    }
  }

  // Title
  if (ref.type === 'article-journal' || ref.type === 'chapter') {
    parts.push(`"${ref.title}."`);
  } else {
    parts.push(`*${ref.title}*.`);
  }

  // Container/Source
  if (ref.venue?.name) {
    parts.push(`*${ref.venue.name}*,`);
    if (ref.venue.volume) {
      parts.push(`vol. ${ref.venue.volume},`);
    }
    if (ref.venue.issue) {
      parts.push(`no. ${ref.venue.issue},`);
    }
  }

  // Publisher
  if (ref.publisher?.name) {
    parts.push(`${ref.publisher.name},`);
  }

  // Year
  parts.push(`${formatYear(ref.issued)},`);

  // Pages
  if (ref.venue?.pages) {
    parts.push(`pp. ${ref.venue.pages}.`);
  }

  // DOI
  if (ref.identifiers.doi) {
    parts.push(`doi:${ref.identifiers.doi}.`);
  }

  return parts.join(' ').replace(/,\./g, '.').replace(/\s+/g, ' ');
}

/**
 * Format bibliography entry for Vancouver style
 */
function formatBibliographyVancouver(ref: Reference, position: number = 1): string {
  const parts: string[] = [];

  // Number
  parts.push(`${position}.`);

  // Authors (up to 6, then et al.)
  if (ref.authors.length > 0) {
    if (ref.authors.length <= 6) {
      const authorList = ref.authors.map(a => formatAuthorInitials(a)).join(', ');
      parts.push(`${authorList}.`);
    } else {
      const first6 = ref.authors.slice(0, 6).map(a => formatAuthorInitials(a)).join(', ');
      parts.push(`${first6}, et al.`);
    }
  }

  // Title
  parts.push(`${ref.title}.`);

  // Journal
  if (ref.venue?.name) {
    parts.push(`${ref.venue.abbreviation || ref.venue.name}.`);
    // Date
    parts.push(`${formatMonthDay(ref.issued) || formatYear(ref.issued)};`);
    // Volume, issue, pages
    if (ref.venue.volume) {
      parts.push(`${ref.venue.volume}`);
      if (ref.venue.issue) {
        parts.push(`(${ref.venue.issue})`);
      }
    }
    if (ref.venue.pages) {
      parts.push(`:${ref.venue.pages}.`);
    }
  }

  // DOI
  if (ref.identifiers.doi) {
    parts.push(`doi: ${ref.identifiers.doi}`);
  } else if (ref.identifiers.pmid) {
    parts.push(`PMID: ${ref.identifiers.pmid}`);
  }

  return parts.join(' ').replace(/\s+/g, ' ').replace(/\.\./g, '.');
}

/**
 * Format bibliography entry for IEEE style
 */
function formatBibliographyIEEE(ref: Reference, position: number = 1): string {
  const parts: string[] = [];

  // Number
  parts.push(`[${position}]`);

  // Authors
  if (ref.authors.length > 0) {
    if (ref.authors.length <= 6) {
      const authorList = ref.authors.map((a, i) => {
        const initials = a.given.split(/[\s-]+/).map(p => p.charAt(0).toUpperCase() + '.').join(' ');
        const formatted = `${initials} ${a.family}`;
        if (i === ref.authors.length - 1 && ref.authors.length > 1) {
          return `and ${formatted}`;
        }
        return formatted;
      }).join(', ');
      parts.push(`${authorList},`);
    } else {
      const first = ref.authors[0];
      const initials = first.given.split(/[\s-]+/).map(p => p.charAt(0).toUpperCase() + '.').join(' ');
      parts.push(`${initials} ${first.family} et al.,`);
    }
  }

  // Title
  parts.push(`"${ref.title},"`);

  // Journal/Conference
  if (ref.venue?.name) {
    parts.push(`*${ref.venue.name}*,`);
    if (ref.venue.volume) {
      parts.push(`vol. ${ref.venue.volume},`);
    }
    if (ref.venue.issue) {
      parts.push(`no. ${ref.venue.issue},`);
    }
    if (ref.venue.pages) {
      parts.push(`pp. ${ref.venue.pages},`);
    }
  }

  // Date
  const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
  if (ref.issued.month) {
    parts.push(`${months[ref.issued.month - 1]} ${ref.issued.year}.`);
  } else {
    parts.push(`${ref.issued.year}.`);
  }

  // DOI
  if (ref.identifiers.doi) {
    parts.push(`doi: ${ref.identifiers.doi}.`);
  }

  return parts.join(' ').replace(/,\./g, '.').replace(/\s+/g, ' ');
}

/**
 * Format bibliography entry for Harvard style
 */
function formatBibliographyHarvard(ref: Reference): string {
  const parts: string[] = [];

  // Authors
  if (ref.authors.length > 0) {
    if (ref.authors.length === 1) {
      parts.push(`${formatAuthorLastFirst(ref.authors[0])}`);
    } else if (ref.authors.length <= 3) {
      const authorList = ref.authors.map((a, i) => {
        if (i === 0) return formatAuthorLastFirst(a);
        if (i === ref.authors.length - 1) return `and ${formatAuthorLastFirst(a)}`;
        return formatAuthorLastFirst(a);
      }).join(', ');
      parts.push(authorList);
    } else {
      parts.push(`${formatAuthorLastFirst(ref.authors[0])} et al.`);
    }
  }

  // Year
  parts.push(`(${formatYear(ref.issued)})`);

  // Title
  if (ref.type === 'article-journal') {
    parts.push(`'${ref.title}',`);
  } else {
    parts.push(`*${ref.title}*,`);
  }

  // Journal
  if (ref.venue?.name) {
    parts.push(`*${ref.venue.name}*,`);
    if (ref.venue.volume) {
      parts.push(`${ref.venue.volume}`);
      if (ref.venue.issue) {
        parts.push(`(${ref.venue.issue})`);
      }
      parts.push(',');
    }
    if (ref.venue.pages) {
      parts.push(`pp. ${ref.venue.pages}.`);
    }
  }

  // Publisher
  if (ref.publisher?.name) {
    if (ref.publisher.location) {
      parts.push(`${ref.publisher.location}:`);
    }
    parts.push(`${ref.publisher.name}.`);
  }

  // DOI
  if (ref.identifiers.doi) {
    parts.push(`Available at: https://doi.org/${ref.identifiers.doi}`);
  }

  return parts.join(' ').replace(/\s+/g, ' ').replace(/,\./g, '.');
}

/**
 * Format bibliography entry for AMA style
 */
function formatBibliographyAMA(ref: Reference, position: number = 1): string {
  const parts: string[] = [];

  // Number
  parts.push(`${position}.`);

  // Authors (up to 6)
  if (ref.authors.length > 0) {
    if (ref.authors.length <= 6) {
      const authorList = ref.authors.map(a => formatAuthorInitials(a)).join(', ');
      parts.push(`${authorList}.`);
    } else {
      const first3 = ref.authors.slice(0, 3).map(a => formatAuthorInitials(a)).join(', ');
      parts.push(`${first3}, et al.`);
    }
  }

  // Title
  parts.push(`${ref.title}.`);

  // Journal
  if (ref.venue?.name) {
    parts.push(`*${ref.venue.abbreviation || ref.venue.name}*.`);
    parts.push(`${ref.issued.year};`);
    if (ref.venue.volume) {
      parts.push(`${ref.venue.volume}`);
      if (ref.venue.issue) {
        parts.push(`(${ref.venue.issue})`);
      }
    }
    if (ref.venue.pages) {
      parts.push(`:${ref.venue.pages}.`);
    }
  }

  // DOI
  if (ref.identifiers.doi) {
    parts.push(`doi:${ref.identifiers.doi}`);
  }

  return parts.join(' ').replace(/\s+/g, ' ').replace(/\.\./g, '.');
}

/**
 * Format bibliography entry for Nature style
 */
function formatBibliographyNature(ref: Reference, position: number = 1): string {
  const parts: string[] = [];

  // Number
  parts.push(`${position}.`);

  // Authors
  if (ref.authors.length > 0) {
    if (ref.authors.length <= 5) {
      const authorList = ref.authors.map((a, i) => {
        if (i === ref.authors.length - 1 && ref.authors.length > 1) {
          return `& ${formatAuthorInitials(a)}`;
        }
        return formatAuthorInitials(a);
      }).join(', ');
      parts.push(authorList);
    } else {
      const first = formatAuthorInitials(ref.authors[0]);
      parts.push(`${first} et al.`);
    }
  }

  // Title
  parts.push(`${ref.title}.`);

  // Journal
  if (ref.venue?.name) {
    parts.push(`*${ref.venue.abbreviation || ref.venue.name}*`);
    if (ref.venue.volume) {
      parts.push(`**${ref.venue.volume}**,`);
    }
    if (ref.venue.pages) {
      parts.push(`${ref.venue.pages}`);
    }
    parts.push(`(${ref.issued.year}).`);
  }

  // DOI
  if (ref.identifiers.doi) {
    parts.push(`https://doi.org/${ref.identifiers.doi}`);
  }

  return parts.join(' ').replace(/\s+/g, ' ');
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Format an in-text citation
 */
export function formatCitation(
  ref: Reference,
  styleId: CitationStyleId,
  options: CitationFormatOptions = {}
): string {
  switch (styleId) {
    case 'apa-7':
      return formatCitationAPA(ref, options);
    case 'mla-9':
      return formatCitationMLA(ref, options);
    case 'harvard':
      return formatCitationHarvard(ref, options);
    case 'chicago-author':
      return formatCitationChicagoAuthor(ref, options);
    case 'chicago-notes':
      // Notes style uses footnotes, fallback to author format for inline
      return formatCitationChicagoAuthor(ref, options);
    case 'cell':
      return formatCitationCell(ref, options);
    case 'vancouver':
      return formatCitationNumeric(ref, options, '(');
    case 'ieee':
      return formatCitationNumeric(ref, options, '[');
    case 'ama':
      return formatCitationNumeric(ref, options, '(');
    case 'nature':
      return formatCitationNumeric(ref, options, '(');
    default:
      return formatCitationAPA(ref, options);
  }
}

/**
 * Format a bibliography entry
 */
export function formatBibliographyEntry(
  ref: Reference,
  styleId: CitationStyleId,
  position: number = 1
): string {
  switch (styleId) {
    case 'apa-7':
      return formatBibliographyAPA(ref);
    case 'mla-9':
      return formatBibliographyMLA(ref);
    case 'harvard':
      return formatBibliographyHarvard(ref);
    case 'chicago-author':
    case 'chicago-notes':
      // Chicago uses same bibliography format for both variants
      return formatBibliographyAPA(ref); // Similar to APA
    case 'cell':
      return formatBibliographyAPA(ref); // Cell uses APA-like format
    case 'vancouver':
      return formatBibliographyVancouver(ref, position);
    case 'ieee':
      return formatBibliographyIEEE(ref, position);
    case 'ama':
      return formatBibliographyAMA(ref, position);
    case 'nature':
      return formatBibliographyNature(ref, position);
    default:
      return formatBibliographyAPA(ref);
  }
}

/**
 * Format a complete bibliography from a list of references
 */
export function formatBibliography(
  refs: Reference[],
  styleId: CitationStyleId
): string {
  const style = CITATION_STYLES.find(s => s.id === styleId);
  const isNumeric = style?.category === 'numeric';

  // Sort references appropriately
  const sortedRefs = [...refs];
  if (!isNumeric) {
    // Author-date styles: sort alphabetically by first author's last name
    sortedRefs.sort((a, b) => {
      const authorA = a.authors[0]?.family || '';
      const authorB = b.authors[0]?.family || '';
      const cmp = authorA.localeCompare(authorB);
      if (cmp !== 0) return cmp;
      // Same author: sort by year
      return (a.issued?.year || 0) - (b.issued?.year || 0);
    });
  }

  const entries = sortedRefs.map((ref, index) =>
    formatBibliographyEntry(ref, styleId, index + 1)
  );

  return entries.join('\n\n');
}

/**
 * Get citation style info
 */
export function getCitationStyle(styleId: CitationStyleId): CitationStyle | undefined {
  return CITATION_STYLES.find(s => s.id === styleId);
}

/**
 * Get recommended styles for a discipline
 */
export function getStylesForDiscipline(discipline: string): CitationStyle[] {
  return CITATION_STYLES.filter(s =>
    s.fields.some(f => f.toLowerCase().includes(discipline.toLowerCase()) ||
                      discipline.toLowerCase().includes(f.toLowerCase()))
  );
}

/**
 * Generate short citation text for quick display (not formal citation)
 */
export function getShortCitation(ref: Reference): string {
  const author = ref.authors.length > 0
    ? (ref.authors.length > 2
        ? `${ref.authors[0].family} et al.`
        : ref.authors.map(a => a.family).join(' & '))
    : 'Unknown';
  return `${author}, ${formatYear(ref.issued)}`;
}
