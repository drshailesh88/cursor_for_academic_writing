/**
 * Citation Import/Export
 *
 * Parse and export references in BibTeX, RIS, and other formats.
 * Supports import from Zotero, Mendeley, EndNote, and Paperpile.
 */

import {
  Reference,
  ReferenceType,
  ReferenceAuthor,
  ReferenceDate,
  BibtexEntry,
  RisEntry,
  ImportResult,
  generateCiteKey,
} from './types';

// ============================================
// BIBTEX PARSING
// ============================================

/**
 * BibTeX entry type to Reference type mapping
 */
const BIBTEX_TYPE_MAP: Record<string, ReferenceType> = {
  'article': 'article-journal',
  'book': 'book',
  'booklet': 'book',
  'inbook': 'chapter',
  'incollection': 'chapter',
  'inproceedings': 'paper-conference',
  'conference': 'paper-conference',
  'manual': 'report',
  'mastersthesis': 'thesis',
  'phdthesis': 'thesis',
  'proceedings': 'book',
  'techreport': 'report',
  'unpublished': 'manuscript',
  'misc': 'document',
  'online': 'webpage',
  'electronic': 'webpage',
  'patent': 'patent',
  'standard': 'standard',
  'software': 'software',
  'dataset': 'dataset',
};

/**
 * Parse BibTeX author string
 */
function parseBibtexAuthors(authorStr: string): ReferenceAuthor[] {
  if (!authorStr) return [];

  // Split by " and " (BibTeX standard)
  const authorNames = authorStr.split(/\s+and\s+/i);

  return authorNames.map((name, index) => {
    name = name.trim();

    // Handle "Last, First" format
    if (name.includes(',')) {
      const [last, first] = name.split(',').map(s => s.trim());
      return {
        family: last,
        given: first || '',
        sequence: index === 0 ? 'first' : 'additional',
      };
    }

    // Handle "First Last" format
    const parts = name.split(/\s+/);
    if (parts.length === 1) {
      return {
        family: parts[0],
        given: '',
        sequence: index === 0 ? 'first' : 'additional',
      };
    }

    return {
      family: parts[parts.length - 1],
      given: parts.slice(0, -1).join(' '),
      sequence: index === 0 ? 'first' : 'additional',
    };
  });
}

/**
 * Parse BibTeX date
 */
function parseBibtexDate(year?: string, month?: string): ReferenceDate {
  const date: ReferenceDate = {
    year: year ? parseInt(year, 10) : new Date().getFullYear(),
  };

  if (month) {
    const monthMap: Record<string, number> = {
      'jan': 1, 'january': 1,
      'feb': 2, 'february': 2,
      'mar': 3, 'march': 3,
      'apr': 4, 'april': 4,
      'may': 5,
      'jun': 6, 'june': 6,
      'jul': 7, 'july': 7,
      'aug': 8, 'august': 8,
      'sep': 9, 'september': 9,
      'oct': 10, 'october': 10,
      'nov': 11, 'november': 11,
      'dec': 12, 'december': 12,
    };
    const monthLower = month.toLowerCase();
    if (monthMap[monthLower]) {
      date.month = monthMap[monthLower];
    } else if (!isNaN(parseInt(month, 10))) {
      date.month = parseInt(month, 10);
    }
  }

  return date;
}

/**
 * Clean BibTeX field value (remove braces, etc.)
 */
