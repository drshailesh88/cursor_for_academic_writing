// Paper Library - Supabase CRUD Operations

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  Paper,
  PaperContent,
  PaperMetadata,
  PaperProcessingStatus,
  PaperAuthor,
} from './schema';

type PaperRow = {
  id: string;
  user_id: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  storage_url: string | null;
  storage_path: string | null;
  title: string | null;
  authors: PaperAuthor[] | null;
  year: number | null;
  journal: string | null;
  doi: string | null;
  pmid: string | null;
  arxiv_id: string | null;
  abstract: string | null;
  keywords: string[] | null;
  tags: string[] | null;
  collections: string[] | null;
  notes: string | null;
  is_favorite: boolean | null;
  color: string | null;
  citation_count: number | null;
  impact_factor: number | null;
  open_access: boolean | null;
  processing_status: string | null;
  processing_error: string | null;
  extracted_at: string | null;
  uploaded_at: string;
  updated_at: string;
};

type PaperContentRow = {
  paper_id: string;
  user_id: string;
  full_text: string | null;
  page_count: number | null;
  sections: PaperContent['sections'] | null;
  paragraphs: PaperContent['paragraphs'] | null;
  figures: PaperContent['figures'] | null;
  tables_data: PaperContent['tables'] | null;
  references: PaperContent['references'] | null;
  equations: PaperContent['equations'] | null;
  extraction_quality: PaperContent['extractionQuality'] | null;
  ocr_required: boolean | null;
  processing_time_ms: number | null;
  extracted_at: string | null;
  updated_at: string | null;
};

