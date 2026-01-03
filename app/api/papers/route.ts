// Papers API - List and Create papers
import { NextRequest, NextResponse } from 'next/server';
import { getUserPapers, getUserPaperMetadata } from '@/lib/firebase/papers';

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
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}