function cleanBibtexValue(value: string): string {
  if (!value) return '';

  // Remove outer braces
  value = value.replace(/^\{|\}$/g, '');

  // Remove inner braces (but keep content)
  value = value.replace(/\{([^}]*)\}/g, '$1');

  // Convert LaTeX special characters
  const latexMap: Record<string, string> = {
    '\\&': '&',
    '\\_': '_',
    '\\%': '%',
    '\\#': '#',
    '\\$': '$',
    '\\~': '~',
    '\\textendash': '–',
    '\\textemdash': '—',
    "\\'a": 'á', "\\'e": 'é', "\\'i": 'í', "\\'o": 'ó', "\\'u": 'ú',
    '\\"a': 'ä', '\\"e': 'ë', '\\"i': 'ï', '\\"o': 'ö', '\\"u': 'ü',
    '\\`a': 'à', '\\`e': 'è', '\\`i': 'ì', '\\`o': 'ò', '\\`u': 'ù',
    '\\^a': 'â', '\\^e': 'ê', '\\^i': 'î', '\\^o': 'ô', '\\^u': 'û',
    '\\c{c}': 'ç', '\\c c': 'ç',
    '\\~n': 'ñ', '\\~a': 'ã', '\\~o': 'õ',
    '\\ss': 'ß',
    '\\o': 'ø', '\\O': 'Ø',
    '\\ae': 'æ', '\\AE': 'Æ',
    '\\aa': 'å', '\\AA': 'Å',
  };

  for (const [latex, char] of Object.entries(latexMap)) {
    value = value.split(latex).join(char);
  }

  return value.trim();
}

/**
 * Parse a single BibTeX entry
 */
function parseBibtexEntry(entryStr: string): BibtexEntry | null {
  // Match entry type and key: @article{smith2024,
  const headerMatch = entryStr.match(/@(\w+)\s*\{\s*([^,\s]+)\s*,/);
  if (!headerMatch) return null;

  const entryType = headerMatch[1].toLowerCase();
  const citationKey = headerMatch[2];

  // Extract fields
  const fields: Record<string, string> = {};

  // Remove header and closing brace
  let content = entryStr.slice(headerMatch[0].length);
  content = content.replace(/\}\s*$/, '');

  // Parse fields - handle nested braces
  const fieldRegex = /(\w+)\s*=\s*(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|[^,}\s]+)/g;
  let match;

  while ((match = fieldRegex.exec(content)) !== null) {
    const fieldName = match[1].toLowerCase();
    let fieldValue = match[2];

    // Remove quotes or outer braces
    if (fieldValue.startsWith('"') && fieldValue.endsWith('"')) {
      fieldValue = fieldValue.slice(1, -1);
    } else if (fieldValue.startsWith('{') && fieldValue.endsWith('}')) {
      fieldValue = fieldValue.slice(1, -1);
    }

    fields[fieldName] = cleanBibtexValue(fieldValue);
  }

  return { entryType, citationKey, fields };
}

/**
 * Convert BibTeX entry to Reference
 */