function mapPaper(row: PaperRow): Paper {
  return {
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name || '',
    fileSize: row.file_size || 0,
    mimeType: row.mime_type || 'application/pdf',
    storageUrl: row.storage_url || '',
    storagePath: row.storage_path || '',
    title: row.title || row.file_name || 'Untitled Paper',
    authors: row.authors || [],
    year: row.year || undefined,
    journal: row.journal || undefined,
    doi: row.doi || undefined,
    pmid: row.pmid || undefined,
    arxivId: row.arxiv_id || undefined,
    abstract: row.abstract || undefined,
    keywords: row.keywords || undefined,
    processingStatus: (row.processing_status || 'processing') as PaperProcessingStatus,
    processingError: row.processing_error || undefined,
    extractedAt: row.extracted_at ? new Date(row.extracted_at) : undefined,
    tags: row.tags || undefined,
    collections: row.collections || undefined,
    notes: row.notes || undefined,
    isFavorite: row.is_favorite || undefined,
    color: row.color || undefined,
    citationCount: row.citation_count || undefined,
    impactFactor: row.impact_factor || undefined,
    openAccess: row.open_access || undefined,
    uploadedAt: new Date(row.uploaded_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapPaperContent(row: PaperContentRow): PaperContent {
  return {
    paperId: row.paper_id,
    userId: row.user_id,
    fullText: row.full_text || '',
    pageCount: row.page_count || 0,
    sections: row.sections || [],
    paragraphs: row.paragraphs || [],
    figures: row.figures || [],
    tables: row.tables_data || [],
    references: row.references || [],
    equations: row.equations || [],
    extractionQuality: row.extraction_quality || 'medium',
    ocrRequired: row.ocr_required || false,
    processingTimeMs: row.processing_time_ms || 0,
    extractedAt: row.extracted_at ? new Date(row.extracted_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

// ============================================================================
// PAPER STORAGE OPERATIONS
// ============================================================================

/**
 * Sanitize filename for Supabase Storage
 * Supabase Storage has strict key restrictions - only allows alphanumeric, underscores, hyphens, periods, and slashes
 */
function sanitizeFileName(fileName: string): string {
  // Separate extension from filename
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot > 0 ? fileName.slice(lastDot) : '';
  const baseName = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;

  // Sanitize the base name
  const sanitizedBase = baseName
    .replace(/[—–]/g, '-')        // Replace em-dash and en-dash with hyphen
    .replace(/:/g, '-')            // Replace colons with hyphens
    .replace(/[,;]/g, '')          // Remove commas and semicolons
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .replace(/['"]/g, '')          // Remove quotes
    .replace(/[()[\]{}]/g, '')     // Remove brackets and parentheses
    .replace(/[^a-zA-Z0-9_-]/g, '') // Remove any other special characters (no period in base)
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^[_-]+/, '')         // Remove leading underscores, hyphens
    .replace(/[_-]+$/, '')         // Remove trailing underscores, hyphens
    .slice(0, 190);                // Limit base filename length (leave room for extension)

  // Sanitize extension (just keep alphanumeric)
  const sanitizedExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, '');

  return sanitizedBase + sanitizedExt;
}

export async function uploadPaperFile(
  userId: string,
  paperId: string,
  file: File | Blob,
  fileName: string
): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseAdminClient();
  const sanitizedFileName = sanitizeFileName(fileName);
  const storagePath = `${userId}/${paperId}/${sanitizedFileName}`;

  const { error } = await supabase.storage
    .from('papers')
    .upload(storagePath, file, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw error;
  }

  const { data } = supabase.storage.from('papers').getPublicUrl(storagePath);
  return { url: data.publicUrl, path: storagePath };
}

export async function deletePaperFile(storagePath: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.storage.from('papers').remove([storagePath]);
    if (error) {
      console.warn('Failed to delete paper file:', error);
    }
  } catch (error) {
    console.warn('Failed to delete paper file:', error);
  }
}

// ============================================================================
// PAPER DOCUMENT OPERATIONS
// ============================================================================

export async function createPaper(
  userId: string,
  data: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    storageUrl: string;
    storagePath: string;
    title?: string;
  }
): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await (supabase as any)
    .from('papers')
    .insert({
      user_id: userId,
      file_name: data.fileName,
      file_size: data.fileSize,
      mime_type: data.mimeType,
      storage_url: data.storageUrl,
      storage_path: data.storagePath,
      title: data.title || data.fileName.replace(/\.pdf$/i, ''),
      authors: [],
      processing_status: 'uploading',
      uploaded_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (error || !created) {
    console.error('Error creating paper:', error);
    throw error;
  }

  return created.id as string;
}

export async function getPaper(paperId: string): Promise<Paper | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('papers').select('*').eq('id', paperId).single();

  if (error || !data) {
    return null;
  }

  return mapPaper(data as PaperRow);
}

export async function getUserPapers(
  userId: string,
  options?: {
    limit?: number;
    orderByField?: 'uploadedAt' | 'updatedAt' | 'title';
    orderDirection?: 'asc' | 'desc';
    status?: PaperProcessingStatus;
    collection?: string;
    tag?: string;
  }
): Promise<Paper[]> {
  const supabase = getSupabaseAdminClient();
  const orderFieldMap: Record<string, string> = {
    uploadedAt: 'uploaded_at',
    updatedAt: 'updated_at',
    title: 'title',
  };

  let query = supabase
    .from('papers')
    .select('*')
    .eq('user_id', userId)
    .order(orderFieldMap[options?.orderByField || 'uploadedAt'], {
      ascending: options?.orderDirection === 'asc',
    });

  if (options?.status) {
    query = query.eq('processing_status', options.status);
  }

  if (options?.collection) {
    query = query.contains('collections', [options.collection]);
  }

  if (options?.tag) {
    query = query.contains('tags', [options.tag]);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching papers:', error);
    return [];
  }

  return (data as PaperRow[]).map(mapPaper);
}

export async function getUserPaperMetadata(userId: string): Promise<PaperMetadata[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('papers')
    .select('id, title, authors, year, journal, processing_status, uploaded_at, is_favorite, tags')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching paper metadata:', error);
    return [];
  }

  return (data as PaperRow[]).map((row) => ({
    id: row.id,
    title: row.title || '',
    authors: row.authors || [],
    year: row.year || undefined,
    journal: row.journal || undefined,
    processingStatus: (row.processing_status || 'processing') as PaperProcessingStatus,
    uploadedAt: new Date(row.uploaded_at),
    isFavorite: row.is_favorite || undefined,
    tags: row.tags || undefined,
  }));
}

export async function updatePaper(
  paperId: string,
  updates: Partial<Paper>
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = {};

  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.authors !== undefined) payload.authors = updates.authors;
  if (updates.year !== undefined) payload.year = updates.year;
  if (updates.journal !== undefined) payload.journal = updates.journal;
  if (updates.doi !== undefined) payload.doi = updates.doi;
  if (updates.pmid !== undefined) payload.pmid = updates.pmid;
  if (updates.arxivId !== undefined) payload.arxiv_id = updates.arxivId;
  if (updates.abstract !== undefined) payload.abstract = updates.abstract;
  if (updates.keywords !== undefined) payload.keywords = updates.keywords;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.collections !== undefined) payload.collections = updates.collections;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.isFavorite !== undefined) payload.is_favorite = updates.isFavorite;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.citationCount !== undefined) payload.citation_count = updates.citationCount;
  if (updates.impactFactor !== undefined) payload.impact_factor = updates.impactFactor;
  if (updates.openAccess !== undefined) payload.open_access = updates.openAccess;
  if (updates.processingStatus !== undefined) payload.processing_status = updates.processingStatus;
  if (updates.processingError !== undefined) payload.processing_error = updates.processingError;
  if (updates.extractedAt !== undefined) {
    payload.extracted_at = updates.extractedAt ? updates.extractedAt.toISOString() : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('papers').update(payload).eq('id', paperId);
  if (error) {
    console.error('Error updating paper:', error);
    throw error;
  }
}

