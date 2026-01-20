// Presentation CRUD Operations (Supabase-backed)
'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Presentation,
  Slide,
  PresentationSettings,
  DEFAULT_PRESENTATION_SETTINGS,
  ThemeId,
} from '../presentations/types';

/**
 * Generate unique presentation ID
 */
export function generatePresentationId(): string {
  return `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique slide ID
 */
export function generateSlideId(): string {
  return `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

type PresentationRow = {
  id: string;
  user_id: string;
  document_id: string | null;
  title: string;
  description: string | null;
  theme: ThemeId;
  slides: Slide[];
  settings: PresentationSettings;
  created_at: string;
  updated_at: string;
};

function mapPresentation(row: PresentationRow): Presentation {
  return {
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id ?? undefined,
    title: row.title,
    description: row.description || '',
    theme: row.theme,
    slides: row.slides || [],
    settings: row.settings || DEFAULT_PRESENTATION_SETTINGS,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function createPresentation(
  userId: string,
  title: string,
  theme: ThemeId,
  documentId?: string
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('presentations')
    .insert({
      user_id: userId,
      document_id: documentId || null,
      title,
      description: '',
      theme,
      slides: [],
      settings: DEFAULT_PRESENTATION_SETTINGS,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating presentation:', error);
    throw error;
  }

  return data.id as string;
}

export async function getPresentation(
  userId: string,
  presentationId: string
): Promise<Presentation | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', presentationId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapPresentation(data as PresentationRow);
  } catch (error) {
    console.error('Error getting presentation:', error);
    return null;
  }
}

export async function getUserPresentations(userId: string): Promise<Presentation[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return (data as PresentationRow[]).map(mapPresentation);
  } catch (error) {
    console.error('Error getting user presentations:', error);
    return [];
  }
}

export async function updatePresentation(
  userId: string,
  presentationId: string,
  updates: Partial<Pick<Presentation, 'title' | 'theme' | 'settings' | 'description'>>
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const payload: Record<string, unknown> = {};

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.theme !== undefined) payload.theme = updates.theme;
    if (updates.settings !== undefined) payload.settings = updates.settings;
    if (updates.description !== undefined) payload.description = updates.description;

    const { error } = await supabase
      .from('presentations')
      .update(payload)
      .eq('id', presentationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating presentation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating presentation:', error);
    throw error;
  }
}

export async function updatePresentationSlides(
  userId: string,
  presentationId: string,
  slides: Slide[]
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('presentations')
    .update({ slides })
    .eq('id', presentationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating presentation slides:', error);
    throw error;
  }
}

export async function updateSlide(
  userId: string,
  presentationId: string,
  slideIndex: number,
  slide: Slide
): Promise<void> {
  const presentation = await getPresentation(userId, presentationId);
  if (!presentation) {
    throw new Error('Presentation not found');
  }

  const updatedSlides = [...presentation.slides];
  if (slideIndex < 0 || slideIndex >= updatedSlides.length) {
    throw new Error('Invalid slide index');
  }

  updatedSlides[slideIndex] = slide;
  await updatePresentationSlides(userId, presentationId, updatedSlides);
}

export async function deletePresentation(
  userId: string,
  presentationId: string
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('presentations')
      .delete()
      .eq('id', presentationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting presentation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting presentation:', error);
    throw error;
  }
}

export function subscribeToPresententation(
  userId: string,
  presentationId: string,
  callback: (presentation: Presentation | null) => void
): () => void {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel(`presentation-${presentationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'presentations',
        filter: `id=eq.${presentationId}`,
      },
      (payload: { new: PresentationRow | null; old: PresentationRow | null }) => {
        if (payload.new) {
          callback(mapPresentation(payload.new));
        } else {
          callback(null);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
