// Paper Chat API
// RAG-powered chat across multiple papers with citation highlighting
//
// Architecture (compatible with portable-rag-system):
// Query → Retrieve relevant chunks → Rerank → LLM Synthesis → Response with citations

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getPaperContent, getPaper } from '@/lib/firebase/papers';
import type { PaperContent, PaperParagraph, Paper } from '@/lib/firebase/schema';

// Types for RAG pipeline
interface RetrievedChunk {
  paperId: string;
  paperTitle: string;
  authors: string;
  year?: number;
  section: string;
  text: string;
  score: number;
  paragraphId: string;
  pageNumber?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  userId: string;
  paperIds: string[];
  messages: ChatMessage[];
  model?: string;
}

interface Citation {
  paperId: string;
  paperTitle: string;
  authors: string;
  year?: number;
  section: string;
  quote: string;
  pageNumber?: number;
}

/**
 * POST /api/papers/chat
 *
 * RAG-powered multi-paper chat with citations
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { userId, paperIds, messages, model = 'gpt-4o-mini' } = body;

    if (!userId || !paperIds || paperIds.length === 0) {
      return NextResponse.json(
        { error: 'userId and paperIds are required' },
        { status: 400 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages are required' },
        { status: 400 }
      );
    }

    // Get the latest user message
    const userQuery = messages[messages.length - 1]?.content;
    if (!userQuery) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Step 1: Load paper contents
    const papersWithContent = await loadPapersWithContent(paperIds);

    if (papersWithContent.length === 0) {
      return NextResponse.json(
        { error: 'No papers found or papers not processed yet' },
        { status: 404 }
      );
    }

    // Step 2: Retrieve relevant chunks (simplified - in production, use your RAG retriever)
    const retrievedChunks = await retrieveRelevantChunks(
      userQuery,
      papersWithContent,
      10 // top_k
    );

    // Step 3: Build context with citations
    const { context, citations } = buildContextWithCitations(retrievedChunks);

    // Step 4: Build system prompt
    const systemPrompt = buildSystemPrompt(papersWithContent, citations);

    // Step 5: Stream response from LLM
    const result = await streamText({
      model: openai(model),
      system: systemPrompt,
      messages: [
        // Include conversation history (last 5 exchanges)
        ...messages.slice(-10).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      // Append context to the latest user message
      prompt: `Context from papers:\n\n${context}\n\nUser question: ${userQuery}`,
    });

    // Return streaming response with citations in header
    const response = result.toDataStreamResponse();

    // Add citations to response headers (client can parse these)
    response.headers.set('X-Citations', JSON.stringify(citations));

    return response;

  } catch (error) {
    console.error('Paper chat error:', error);
    return NextResponse.json(
      { error: 'Chat failed' },
      { status: 500 }
    );
  }
}

/**
 * Load papers with their extracted content
 */
async function loadPapersWithContent(
  paperIds: string[]
): Promise<Array<{ paper: Paper; content: PaperContent }>> {
  const results: Array<{ paper: Paper; content: PaperContent }> = [];

  await Promise.all(
    paperIds.map(async (paperId) => {
      const [paper, content] = await Promise.all([
        getPaper(paperId),
        getPaperContent(paperId),
      ]);

      if (paper && content && paper.processingStatus === 'ready') {
        results.push({ paper, content });
      }
    })
  );

  return results;
}

/**
 * Retrieve relevant chunks using simple keyword + semantic matching
 *
 * In production, replace this with your portable-rag-system retriever:
 * - Dense retrieval (vector similarity)
 * - Sparse retrieval (BM25)
 * - RRF fusion
 * - Cohere reranking
 */
async function retrieveRelevantChunks(
  query: string,
  papersWithContent: Array<{ paper: Paper; content: PaperContent }>,
  topK: number
): Promise<RetrievedChunk[]> {
  const allChunks: RetrievedChunk[] = [];
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  for (const { paper, content } of papersWithContent) {
    const authorStr = paper.authors.map(a => a.name).join(', ') || 'Unknown';

    for (const paragraph of content.paragraphs) {
      // Simple BM25-like scoring (term frequency)
      const textLower = paragraph.text.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        const termCount = (textLower.match(new RegExp(term, 'g')) || []).length;
        score += termCount * (1 / Math.log(paragraph.text.length + 1));
      }

      // Boost certain sections
      if (paragraph.section === 'abstract') score *= 1.5;
      if (paragraph.section === 'results') score *= 1.3;
      if (paragraph.section === 'conclusion') score *= 1.2;

      if (score > 0 || paragraph.section === 'abstract') {
        allChunks.push({
          paperId: paper.id,
          paperTitle: paper.title,
          authors: authorStr,
          year: paper.year,
          section: paragraph.section,
          text: paragraph.text,
          score: score || 0.1, // Give abstracts a minimum score
          paragraphId: paragraph.id,
          pageNumber: paragraph.pageNumber,
        });
      }
    }
  }

  // Sort by score and take top K
  allChunks.sort((a, b) => b.score - a.score);
  return allChunks.slice(0, topK);
}

/**
 * Build context string with citation markers
 */
function buildContextWithCitations(
  chunks: RetrievedChunk[]
): { context: string; citations: Citation[] } {
  const citations: Citation[] = [];
  const contextParts: string[] = [];

  chunks.forEach((chunk, index) => {
    const citationNum = index + 1;

    // Add citation
    citations.push({
      paperId: chunk.paperId,
      paperTitle: chunk.paperTitle,
      authors: chunk.authors,
      year: chunk.year,
      section: chunk.section,
      quote: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? '...' : ''),
      pageNumber: chunk.pageNumber,
    });

    // Format context with citation marker
    const authorYear = chunk.year
      ? `${chunk.authors.split(',')[0].split(' ').pop()}, ${chunk.year}`
      : chunk.authors.split(',')[0];

    contextParts.push(
      `[${citationNum}] (${authorYear}) - ${chunk.section}:\n"${chunk.text}"\n`
    );
  });

  return {
    context: contextParts.join('\n'),
    citations,
  };
}

/**
 * Build system prompt for academic paper Q&A
 */
function buildSystemPrompt(
  papersWithContent: Array<{ paper: Paper; content: PaperContent }>,
  citations: Citation[]
): string {
  const paperList = papersWithContent
    .map((p) => `- "${p.paper.title}" (${p.paper.year || 'n.d.'})`)
    .join('\n');

  return `You are an academic research assistant helping analyze scientific papers.

PAPERS IN CONTEXT:
${paperList}

INSTRUCTIONS:
1. Answer questions based ONLY on the provided context from these papers
2. Always cite your sources using [1], [2], etc. corresponding to the context chunks
3. If the context doesn't contain relevant information, say so clearly
4. Use academic language appropriate for research discussions
5. When comparing papers, clearly distinguish which finding comes from which paper
6. Highlight agreements and disagreements between papers when relevant

CITATION FORMAT:
- Use inline citations like: "The study found significant effects [1]"
- For direct quotes: "as the authors noted, 'exact quote here' [2]"
- When synthesizing: "Multiple studies suggest... [1, 3, 4]"

Be concise but thorough. Focus on accuracy over speculation.`;
}