export async function updatePaperStatus(
  paperId: string,
  status: PaperProcessingStatus,
  errorMessage?: string
): Promise<void> {
  await updatePaper(paperId, {
    processingStatus: status,
    processingError: errorMessage,
  });
}

export async function updatePaperMetadata(
  paperId: string,
  metadata: Partial<Pick<Paper, 'title' | 'authors' | 'year' | 'journal' | 'doi' | 'abstract' | 'keywords'>>
): Promise<void> {
  await updatePaper(paperId, metadata);
}

export async function deletePaper(paperId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const paper = await getPaper(paperId);

  if (paper?.storagePath) {
    await deletePaperFile(paper.storagePath);
  }

  await supabase.from('paper_contents').delete().eq('paper_id', paperId);

  const { error } = await supabase.from('papers').delete().eq('id', paperId);
  if (error) {
    console.error('Error deleting paper:', error);
    throw error;
  }
}

export async function togglePaperFavorite(paperId: string): Promise<boolean> {
  const paper = await getPaper(paperId);
  if (!paper) {
    throw new Error('Paper not found');
  }

  const newValue = !paper.isFavorite;
  await updatePaper(paperId, { isFavorite: newValue });
  return newValue;
}

export async function addPaperTags(paperId: string, tags: string[]): Promise<void> {
  const paper = await getPaper(paperId);
  if (!paper) {
    throw new Error('Paper not found');
  }

  const currentTags = new Set(paper.tags || []);
  tags.forEach((tag) => currentTags.add(tag));
  await updatePaper(paperId, { tags: Array.from(currentTags) });
}

export async function removePaperTags(paperId: string, tags: string[]): Promise<void> {
  const paper = await getPaper(paperId);
  if (!paper) {
    throw new Error('Paper not found');
  }

  const updated = (paper.tags || []).filter((tag) => !tags.includes(tag));
  await updatePaper(paperId, { tags: updated });
}

// ============================================================================
// PAPER CONTENT OPERATIONS
// ============================================================================

export async function savePaperContent(
  paperId: string,
  userId: string,
  content: Omit<PaperContent, 'paperId' | 'userId' | 'extractedAt' | 'updatedAt'>
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('paper_contents')
    .upsert({
      paper_id: paperId,
      user_id: userId,
      full_text: content.fullText,
      page_count: content.pageCount,
      sections: content.sections,
      paragraphs: content.paragraphs,
      figures: content.figures,
      tables_data: content.tables,
      references: content.references,
      equations: content.equations,
      extraction_quality: content.extractionQuality,
      ocr_required: content.ocrRequired,
      processing_time_ms: content.processingTimeMs,
      extracted_at: now,
      updated_at: now,
    });

  if (error) {
    console.error('Error saving paper content:', error);
    throw error;
  }
}

export async function getPaperContent(paperId: string): Promise<PaperContent | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('paper_contents')
    .select('*')
    .eq('paper_id', paperId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPaperContent(data as PaperContentRow);
}

export async function getMultiplePaperContents(
  paperIds: string[]
): Promise<PaperContent[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('paper_contents')
    .select('*')
    .in('paper_id', paperIds);

  if (error || !data) {
    console.error('Error fetching paper contents:', error);
    return [];
  }

  return (data as PaperContentRow[]).map(mapPaperContent);
}

export async function getPapersByIds(paperIds: string[]): Promise<Paper[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('papers').select('*').in('id', paperIds);

  if (error || !data) {
    console.error('Error fetching papers by IDs:', error);
    return [];
  }

  return (data as PaperRow[]).map(mapPaper);
}

export async function getFavoritePapers(userId: string): Promise<Paper[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .eq('user_id', userId)
    .eq('is_favorite', true);

  if (error || !data) {
    console.error('Error fetching favorite papers:', error);
    return [];
  }

  return (data as PaperRow[]).map(mapPaper);
}

export async function searchPapersByTitle(
  userId: string,
  searchQuery: string
): Promise<Paper[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .eq('user_id', userId)
    .ilike('title', `%${searchQuery}%`);

  if (error || !data) {
    console.error('Error searching papers:', error);
    return [];
  }

  return (data as PaperRow[]).map(mapPaper);
}

export async function getUserPaperCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from('papers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error counting papers:', error);
    return 0;
  }

  return count || 0;
}

export async function getUserPaperTags(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('papers')
    .select('tags')
    .eq('user_id', userId);

  if (error || !data) {
    console.error('Error fetching paper tags:', error);
    return [];
  }

  const tags = new Set<string>();
  (data as Array<{ tags: string[] | null }>).forEach((row) => {
    (row.tags || []).forEach((tag) => tags.add(tag));
  });

  return Array.from(tags);
}