function bibtexToReference(entry: BibtexEntry): Reference {
  const { entryType, citationKey, fields } = entry;

  const type = BIBTEX_TYPE_MAP[entryType] || 'document';
  const authors = parseBibtexAuthors(fields.author || '');
  const editors = parseBibtexAuthors(fields.editor || '');
  const issued = parseBibtexDate(fields.year, fields.month);

  const ref: Reference = {
    id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: fields.title || 'Untitled',
    authors,
    editors: editors.length > 0 ? editors : undefined,
    issued,
    identifiers: {
      doi: fields.doi,
      pmid: fields.pmid,
      isbn: fields.isbn,
      issn: fields.issn,
      url: fields.url || fields.howpublished,
    },
    abstract: fields.abstract,
    keywords: fields.keywords?.split(/[,;]/).map(k => k.trim()).filter(Boolean),
    citeKey: citationKey,
    rawBibtex: `@${entryType}{${citationKey},\n${Object.entries(fields).map(([k, v]) => `  ${k} = {${v}}`).join(',\n')}\n}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Add venue information
  if (fields.journal || fields.journaltitle) {
    ref.venue = {
      name: fields.journal || fields.journaltitle,
      volume: fields.volume,
      issue: fields.number || fields.issue,
      pages: fields.pages,
    };
  }

  // Add publisher
  if (fields.publisher) {
    ref.publisher = {
      name: fields.publisher,
      location: fields.address || fields.location,
      edition: fields.edition,
    };
  }

  // Add conference
  if (fields.booktitle && type === 'paper-conference') {
    ref.conference = {
      name: fields.booktitle,
      location: fields.address || fields.location,
    };
  }

  // Thesis info
  if (type === 'thesis') {
    ref.thesis = {
      type: entryType === 'phdthesis' ? 'phd' : 'masters',
      institution: fields.school || fields.institution || '',
    };
  }

  return ref;
}

/**
 * Parse BibTeX string and return references
 */
export function parseBibtex(bibtexStr: string): ImportResult {
  const result: ImportResult = {
    success: [],
    duplicates: [],
    errors: [],
    totalProcessed: 0,
  };

  // Split into entries
  const entryRegex = /@\w+\s*\{[^@]+/g;
  const entries = bibtexStr.match(entryRegex) || [];

  for (const entryStr of entries) {
    result.totalProcessed++;

    try {
      const entry = parseBibtexEntry(entryStr);
      if (entry) {
        const ref = bibtexToReference(entry);
        result.success.push(ref);
      } else {
        result.errors.push({
          entry: entryStr.slice(0, 100),
          error: 'Failed to parse entry structure',
        });
      }
    } catch (error) {
      result.errors.push({
        entry: entryStr.slice(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

// ============================================
// RIS PARSING
// ============================================

/**
 * RIS type to Reference type mapping
 */
const RIS_TYPE_MAP: Record<string, ReferenceType> = {
  'JOUR': 'article-journal',
  'MGZN': 'article-magazine',
  'NEWS': 'article-newspaper',
  'BOOK': 'book',
  'CHAP': 'chapter',
  'CONF': 'paper-conference',
  'CPAPER': 'paper-conference',
  'THES': 'thesis',
  'RPRT': 'report',
  'PAT': 'patent',
  'ELEC': 'webpage',
  'WEB': 'webpage',
  'DATA': 'dataset',
  'COMP': 'software',
  'UNPB': 'manuscript',
  'GEN': 'document',
  'ABST': 'article-journal',
  'SLIDE': 'speech',
  'VIDEO': 'motion-picture',
  'MAP': 'map',
  'CASE': 'legal-case',
  'STAT': 'legislation',
  'STAND': 'standard',
  'ENCYC': 'entry-encyclopedia',
  'DICT': 'entry-dictionary',
  'BLOG': 'post-weblog',
};

/**
 * Parse RIS author name
 */
function parseRisAuthor(name: string, index: number): ReferenceAuthor {
  name = name.trim();

  // RIS format is usually "Last, First" or "Last, First, Suffix"
  const parts = name.split(',').map(s => s.trim());

  if (parts.length >= 2) {
    return {
      family: parts[0],
      given: parts[1],
      suffix: parts[2],
      sequence: index === 0 ? 'first' : 'additional',
    };
  }

  // Handle "First Last" format
  const spaceParts = name.split(/\s+/);
  if (spaceParts.length === 1) {
    return {
      family: spaceParts[0],
      given: '',
      sequence: index === 0 ? 'first' : 'additional',
    };
  }

  return {
    family: spaceParts[spaceParts.length - 1],
    given: spaceParts.slice(0, -1).join(' '),
    sequence: index === 0 ? 'first' : 'additional',
  };
}

/**
 * Parse RIS date fields
 */
function parseRisDate(py?: string, da?: string, y1?: string): ReferenceDate {
  // Try PY (publication year) first
  const yearStr = py || y1;
  const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

  const date: ReferenceDate = { year };

  // DA format: YYYY/MM/DD or YYYY/MM or YYYY
  if (da) {
    const parts = da.split('/');
    if (parts[1]) date.month = parseInt(parts[1], 10);
    if (parts[2]) date.day = parseInt(parts[2], 10);
  }

  return date;
}

/**
 * Parse RIS string and return references
 */
export function parseRis(risStr: string): ImportResult {
  const result: ImportResult = {
    success: [],
    duplicates: [],
    errors: [],
    totalProcessed: 0,
  };

  // Split into records (each starts with TY and ends with ER)
  const records = risStr.split(/(?=TY\s+-)/);

  for (const record of records) {
    if (!record.trim() || !record.startsWith('TY')) continue;

    result.totalProcessed++;

    try {
      const fields: Record<string, string[]> = {};

      // Parse each line
      const lines = record.split('\n');
      for (const line of lines) {
        const match = line.match(/^([A-Z][A-Z0-9])\s+-\s+(.*)$/);
        if (match) {
          const [, tag, value] = match;
          if (!fields[tag]) fields[tag] = [];
          fields[tag].push(value.trim());
        }
      }

      // Convert to reference
      const type = RIS_TYPE_MAP[fields.TY?.[0] || 'GEN'] || 'document';

      const authors: ReferenceAuthor[] = [];
      (fields.AU || fields.A1 || []).forEach((name, i) => {
        authors.push(parseRisAuthor(name, i));
      });

      const editors: ReferenceAuthor[] = [];
      (fields.ED || fields.A2 || []).forEach((name, i) => {
        editors.push(parseRisAuthor(name, i));
      });

      const ref: Reference = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title: fields.TI?.[0] || fields.T1?.[0] || 'Untitled',
        titleShort: fields.ST?.[0],
        authors,
        editors: editors.length > 0 ? editors : undefined,
        issued: parseRisDate(fields.PY?.[0], fields.DA?.[0], fields.Y1?.[0]),
        abstract: fields.AB?.[0] || fields.N2?.[0],
        identifiers: {
          doi: fields.DO?.[0],
          pmid: fields.PMID?.[0],
          isbn: fields.SN?.[0],
          url: fields.UR?.[0] || fields.L2?.[0],
        },
        keywords: fields.KW,
        rawRis: record,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Venue
      if (fields.JO?.[0] || fields.JF?.[0] || fields.T2?.[0]) {
        ref.venue = {
          name: fields.JO?.[0] || fields.JF?.[0] || fields.T2?.[0],
          abbreviation: fields.JA?.[0],
          volume: fields.VL?.[0],
          issue: fields.IS?.[0],
          pages: fields.SP?.[0] && fields.EP?.[0]
            ? `${fields.SP[0]}-${fields.EP[0]}`
            : fields.SP?.[0],
        };
      }

      // Publisher
      if (fields.PB?.[0]) {
        ref.publisher = {
          name: fields.PB[0],
          location: fields.CY?.[0],
          edition: fields.ET?.[0],
        };
      }

      result.success.push(ref);
    } catch (error) {
      result.errors.push({
        entry: record.slice(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Reference type to BibTeX type mapping
 */
const REFERENCE_TO_BIBTEX: Record<ReferenceType, string> = {
  'article-journal': 'article',
  'article-magazine': 'article',
  'article-newspaper': 'article',
  'book': 'book',
  'chapter': 'incollection',
  'paper-conference': 'inproceedings',
  'thesis': 'phdthesis',
  'report': 'techreport',
  'patent': 'misc',
  'webpage': 'misc',
  'dataset': 'misc',
  'software': 'software',
  'preprint': 'unpublished',
  'manuscript': 'unpublished',
  'personal-communication': 'misc',
  'interview': 'misc',
  'broadcast': 'misc',
  'motion-picture': 'misc',
  'graphic': 'misc',
  'map': 'misc',
  'legal-case': 'misc',
  'legislation': 'misc',
  'bill': 'misc',
  'standard': 'misc',
  'review': 'article',
  'entry-encyclopedia': 'inbook',
  'entry-dictionary': 'inbook',
  'post-weblog': 'misc',
  'post': 'misc',
  'speech': 'misc',
  'document': 'misc',
  'other': 'misc',
};

/**
 * Format authors for BibTeX
 */
function formatBibtexAuthors(authors: ReferenceAuthor[]): string {
  return authors.map(a => `${a.family}, ${a.given}`).join(' and ');
}

/**
 * Export reference to BibTeX format
 */
export function referenceToBibtex(ref: Reference): string {
  const type = REFERENCE_TO_BIBTEX[ref.type] || 'misc';
  const key = ref.citeKey || generateCiteKey(ref);

  const fields: string[] = [];

  // Required fields
  fields.push(`  author = {${formatBibtexAuthors(ref.authors)}}`);
  fields.push(`  title = {${ref.title}}`);
  fields.push(`  year = {${ref.issued.year}}`);

  // Optional fields
  if (ref.venue?.name) fields.push(`  journal = {${ref.venue.name}}`);
  if (ref.venue?.volume) fields.push(`  volume = {${ref.venue.volume}}`);
  if (ref.venue?.issue) fields.push(`  number = {${ref.venue.issue}}`);
  if (ref.venue?.pages) fields.push(`  pages = {${ref.venue.pages}}`);
  if (ref.publisher?.name) fields.push(`  publisher = {${ref.publisher.name}}`);
  if (ref.publisher?.location) fields.push(`  address = {${ref.publisher.location}}`);
  if (ref.identifiers?.doi) fields.push(`  doi = {${ref.identifiers.doi}}`);
  if (ref.identifiers?.url) fields.push(`  url = {${ref.identifiers.url}}`);
  if (ref.identifiers?.isbn) fields.push(`  isbn = {${ref.identifiers.isbn}}`);
  if (ref.abstract) fields.push(`  abstract = {${ref.abstract}}`);
  if (ref.keywords?.length) fields.push(`  keywords = {${ref.keywords.join(', ')}}`);
  if (ref.issued.month) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    fields.push(`  month = {${months[ref.issued.month - 1]}}`);
  }

  return `@${type}{${key},\n${fields.join(',\n')}\n}`;
}

/**
 * Export multiple references to BibTeX
 */
export function exportToBibtex(refs: Reference[]): string {
  return refs.map(referenceToBibtex).join('\n\n');
}

/**
 * Reference type to RIS type mapping
 */
const REFERENCE_TO_RIS: Record<ReferenceType, string> = {
  'article-journal': 'JOUR',
  'article-magazine': 'MGZN',
  'article-newspaper': 'NEWS',
  'book': 'BOOK',
  'chapter': 'CHAP',
  'paper-conference': 'CONF',
  'thesis': 'THES',
  'report': 'RPRT',
  'patent': 'PAT',
  'webpage': 'ELEC',
  'dataset': 'DATA',
  'software': 'COMP',
  'preprint': 'UNPB',
  'manuscript': 'UNPB',
  'personal-communication': 'GEN',
  'interview': 'GEN',
  'broadcast': 'VIDEO',
  'motion-picture': 'VIDEO',
  'graphic': 'GEN',
  'map': 'MAP',
  'legal-case': 'CASE',
  'legislation': 'STAT',
  'bill': 'STAT',
  'standard': 'STAND',
  'review': 'JOUR',
  'entry-encyclopedia': 'ENCYC',
  'entry-dictionary': 'DICT',
  'post-weblog': 'BLOG',
  'post': 'GEN',
  'speech': 'SLIDE',
  'document': 'GEN',
  'other': 'GEN',
};

/**
 * Export reference to RIS format
 */
export function referenceToRis(ref: Reference): string {
  const lines: string[] = [];

  lines.push(`TY  - ${REFERENCE_TO_RIS[ref.type] || 'GEN'}`);

  // Authors
  for (const author of ref.authors) {
    lines.push(`AU  - ${author.family}, ${author.given}`);
  }

  // Title
  lines.push(`TI  - ${ref.title}`);
  if (ref.titleShort) lines.push(`ST  - ${ref.titleShort}`);

  // Date
  lines.push(`PY  - ${ref.issued.year}`);
  if (ref.issued.month || ref.issued.day) {
    const month = String(ref.issued.month || 1).padStart(2, '0');
    const day = String(ref.issued.day || 1).padStart(2, '0');
    lines.push(`DA  - ${ref.issued.year}/${month}/${day}`);
  }

  // Venue
  if (ref.venue?.name) lines.push(`JO  - ${ref.venue.name}`);
  if (ref.venue?.abbreviation) lines.push(`JA  - ${ref.venue.abbreviation}`);
  if (ref.venue?.volume) lines.push(`VL  - ${ref.venue.volume}`);
  if (ref.venue?.issue) lines.push(`IS  - ${ref.venue.issue}`);
  if (ref.venue?.pages) {
    const [start, end] = ref.venue.pages.split('-');
    lines.push(`SP  - ${start}`);
    if (end) lines.push(`EP  - ${end}`);
  }

  // Publisher
  if (ref.publisher?.name) lines.push(`PB  - ${ref.publisher.name}`);
  if (ref.publisher?.location) lines.push(`CY  - ${ref.publisher.location}`);

  // Identifiers
  if (ref.identifiers?.doi) lines.push(`DO  - ${ref.identifiers.doi}`);
  if (ref.identifiers?.url) lines.push(`UR  - ${ref.identifiers.url}`);
  if (ref.identifiers?.isbn) lines.push(`SN  - ${ref.identifiers.isbn}`);
  if (ref.identifiers?.pmid) lines.push(`PMID  - ${ref.identifiers.pmid}`);

  // Abstract
  if (ref.abstract) lines.push(`AB  - ${ref.abstract}`);

  // Keywords
  if (ref.keywords) {
    for (const kw of ref.keywords) {
      lines.push(`KW  - ${kw}`);
    }
  }

  lines.push('ER  - ');

  return lines.join('\n');
}

/**
 * Export multiple references to RIS
 */
export function exportToRis(refs: Reference[]): string {
  return refs.map(referenceToRis).join('\n\n');
}

/**
 * Export references to CSV
 */
export function exportToCsv(refs: Reference[]): string {
  const headers = [
    'Type', 'Title', 'Authors', 'Year', 'Journal', 'Volume', 'Issue',
    'Pages', 'DOI', 'PMID', 'URL', 'Abstract', 'Keywords'
  ];

  const escapeCSV = (str: string | undefined): string => {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = refs.map(ref => [
    ref.type,
    escapeCSV(ref.title),
    escapeCSV(ref.authors.map(a => `${a.given} ${a.family}`).join('; ')),
    ref.issued.year,
    escapeCSV(ref.venue?.name),
    ref.venue?.volume || '',
    ref.venue?.issue || '',
    ref.venue?.pages || '',
    ref.identifiers?.doi || '',
    ref.identifiers?.pmid || '',
    ref.identifiers?.url || '',
    escapeCSV(ref.abstract),
    escapeCSV(ref.keywords?.join('; ')),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export references to JSON
 */
export function exportToJson(refs: Reference[]): string {
  return JSON.stringify(refs, null, 2);
}

/**
 * Auto-detect format and parse
 */
export function parseReferences(content: string): ImportResult {
  content = content.trim();

  // Detect BibTeX
  if (content.includes('@') && content.match(/@\w+\s*\{/)) {
    return parseBibtex(content);
  }

  // Detect RIS
  if (content.startsWith('TY  -') || content.includes('\nTY  -')) {
    return parseRis(content);
  }

  // Try JSON
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return {
        success: parsed as Reference[],
        duplicates: [],
        errors: [],
        totalProcessed: parsed.length,
      };
    }
  } catch {
    // Not JSON
  }

  return {
    success: [],
    duplicates: [],
    errors: [{ entry: content.slice(0, 100), error: 'Unknown format' }],
    totalProcessed: 0,
  };
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
