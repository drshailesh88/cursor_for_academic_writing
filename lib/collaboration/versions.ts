// Supabase operations for document version history
'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getDocument, updateDocument } from '@/lib/supabase/documents';
import type { DocumentVersion, CreateVersionOptions } from './types';

const MAX_VERSIONS = 50;

type VersionRow = {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content: string;
  word_count: number;
  user_id: string;
  user_name: string;
  label: string | null;
  description: string | null;
  type: 'auto' | 'manual';
  created_at: string;
};

function mapVersion(row: VersionRow): DocumentVersion {
  return {
    id: row.id,
    documentId: row.document_id,
    versionNumber: row.version_number,
    title: row.title,
    content: row.content,
    wordCount: row.word_count,
    userId: row.user_id,
    userName: row.user_name,
    label: row.label || undefined,
    description: row.description || undefined,
    createdAt: new Date(row.created_at).getTime(),
    type: row.type,
  };
}

export async function createVersion(
  documentId: string,
  content: string,
  wordCount: number,
  userId: string,
  userName: string,
  options: CreateVersionOptions
): Promise<string> {
  try {
    const document = await getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const supabase = getSupabaseBrowserClient();
    const { data: latest, error: latestError } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (latestError) {
      console.error('Error reading latest version:', latestError);
    }

    const nextVersionNumber = (latest?.[0]?.version_number || 0) + 1;

    const { data, error } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_number: nextVersionNumber,
        title: document.title,
        content,
        word_count: wordCount,
        user_id: userId,
        user_name: userName,
        label: options.label || null,
        description: options.description || null,
        type: options.type,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error creating version:', error);
      throw error;
    }

    await cleanupOldVersions(documentId, options.type);
    return data.id as string;
  } catch (error) {
    console.error('Error creating version:', error);
    throw error;
  }
}

export async function getVersions(
  documentId: string,
  limitCount: number = MAX_VERSIONS
): Promise<DocumentVersion[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error || !data) {
      return [];
    }

    return (data as VersionRow[]).map(mapVersion);
  } catch (error) {
    console.error('Error getting versions:', error);
    return [];
  }
}

export async function getVersion(
  documentId: string,
  versionId: string
): Promise<DocumentVersion | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('id', versionId)
      .eq('document_id', documentId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapVersion(data as VersionRow);
  } catch (error) {
    console.error('Error getting version:', error);
    return null;
  }
}

export async function deleteVersion(
  documentId: string,
  versionId: string
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('document_versions')
      .delete()
      .eq('id', versionId)
      .eq('document_id', documentId);

    if (error) {
      console.error('Error deleting version:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting version:', error);
    throw error;
  }
}

export async function restoreVersion(
  documentId: string,
  versionId: string,
  currentUserId: string,
  currentUserName: string
): Promise<void> {
  try {
    const currentDocument = await getDocument(documentId);
    if (!currentDocument) {
      throw new Error('Document not found');
    }

    const version = await getVersion(documentId, versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    await createVersion(
      documentId,
      currentDocument.content,
      currentDocument.wordCount,
      currentUserId,
      currentUserName,
      {
        type: 'manual',
        label: 'Pre-restore backup',
        description: `Backup before restoring to version ${version.versionNumber}`,
      }
    );

    await updateDocument(documentId, {
      content: version.content,
      title: version.title,
      wordCount: version.wordCount,
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    throw error;
  }
}

export async function updateVersionLabel(
  documentId: string,
  versionId: string,
  label: string
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('document_versions')
      .update({ label })
      .eq('id', versionId)
      .eq('document_id', documentId);

    if (error) {
      console.error('Error updating version label:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating version label:', error);
    throw error;
  }
}

export async function updateVersionDescription(
  documentId: string,
  versionId: string,
  description: string
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('document_versions')
      .update({ description })
      .eq('id', versionId)
      .eq('document_id', documentId);

    if (error) {
      console.error('Error updating version description:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating version description:', error);
    throw error;
  }
}

async function cleanupOldVersions(
  documentId: string,
  versionType: 'auto' | 'manual'
): Promise<void> {
  if (versionType !== 'auto') {
    return;
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('document_versions')
      .select('id')
      .eq('document_id', documentId)
      .eq('type', 'auto')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return;
    }

    if (data.length > MAX_VERSIONS) {
      const toDelete = data.slice(MAX_VERSIONS).map((row: { id: string }) => row.id);
      await supabase.from('document_versions').delete().in('id', toDelete);
    }
  } catch (error) {
    console.error('Error cleaning up old versions:', error);
  }
}

export async function getVersionStats(documentId: string): Promise<{
  totalVersions: number;
  manualVersions: number;
  autoVersions: number;
  latestVersion?: DocumentVersion;
}> {
  try {
    const versions = await getVersions(documentId);

    return {
      totalVersions: versions.length,
      manualVersions: versions.filter((v) => v.type === 'manual').length,
      autoVersions: versions.filter((v) => v.type === 'auto').length,
      latestVersion: versions[0],
    };
  } catch (error) {
    console.error('Error getting version stats:', error);
    return {
      totalVersions: 0,
      manualVersions: 0,
      autoVersions: 0,
    };
  }
}

