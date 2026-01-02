/**
 * Citation Management Types
 *
 * Comprehensive reference types supporting 30+ reference types
 * and 86+ subtypes for accurate academic citations.
 *
 * Based on CSL (Citation Style Language) specification and
 * common reference manager standards (Paperpile, Zotero, Mendeley).
 */

/**
 * Primary reference types
 */
export type ReferenceType =
  | 'article-journal'      // Journal article
  | 'article-magazine'     // Magazine article
  | 'article-newspaper'    // Newspaper article
  | 'book'                 // Book
  | 'chapter'              // Book chapter
  | 'paper-conference'     // Conference paper
  | 'thesis'               // Thesis/Dissertation
  | 'report'               // Report
  | 'patent'               // Patent
  | 'webpage'              // Web page
  | 'dataset'              // Dataset
  | 'software'             // Software
  | 'preprint'             // Preprint (arXiv, bioRxiv, etc.)
  | 'manuscript'           // Unpublished manuscript
  | 'personal-communication' // Personal communication
  | 'interview'            // Interview
  | 'broadcast'            // TV/Radio broadcast
  | 'motion-picture'       // Film/Movie
  | 'graphic'              // Figure/Image
  | 'map'                  // Map
  | 'legal-case'           // Legal case
  | 'legislation'          // Legislation/Law
  | 'bill'                 // Legislative bill
  | 'standard'             // Standard (ISO, etc.)
  | 'review'               // Review article
  | 'entry-encyclopedia'   // Encyclopedia entry
  | 'entry-dictionary'     // Dictionary entry
  | 'post-weblog'          // Blog post
  | 'post'                 // Forum/Social media post
  | 'speech'               // Speech/Presentation
  | 'document'             // Generic document
  | 'other';               // Other/Unknown

/**
 * Author/Creator information
 */
export interface ReferenceAuthor {
  family: string;          // Last name
  given: string;           // First name(s)
  suffix?: string;         // Jr., III, etc.
  orcid?: string;          // ORCID identifier
  affiliation?: string;    // Institution
  sequence?: 'first' | 'additional';
}

/**
 * Date with various precision levels
 */
export interface ReferenceDate {
  year: number;
  month?: number;          // 1-12
  day?: number;            // 1-31
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  literal?: string;        // For imprecise dates like "circa 2020"
}

/**
 * External identifiers
 */
export interface ReferenceIdentifiers {
  doi?: string;            // Digital Object Identifier
  pmid?: string;           // PubMed ID
  pmcid?: string;          // PubMed Central ID
  arxiv?: string;          // arXiv ID
  isbn?: string;           // ISBN for books
  issn?: string;           // ISSN for journals
  url?: string;            // Web URL
  semanticScholarId?: string;
  openAlexId?: string;
  scopusId?: string;
  wosId?: string;          // Web of Science ID
}

/**
 * Journal/Publication venue information
 */
export interface ReferenceVenue {
  name: string;            // Full journal/venue name
  abbreviation?: string;   // Standard abbreviation
  volume?: string;
  issue?: string;
  pages?: string;          // e.g., "123-145" or "e12345"
  articleNumber?: string;  // For electronic-only journals
  supplement?: string;     // Supplement number
}

/**
 * Book/Publisher information
 */
export interface ReferencePublisher {
  name: string;            // Publisher name
  location?: string;       // City, Country
  edition?: string;        // e.g., "2nd", "Revised"
}

/**
 * Conference information
 */
export interface ReferenceConference {
  name: string;            // Conference name
  location?: string;       // City, Country
  date?: ReferenceDate;    // Conference date
  series?: string;         // Conference series name
}

/**
 * Thesis-specific information
 */
export interface ThesisInfo {
  type: 'phd' | 'masters' | 'bachelor' | 'doctoral' | 'other';
  institution: string;
  department?: string;
}

/**
 * Patent-specific information
 */
