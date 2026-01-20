// Paper Chat Engine
// AI-powered conversations with academic papers

import type {
  Paper,
  PaperContent,
  PaperChatCitation,
  PaperParagraph,
} from '@/lib/supabase/schema';
import { hybridRetrieve, buildContext, papersToChunks } from '@/lib/rag/retriever';
import type { TextChunk, RetrievalConfig } from '@/lib/rag/types';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';

/**
 * Supported AI models for paper chat
 */
export type ChatModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'gemini-2.0-flash-exp';

/**
 * Chat message
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: PaperChatCitation[];
}

/**
 * Chat response with citations
 */
export interface ChatResponse {
  content: string;
  citations: PaperChatCitation[];
  relevantParagraphs: PaperParagraph[];
  model: ChatModel;
  tokensUsed?: number;
}

/**
 * Options for paper chat
 */
export interface ChatOptions {
  model?: ChatModel;
  temperature?: number;
  maxTokens?: number;
  retrievalConfig?: Partial<RetrievalConfig>;
  includeFullContext?: boolean;
  citationStyle?: 'inline' | 'numbered' | 'none';
}

const DEFAULT_CHAT_OPTIONS: ChatOptions = {
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 2000,
  includeFullContext: false,
  citationStyle: 'inline',
};

/**
 * Chat with a single paper
 * Retrieves relevant paragraphs and generates response with citations
 */
export async function chatWithPaper(
  paperId: string,
  paper: Paper,
  content: PaperContent,
  message: string,
  conversationHistory: ChatMessage[] = [],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const opts = { ...DEFAULT_CHAT_OPTIONS, ...options };

  // Convert paper content to chunks for retrieval
  const chunks = paperContentToChunks(paperId, paper, content);

  // Find relevant paragraphs using hybrid retrieval
  const { results, citations } = await hybridRetrieve(message, chunks, opts.retrievalConfig);

  // Build context from retrieved paragraphs
  const context = buildContext(results);

  // Generate response
  const response = await generateChatResponse(
    message,
    context,
    conversationHistory,
    opts,
    `You are chatting about the paper: "${paper.title}" by ${paper.authors.map(a => a.name).join(', ')}.`
  );

  // Map RAG citations to PaperChatCitations
  const paperCitations: PaperChatCitation[] = citations.map((c) => ({
    paperId,
    paragraphId: c.paperId, // This is actually the chunk ID
    pageNumber: c.pageNumber,
    quote: c.quote,
  }));

  return {
    content: response.content,
    citations: paperCitations,
    relevantParagraphs: results.map((r) => ({
      id: r.chunk.id,
      section: r.chunk.section || 'unknown',
      text: r.chunk.text,
      pageNumber: r.chunk.pageNumber,
      order: r.chunk.chunkIndex,
    })),
    model: opts.model!,
    tokensUsed: response.tokensUsed,
  };
}

/**
 * Chat with multiple papers
 * Retrieves relevant paragraphs from all papers and synthesizes response
 */
export async function chatWithPapers(
  papers: Array<{ paper: Paper; content: PaperContent }>,
  message: string,
  conversationHistory: ChatMessage[] = [],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const opts = { ...DEFAULT_CHAT_OPTIONS, ...options };

  // Convert all papers to chunks
  const allChunks: TextChunk[] = [];
  for (const { paper, content } of papers) {
    const chunks = paperContentToChunks(paper.id, paper, content);
    allChunks.push(...chunks);
  }

  // Find relevant paragraphs across all papers
  const { results, citations } = await hybridRetrieve(message, allChunks, opts.retrievalConfig);

  // Build context from retrieved paragraphs
  const context = buildContext(results);

  // Create paper list for system prompt
  const paperList = papers
    .map((p) => `- "${p.paper.title}" (${p.paper.year || 'n.d.'}) by ${p.paper.authors.map(a => a.name).join(', ')}`)
    .join('\n');

  // Generate response
  const response = await generateChatResponse(
    message,
    context,
    conversationHistory,
    opts,
    `You are chatting about these ${papers.length} papers:\n${paperList}\n\nSynthesize insights across papers when relevant.`
  );

  // Map RAG citations to PaperChatCitations
  const paperCitations: PaperChatCitation[] = citations.map((c) => {
    // Extract paper ID from chunk ID
    const chunkPaperId = c.paperId || '';

    return {
      paperId: chunkPaperId,
      paragraphId: c.paperId, // Chunk ID
      pageNumber: c.pageNumber,
      quote: c.quote,
    };
  });

  return {
    content: response.content,
    citations: paperCitations,
    relevantParagraphs: results.map((r) => ({
      id: r.chunk.id,
      section: r.chunk.section || 'unknown',
      text: r.chunk.text,
      pageNumber: r.chunk.pageNumber,
      order: r.chunk.chunkIndex,
    })),
    model: opts.model!,
    tokensUsed: response.tokensUsed,
  };
}

