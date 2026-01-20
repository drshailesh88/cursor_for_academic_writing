// Research Sessions - Supabase CRUD

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  ResearchMode,
  SessionStatus,
  Perspective,
} from '@/lib/research/deep-research/types';

export interface ResearchSessionDoc {
  id: string;
  userId: string;
  topic: string;
  mode: ResearchMode;
  status: SessionStatus;
  progress: number;
  sourcesCollected: number;
  perspectives?: any[];
  sources?: any[];
  synthesis?: {
    content: string;
    qualityScore: number;
    wordCount: number;
    citationCount: number;
  };
  qualityScore?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  clarifications?: any[];
}

function mapSession(row: any): ResearchSessionDoc {
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

export async function createResearchSession(
  userId: string,
  topic: string,
  mode: ResearchMode
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('research_sessions')
    .insert({
      user_id: userId,
      topic,
      mode,
      status: 'planning',
      progress: 0,
      sources_collected: 0,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating research session:', error);
    throw error;
  }

  return data.id as string;
}

export async function getResearchSession(sessionId: string): Promise<ResearchSessionDoc | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapSession(data);
  } catch (error) {
    console.error('Error getting research session:', error);
    return null;
  }
}

export async function getUserResearchSessions(
  userId: string,
  maxResults: number = 50
): Promise<ResearchSessionDoc[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(maxResults);

    if (error || !data) {
      console.error('Error getting user research sessions:', error);
      return [];
    }

    return data.map(mapSession);
  } catch (error) {
    console.error('Error getting user research sessions:', error);
    return [];
  }
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  progress: number
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const payload: Record<string, unknown> = {
      status,
      progress,
    };

    if (status === 'complete') {
      payload.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
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

export async function updateSessionProgress(
  sessionId: string,
  progress: number,
  sourcesCollected: number,
  sources?: any[]
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const payload: Record<string, unknown> = {
      progress,
      sources_collected: sourcesCollected,
    };

    if (sources) {
      payload.sources = sources;
    }

    const { error } = await supabase
      .from('research_sessions')
      .update(payload)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session progress:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating session progress:', error);
    throw error;
  }
}

export async function addSessionPerspectives(
  sessionId: string,
  perspectives: Perspective[]
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('research_sessions')
      .update({ perspectives })
      .eq('id', sessionId);

    if (error) {
      console.error('Error adding session perspectives:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error adding session perspectives:', error);
    throw error;
  }
}

export async function completeSession(
  sessionId: string,
  synthesis: {
    content: string;
    qualityScore: number;
    wordCount: number;
    citationCount: number;
  },
  perspectives?: any[],
  sources?: any[]
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const payload: Record<string, unknown> = {
      status: 'complete',
      progress: 100,
      synthesis,
      quality_score: synthesis.qualityScore,
      completed_at: new Date().toISOString(),
    };

    if (perspectives) {
      payload.perspectives = perspectives;
    }

    if (sources) {
      payload.sources = sources;
    }

    const { error } = await supabase
      .from('research_sessions')
      .update(payload)
      .eq('id', sessionId);

    if (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error completing session:', error);
    throw error;
  }
}

export async function failSession(
  sessionId: string,
  errorMessage: string
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('research_sessions')
      .update({ status: 'failed', error: errorMessage })
      .eq('id', sessionId);

    if (error) {
      console.error('Error marking session as failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error marking session as failed:', error);
    throw error;
  }
}

export async function deleteResearchSession(sessionId: string): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
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

export async function addSessionClarifications(
  sessionId: string,
  clarifications: any[]
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
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
  sources: any[]
): Promise<void> {
  try {
    const session = await getResearchSession(sessionId);
    if (!session) return;

    const updatedSources = [...(session.sources || []), ...sources];
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('research_sessions')
      .update({
        sources: updatedSources,
        sources_collected: updatedSources.length,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error adding session sources:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error adding session sources:', error);
    throw error;
  }
}

export async function setSessionSynthesis(
  sessionId: string,
  synthesis: any
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();

    const simplifiedSynthesis = {
      content: synthesis.content || '',
      qualityScore: synthesis.qualityScore || 0,
      wordCount: synthesis.wordCount || 0,
      citationCount:
        synthesis.sections?.reduce(
          (count: number, s: any) => count + (s.sourceIds?.length || 0),
          0
        ) || 0,
    };

    const { error } = await supabase
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

export function toResearchSession(doc: ResearchSessionDoc): any {
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

