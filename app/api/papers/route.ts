// Papers API - List and Create papers
import { NextRequest, NextResponse } from 'next/server';
import { getUserPapers, getUserPaperMetadata } from '@/lib/firebase/papers';

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

/**
 * GET /api/papers
 * List papers for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const metadataOnly = searchParams.get('metadata') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (metadataOnly) {
      const metadata = await getUserPaperMetadata(userId);
      return NextResponse.json({ papers: metadata });
    }

    const papers = await getUserPapers(userId, {
      orderByField: 'uploadedAt',
      orderDirection: 'desc',
    });

    return NextResponse.json({ papers });
  } catch (error) {
    console.error('Error fetching papers:', error);

    // Extract more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isIndexError = errorMessage.includes('index') || errorMessage.includes('Index');

    return NextResponse.json(
      {
        error: 'Failed to fetch papers',
        details: errorMessage,
        hint: isIndexError
          ? 'A Firestore composite index is required. Check the console for a link to create it.'
          : 'Check Firebase permissions and configuration.'
      },
      { status: 500 }
    );
  }
}