export interface PatentInfo {
  number: string;          // Patent number
  country?: string;        // Country code
  status?: 'pending' | 'granted' | 'expired';
  applicationNumber?: string;
  filingDate?: ReferenceDate;
}

/**
 * Complete reference record
 */
export interface Reference {
  // Core identification
  id: string;              // Unique ID in library
  type: ReferenceType;

  // Title and abstract
  title: string;
  titleShort?: string;     // Short title for notes
  abstract?: string;

  // Creators
  authors: ReferenceAuthor[];
  editors?: ReferenceAuthor[];
  translators?: ReferenceAuthor[];

  // Dates
  issued: ReferenceDate;   // Publication date
  accessed?: ReferenceDate; // Date accessed (for web)
  submitted?: ReferenceDate;

  // Identifiers
  identifiers: ReferenceIdentifiers;

  // Publication info
  venue?: ReferenceVenue;
  publisher?: ReferencePublisher;
  conference?: ReferenceConference;

  // Type-specific
  thesis?: ThesisInfo;
  patent?: PatentInfo;

  // Categorization
  keywords?: string[];
  subjects?: string[];     // Subject areas
  language?: string;       // ISO 639-1 code

  // Files and links
  pdfUrl?: string;
  pdfStoragePath?: string; // Firebase Storage path
  supplementaryUrls?: string[];

  // Metrics
  citationCount?: number;
  influentialCitationCount?: number;

  // User organization
  folders?: string[];      // Folder IDs
  labels?: string[];       // Label/tag names
  notes?: string;          // User notes
  favorite?: boolean;
  readStatus?: 'unread' | 'reading' | 'read';
  rating?: 1 | 2 | 3 | 4 | 5;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source?: string;         // Where it was imported from
  citeKey?: string;        // BibTeX citation key

  // Raw data for edge cases
  rawBibtex?: string;
  rawRis?: string;
}

/**
 * Citation in a document (inline citation)
 */
export interface DocumentCitation {
  id: string;              // Unique citation instance ID
  referenceId: string;     // Reference in library

  // Position in document
  position: number;        // Character offset

  // Citation options
  suppressAuthor?: boolean;  // Show only year: (2024)
  prefix?: string;           // "see " in "(see Smith, 2024)"
  suffix?: string;           // ", p. 42" in "(Smith, 2024, p. 42)"
  locator?: string;          // Page, chapter, etc.
  locatorType?: 'page' | 'chapter' | 'section' | 'paragraph' | 'figure' | 'table';

  // For grouped citations
  groupId?: string;        // Group multiple citations: (Smith, 2024; Jones, 2023)
  groupPosition?: number;  // Position within group

  // Rendered text (cached)
  renderedText?: string;   // "(Smith et al., 2024)"
}

/**
 * Citation library folder
 */
export interface LibraryFolder {
  id: string;
  name: string;
  parentId?: string;       // For nested folders
  color?: string;          // Hex color
  icon?: string;           // Icon name
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Citation library label (tag)
 */
export interface LibraryLabel {
  id: string;
  name: string;
  color: string;           // Hex color
  createdAt: Date;
}

/**
 * User's citation library
 */
export interface CitationLibrary {
  userId: string;
  references: Reference[];
  folders: LibraryFolder[];
  labels: LibraryLabel[];

  // Settings
  defaultCitationStyle?: string;  // CSL style ID
  autoGenerateCiteKey?: boolean;
  citeKeyPattern?: string;        // e.g., "[auth][year]"

