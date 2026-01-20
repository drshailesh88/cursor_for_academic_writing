import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  ResearchMode,
  SessionStatus,
} from '@/lib/research/deep-research/types';

interface ResearchSessionSynthesis {
  content: string;
  qualityScore: number;
  wordCount: number;
  citationCount: number;
}

interface ResearchSessionRow {
  id: string;
  user_id: string;
  topic: string;
  mode: ResearchMode;
  status: SessionStatus;
  progress: number | null;
  sources_collected: number | null;
  perspectives: unknown[] | null;
  sources: unknown[] | null;
  synthesis: ResearchSessionSynthesis | null;
  quality_score: number | null;
  clarifications: unknown[] | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

type ResearchSessionInsert = {
  id?: string;
  user_id: string;
  topic: string;
  mode: ResearchMode;
  status: SessionStatus;
  progress?: number | null;
  sources_collected?: number | null;
  perspectives?: unknown[] | null;
  sources?: unknown[] | null;
  synthesis?: ResearchSessionSynthesis | null;
  quality_score?: number | null;
  clarifications?: unknown[] | null;
  error?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
};

type ResearchSessionUpdate = Partial<ResearchSessionInsert>;

type ResearchSessionsDatabase = {
  public: {
    Tables: {
      research_sessions: {
        Row: ResearchSessionRow;
        Insert: ResearchSessionInsert;
        Update: ResearchSessionUpdate;
      };
    };
  };
};

export interface ResearchSessionDoc {
  id: string;
  userId: string;
  topic: string;
  mode: ResearchMode;
  status: SessionStatus;
  progress: number;
  sourcesCollected: number;
  perspectives?: unknown[];
  sources?: unknown[];
  synthesis?: ResearchSessionSynthesis;
  qualityScore?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  clarifications?: unknown[];
}

function getAdminClient(): SupabaseClient<ResearchSessionsDatabase> {
  return getSupabaseAdminClient() as SupabaseClient<ResearchSessionsDatabase>;
}

function mapSession(row: ResearchSessionRow): ResearchSessionDoc {
  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    mode: row.mode,
    status: row.status,
    progress: row.progress ?? 0,
    sourcesCollected: row.sources_collected ?? 0,
    perspectives: row.perspectives || undefined,
    sources: row.sources || undefined,
    synthesis: row.synthesis || undefined,
    qualityScore: row.quality_score ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    error: row.error || undefined,
    clarifications: row.clarifications || undefined,
  };
}

export async function getResearchSession(sessionId: string): Promise<ResearchSessionDoc | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapSession(data as ResearchSessionRow);
  } catch (error) {
    console.error('Error getting research session:', error);
    return null;
  }
}

export async function createResearchSession(params: {
  id?: string;
  userId: string;
  topic: string;
  mode: ResearchMode;
  status?: SessionStatus;
  progress?: number;
}): Promise<string> {
  try {
    const supabase = getAdminClient();
    const payload: ResearchSessionInsert = {
      id: params.id,
      user_id: params.userId,
      topic: params.topic,
      mode: params.mode,
      status: params.status ?? 'clarifying',
      progress: params.progress ?? 0,
      sources_collected: 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('research_sessions')
      .insert(payload)
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error creating research session:', error);
      throw error || new Error('Failed to create research session');
    }

    return data.id as string;
  } catch (error) {
    console.error('Error creating research session:', error);
    throw error;
  }
}

export async function deleteResearchSession(sessionId: string): Promise<void> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from('research_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting research session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting research session:', error);
    throw error;
  }
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  progress: number
): Promise<void> {
  try {
    const supabase = getAdminClient();
    const payload: Record<string, unknown> = {
      status,
      progress,
    };

    if (status === 'complete') {
      payload.completed_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('research_sessions')
      .update(payload)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
}

export async function addSessionClarifications(
  sessionId: string,
  clarifications: unknown[]
): Promise<void> {
  try {
    const supabase = getAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('research_sessions')
      .update({ clarifications })
      .eq('id', sessionId);

    if (error) {
      console.error('Error adding session clarifications:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error adding session clarifications:', error);
    throw error;
  }
}

export async function addSessionSources(
  sessionId: string,
  sources: unknown[]
): Promise<void> {
  try {
    const supabase = getAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('research_sessions')
      .select('sources, sources_collected')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      throw error;
    }

    const row = data as Pick<ResearchSessionRow, 'sources' | 'sources_collected'>;
    const existingSources = row.sources ?? [];
    const updatedSources = [...existingSources, ...sources];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('research_sessions')
      .update({
        sources: updatedSources,
        sources_collected: updatedSources.length,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error adding session sources:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Error adding session sources:', error);
    throw error;
  }
}

export async function setSessionSynthesis(
  sessionId: string,
  synthesis: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getAdminClient();

    const simplifiedSynthesis: ResearchSessionSynthesis = {
      content: typeof synthesis.content === 'string' ? synthesis.content : '',
      qualityScore:
        typeof synthesis.qualityScore === 'number' ? synthesis.qualityScore : 0,
      wordCount: typeof synthesis.wordCount === 'number' ? synthesis.wordCount : 0,
      citationCount:
        Array.isArray(synthesis.sections)
          ? synthesis.sections.reduce((count, section) => {
              const sectionValue = section as { sourceIds?: unknown };
              return count + (Array.isArray(sectionValue.sourceIds) ? sectionValue.sourceIds.length : 0);
            }, 0)
          : 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('research_sessions')
      .update({
        synthesis: simplifiedSynthesis,
        quality_score: simplifiedSynthesis.qualityScore,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error setting session synthesis:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error setting session synthesis:', error);
    throw error;
  }
}

export function toResearchSession(doc: ResearchSessionDoc): Record<string, unknown> {
  return {
    id: doc.id,
    userId: doc.userId,
    topic: doc.topic,
    mode: doc.mode,
    status: doc.status,
    progress: doc.progress,
    perspectives: doc.perspectives || [],
    sources: doc.sources || [],
    synthesis: doc.synthesis,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    completedAt: doc.completedAt,
  };
}