/**
 * Generate chat response using AI model
 */
async function generateChatResponse(
  message: string,
  context: string,
  conversationHistory: ChatMessage[],
  options: ChatOptions,
  systemContext: string
): Promise<{ content: string; tokensUsed?: number }> {
  const model = getModel(options.model!);

  const systemPrompt = `${systemContext}

You are an expert research assistant helping users understand academic papers.

Context from relevant sections:
${context}

Instructions:
- Answer the user's question based on the provided context
- Be accurate and cite specific findings from the papers
- If the context doesn't contain enough information to answer fully, acknowledge this
- Use academic language but remain accessible
- Reference specific sections or findings when relevant
- Compare/contrast findings across papers when discussing multiple papers`;

  // Build messages array
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  try {
    const result = await generateText({
      model,
      messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    return {
      content: result.text,
      tokensUsed: result.usage?.totalTokens,
    };
  } catch (error) {
    console.error('Chat generation failed:', error);
    throw new Error('Failed to generate chat response');
  }
}

/**
 * Generate citations in response text
 * Adds paragraph-level citations to the response
 */
export function generateCitations(
  responseText: string,
  citations: PaperChatCitation[],
  papers: Paper[],
  style: 'inline' | 'numbered' | 'footnote' | 'none' = 'inline'
): string {
  if (style === 'none' || citations.length === 0) {
    return responseText;
  }

  // For inline style, we'd need to parse the response and insert citations
  // This is a simplified version that adds citations at the end

  if (style === 'numbered') {
    let citedText = responseText;
    const citationList = citations
      .map((c, i) => {
        const paper = papers.find((p) => p.id === c.paperId);
        if (!paper) return '';

        const authors = paper.authors.map((a) => a.name).join(', ');
        const year = paper.year || 'n.d.';
        const page = c.pageNumber ? `, p. ${c.pageNumber}` : '';

        return `[${i + 1}] ${authors} (${year}). ${paper.title}${page}`;
      })
      .filter(Boolean)
      .join('\n');

    return `${citedText}\n\nReferences:\n${citationList}`;
  }

  return responseText;
}

/**
 * Find relevant paragraphs for a query using semantic search
 */
export async function findRelevantParagraphs(
  query: string,
  paper: Paper,
  content: PaperContent,
  topK: number = 5,
  retrievalConfig?: Partial<RetrievalConfig>
): Promise<Array<{ paragraph: PaperParagraph; relevanceScore: number }>> {
  // Convert paper to chunks
  const chunks = paperContentToChunks(paper.id, paper, content);

  // Perform retrieval
  const { results } = await hybridRetrieve(query, chunks, {
    ...retrievalConfig,
    rerankTopK: topK,
  });

  // Map results to paragraphs with scores
  return results.map((r) => ({
    paragraph: {
      id: r.chunk.id,
      section: r.chunk.section || 'unknown',
      text: r.chunk.text,
      pageNumber: r.chunk.pageNumber,
      order: r.chunk.chunkIndex,
    },
    relevanceScore: r.score,
  }));
}

/**
 * Stream chat response (for real-time UI updates)
 */
export async function streamChatWithPaper(
  paperId: string,
  paper: Paper,
  content: PaperContent,
  message: string,
  conversationHistory: ChatMessage[] = [],
  options: ChatOptions = {}
): Promise<ReadableStream> {
  const opts = { ...DEFAULT_CHAT_OPTIONS, ...options };

  // Convert paper content to chunks
  const chunks = paperContentToChunks(paperId, paper, content);

  // Find relevant paragraphs
  const { results } = await hybridRetrieve(message, chunks, opts.retrievalConfig);

  // Build context
  const context = buildContext(results);

  const model = getModel(opts.model!);

  const systemPrompt = `You are chatting about the paper: "${paper.title}" by ${paper.authors.map(a => a.name).join(', ')}.

Context from relevant sections:
${context}

Answer the user's question based on the provided context. Be accurate and cite specific findings.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  const result = await streamText({
    model,
    messages,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
  });

  return result.toTextStreamResponse().body!;
}

// Helper functions

/**
 * Convert paper content to text chunks for RAG
 */
function paperContentToChunks(
  paperId: string,
  paper: Paper,
  content: PaperContent
): TextChunk[] {
  const chunks: TextChunk[] = [];

  for (let i = 0; i < content.paragraphs.length; i++) {
    const para = content.paragraphs[i];

    chunks.push({
      id: `${paperId}-para-${i}`,
      paperId,
      paperTitle: paper.title,
      authors: paper.authors.map((a) => a.name).join(', '),
      year: paper.year,
      text: para.text,
      section: para.section,
      pageNumber: para.pageNumber,
      chunkIndex: i,
    });
  }

  return chunks;
}

/**
 * Get AI model instance
 */
function getModel(modelId: ChatModel) {
  if (modelId.startsWith('gpt-')) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openai(modelId);
  } else if (modelId.startsWith('claude-')) {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic(modelId);
  } else if (modelId.startsWith('gemini-')) {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    return google(modelId);
  }

  throw new Error(`Unsupported model: ${modelId}`);
}

/**
 * Extract citations from AI response text
 * Looks for citation markers like [1], (Smith et al., 2023), etc.
 */
export function extractCitationsFromText(
  text: string,
  availablePapers: Paper[]
): PaperChatCitation[] {
  const citations: PaperChatCitation[] = [];

  // Pattern 1: Numbered citations [1], [2], etc.
  const numberedPattern = /\[(\d+)\]/g;
  let match;

  while ((match = numberedPattern.exec(text)) !== null) {
    const citationNum = parseInt(match[1], 10);
    if (citationNum > 0 && citationNum <= availablePapers.length) {
      const paper = availablePapers[citationNum - 1];
      citations.push({
        paperId: paper.id,
      });
    }
  }

  // Pattern 2: Author-year citations (Author et al., YEAR)
  const authorYearPattern = /\(([A-Z][a-z]+(?:\s+et al\.)?),?\s+(\d{4})\)/g;

  while ((match = authorYearPattern.exec(text)) !== null) {
    const authorName = match[1];
    const year = parseInt(match[2], 10);

    // Try to match to a paper
    const paper = availablePapers.find((p) => {
      const hasAuthor = p.authors.some((a) => a.lastName?.includes(authorName.replace(' et al.', '')));
      const hasYear = p.year === year;
      return hasAuthor && hasYear;
    });

    if (paper) {
      citations.push({
        paperId: paper.id,
      });
    }
  }

  // Remove duplicates
  const uniqueCitations = Array.from(
    new Map(citations.map((c) => [c.paperId, c])).values()
  );

  return uniqueCitations;
}

/**
 * Build conversation summary
 * Useful for maintaining context in long conversations
 */
export async function summarizeConversation(
  messages: ChatMessage[],
  model: ChatModel = 'gpt-4o-mini'
): Promise<string> {
  const modelInstance = getModel(model);

  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const result = await generateText({
    model: modelInstance,
    messages: [
      {
        role: 'system',
        content: 'Summarize the following conversation about academic papers in 2-3 sentences. Focus on key questions asked and insights discussed.',
      },
      {
        role: 'user',
        content: conversationText,
      },
    ],
    temperature: 0.3,
    maxTokens: 300,
  });

  return result.text;
}