  // Stats
  totalReferences: number;
  lastImportAt?: Date;
  lastExportAt?: Date;
}

/**
 * Citation style configuration
 */
export interface CitationStyle {
  id: string;              // e.g., "apa-7th-edition"
  name: string;            // e.g., "APA 7th Edition"
  shortName: string;       // e.g., "APA"
  category: 'author-date' | 'numeric' | 'note' | 'label';
  fields?: string[];       // Applicable fields (medicine, psychology, etc.)
  cslXml?: string;         // CSL XML content
  isBuiltIn: boolean;
}

/**
 * BibTeX entry for import/export
 */
export interface BibtexEntry {
  entryType: string;       // article, book, inproceedings, etc.
  citationKey: string;
  fields: Record<string, string>;
}

/**
 * RIS entry for import/export
 */
export interface RisEntry {
  type: string;            // TY field
  fields: Record<string, string | string[]>;
}

/**
 * Import result
 */
export interface ImportResult {
  success: Reference[];
  duplicates: Reference[];
  errors: { entry: string; error: string }[];
  totalProcessed: number;
}

/**
 * Search options for library
 */
export interface LibrarySearchOptions {
  query: string;
  fields?: ('title' | 'authors' | 'abstract' | 'keywords' | 'notes')[];
  types?: ReferenceType[];
  folders?: string[];
  labels?: string[];
  yearRange?: { start?: number; end?: number };
  readStatus?: 'unread' | 'reading' | 'read';
  favorite?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'author' | 'year' | 'added' | 'updated';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Helper: Format author for display
 */
export function formatAuthorDisplay(author: ReferenceAuthor): string {
  if (author.suffix) {
    return `${author.family}, ${author.given} ${author.suffix}`;
  }
  return `${author.family}, ${author.given}`;
}

/**
 * Helper: Format author for citation
 */
export function formatAuthorCitation(authors: ReferenceAuthor[]): string {
  if (authors.length === 0) return 'Unknown';
  if (authors.length === 1) return authors[0].family;
  if (authors.length === 2) return `${authors[0].family} & ${authors[1].family}`;
  return `${authors[0].family} et al.`;
}

/**
 * Helper: Format date for display
 */
export function formatDate(date: ReferenceDate): string {
  if (date.literal) return date.literal;

  const parts: string[] = [];
  if (date.year) parts.push(String(date.year));
  if (date.month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    parts.unshift(months[date.month - 1]);
  }
  if (date.day) parts.unshift(String(date.day));

  return parts.join(' ');
}

/**
 * Helper: Generate citation key from reference
 */
export function generateCiteKey(ref: Reference, pattern = '[auth][year]'): string {
  const author = ref.authors[0]?.family?.toLowerCase().replace(/[^a-z]/g, '') || 'unknown';
  const year = ref.issued.year || 'nodate';
  const title = ref.title.split(' ')[0]?.toLowerCase().replace(/[^a-z]/g, '') || '';

  return pattern
    .replace('[auth]', author)
    .replace('[Auth]', author.charAt(0).toUpperCase() + author.slice(1))
    .replace('[year]', String(year))
    .replace('[title]', title)
    .replace('[Title]', title.charAt(0).toUpperCase() + title.slice(1));
}

/**
 * Helper: Create reference from search result
 */
export function searchResultToReference(
  result: {
    id: string;
    title: string;
    authors: { name: string; firstName?: string; lastName?: string }[];
    abstract?: string;
    year: number;
    doi?: string;
    pmid?: string;
    arxivId?: string;
    url?: string;
    pdfUrl?: string;
    citationCount?: number;
    venue?: string;
    source: string;
  }
): Reference {
  const authors: ReferenceAuthor[] = result.authors.map((a, i) => ({
    family: a.lastName || a.name.split(' ').pop() || '',
    given: a.firstName || a.name.split(' ').slice(0, -1).join(' ') || '',
    sequence: i === 0 ? 'first' : 'additional',
  }));

  const type: ReferenceType = result.arxivId ? 'preprint' :
    result.pmid ? 'article-journal' : 'article-journal';

  return {
    id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: result.title,
    authors,
    abstract: result.abstract,
    issued: { year: result.year },
    identifiers: {
      doi: result.doi,
      pmid: result.pmid,
      arxiv: result.arxivId,
      url: result.url,
    },
    pdfUrl: result.pdfUrl,
    citationCount: result.citationCount,
    venue: result.venue ? { name: result.venue } : undefined,
    source: result.source,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
