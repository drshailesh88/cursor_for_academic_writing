// Research Session API - Get and delete sessions
import { NextRequest, NextResponse } from 'next/server';
import { researchEngine } from '@/lib/deep-research/engine';
import {
  getResearchSession,
  deleteResearchSession,
  toResearchSession,
} from '@/lib/firebase/research-sessions';

/**
 * GET /api/research/[sessionId] - Get session details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    // Try to get from engine first (for active sessions)
    const engineSession = researchEngine.getSession(sessionId);
    if (engineSession) {
      return NextResponse.json({ session: engineSession });
    }

    // Fall back to Firebase (for persisted sessions)
    const firestoreSession = await getResearchSession(sessionId);
    if (firestoreSession) {
      return NextResponse.json({
        session: toResearchSession(firestoreSession),
      });
    }

    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error getting research session:', error);
    return NextResponse.json(
      { error: 'Failed to get research session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/research/[sessionId] - Cancel and delete session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    // Cancel in engine if active
    researchEngine.cancelSession(sessionId);

    // Delete from Firebase
    await deleteResearchSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting research session:', error);
    return NextResponse.json(
      { error: 'Failed to delete research session' },
      { status: 500 }
    );
  }
}
