/**
 * Presentations API - CRUD Operations
 * GET /api/presentations - List user's presentations
 * POST /api/presentations - Create/save new presentation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/client';
import { Presentation } from '@/lib/presentations/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Collection name
const PRESENTATIONS_COLLECTION = 'presentations';

// ============================================================================
// TYPES
// ============================================================================

interface PresentationMetadata {
  id: string;
  title: string;
  theme: string;
  slideCount: number;
  documentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ListPresentationsResponse {
  success: boolean;
  presentations?: PresentationMetadata[];
  error?: string;
}

interface CreatePresentationResponse {
  success: boolean;
  presentationId?: string;
  error?: string;
}

// ============================================================================
// GET HANDLER - List User's Presentations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitCount = parseInt(searchParams.get('limit') || '50', 10);
    const metadataOnly = searchParams.get('metadata') === 'true';

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        } as ListPresentationsResponse,
        { status: 400 }
      );
    }

    // TODO: Verify authenticated user matches userId
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.id !== userId) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Query presentations for user
    const q = query(
      collection(getFirebaseDb(), PRESENTATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const presentations: PresentationMetadata[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      presentations.push({
        id: doc.id,
        title: data.title,
        theme: data.theme,
        slideCount: data.slides?.length || 0,
        documentId: data.documentId,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      });
    });

    return NextResponse.json({
      success: true,
      presentations,
    } as ListPresentationsResponse);

  } catch (error) {
    console.error('Error fetching presentations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch presentations',
      } as ListPresentationsResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER - Create/Save Presentation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        } as CreatePresentationResponse,
        { status: 400 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        {
          success: false,
          error: 'title is required',
        } as CreatePresentationResponse,
        { status: 400 }
      );
    }

    if (!body.theme) {
      return NextResponse.json(
        {
          success: false,
          error: 'theme is required',
        } as CreatePresentationResponse,
        { status: 400 }
      );
    }

    if (!body.slides || !Array.isArray(body.slides)) {
      return NextResponse.json(
        {
          success: false,
          error: 'slides array is required',
        } as CreatePresentationResponse,
        { status: 400 }
      );
    }

    // TODO: Verify authenticated user matches userId
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.id !== body.userId) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Create new presentation document
    const presentationRef = doc(collection(getFirebaseDb(), PRESENTATIONS_COLLECTION));

    const presentationData: Omit<Presentation, 'id'> = {
      userId: body.userId,
      documentId: body.documentId,
      title: body.title,
      description: body.description,
      theme: body.theme,
      slides: body.slides,
      settings: body.settings || {
        aspectRatio: '16:9',
        showSlideNumbers: true,
        showProgressBar: true,
        autoAdvance: false,
        autoAdvanceInterval: 30,
        transition: 'fade',
        transitionDuration: 300,
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Save to Firestore
    await setDoc(presentationRef, presentationData);

    return NextResponse.json({
      success: true,
      presentationId: presentationRef.id,
    } as CreatePresentationResponse);

  } catch (error) {
    console.error('Error creating presentation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create presentation',
      } as CreatePresentationResponse,
      { status: 500 }
    );
  }
}
