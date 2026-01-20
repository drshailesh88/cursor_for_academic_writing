import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Document, DisciplineId } from '@/lib/supabase/schema';

type DocumentRow = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  word_count: number | null;
  citations?: unknown;
  tags?: string[] | null;
  folder?: string | null;
  discipline?: string | null;
  created_at: string;
  updated_at: string;
};

function mapDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content ?? '',
    wordCount: row.word_count ?? 0,
    citations: (row.citations as Document['citations']) || [],
    tags: row.tags ?? undefined,
    folder: row.folder ?? undefined,
    discipline: row.discipline as DisciplineId | undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getDocument(documentId: string): Promise<Document | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapDocument(data as DocumentRow);
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
}
