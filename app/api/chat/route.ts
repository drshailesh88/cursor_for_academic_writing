import { streamText, tool } from 'ai';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getSystemPrompt, type DisciplineId } from '@/lib/prompts/disciplines';

// Create OpenRouter provider
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL_MAP = {
  // Premium models
  'openai': openai('gpt-4o'),
  'anthropic': anthropic('claude-3-5-sonnet-20241022'),
  'google': google('gemini-2.0-flash-exp'),

  // Free OpenRouter models - Best Quality
  'openrouter-hermes-405b': openrouter('nousresearch/hermes-3-llama-3.1-405b:free'),
  'openrouter-llama-3.3-70b': openrouter('meta-llama/llama-3.3-70b-instruct:free'),
  'openrouter-qwen': openrouter('qwen/qwen-2.5-72b-instruct:free'),
  'openrouter-gemini-2-flash': openrouter('google/gemini-2.0-flash-exp:free'),

  // Free OpenRouter models - Coding
  'openrouter-deepseek-chat': openrouter('deepseek/deepseek-chat:free'),
  'openrouter-qwen-coder': openrouter('qwen/qwen-2.5-coder-32b-instruct:free'),

  // Free OpenRouter models - Fast & Light
  'openrouter-llama-3.2-3b': openrouter('meta-llama/llama-3.2-3b-instruct:free'),
  'openrouter-mistral-7b': openrouter('mistralai/mistral-7b-instruct:free'),
  'openrouter-phi-3-mini': openrouter('microsoft/phi-3-mini-128k-instruct:free'),

  // Free OpenRouter models - Other
  'openrouter-mythomax-13b': openrouter('gryphe/mythomax-l2-13b:free'),
  'openrouter-toppy-7b': openrouter('undi95/toppy-m-7b:free'),
};

// Default prompt for backwards compatibility (life-sciences focused)
const DEFAULT_DISCIPLINE: DisciplineId = 'life-sciences';

export async function POST(req: Request) {
  try {
    const {
      messages,
      model = 'anthropic',
      documentId,
      discipline = DEFAULT_DISCIPLINE
    } = await req.json();

    const selectedModel = MODEL_MAP[model as keyof typeof MODEL_MAP] || MODEL_MAP.anthropic;

    // Get discipline-specific system prompt
    const systemPrompt = getSystemPrompt(discipline as DisciplineId);

    const result = await streamText({
      model: selectedModel,
      messages,
      system: systemPrompt,
      tools: {
        searchPubMed: tool({
          description: 'Search PubMed for academic articles on a given topic. Returns articles with author-year citations. Best for life sciences, medicine, and biomedical research.',
          parameters: z.object({
            query: z.string().describe('PubMed search query (e.g., "SGLT2 inhibitors heart failure")'),
            maxResults: z.number().default(15).describe('Maximum number of results'),
            years: z.object({
              start: z.number().optional(),
              end: z.number().optional(),
            }).optional().describe('Filter by publication year range'),
          }),
          execute: async ({ query, maxResults, years }) => {
            const { searchPubMed, articleToCitation } = await import('@/lib/pubmed/client');

            const articles = await searchPubMed({
              query,
              maxResults,
              dateRange: years ? { startYear: years.start || 2015, endYear: years.end || new Date().getFullYear() } : undefined,
            });

            // Add citation format to each article
            const articlesWithCitations = articles.map(article => ({
              ...article,
              citation: articleToCitation(article),
            }));

            return {
              articles: articlesWithCitations,
              count: articles.length,
              message: `Found ${articles.length} articles. Use these citations in your writing: ${articlesWithCitations.map(a => a.citation).join(', ')}`,
            };
          },
        }),

        // Placeholder for future multi-database search
        searchArxiv: tool({
          description: 'Search arXiv for preprints in physics, mathematics, computer science, and quantitative biology. Best for physical sciences, CS, and math.',
          parameters: z.object({
            query: z.string().describe('arXiv search query'),
            category: z.enum(['physics', 'math', 'cs', 'q-bio', 'cond-mat', 'astro-ph']).optional().describe('arXiv category'),
            maxResults: z.number().default(10).describe('Maximum number of results'),
          }),
          execute: async ({ query, category, maxResults }) => {
            // TODO: Implement arXiv search in Phase 1
            return {
              message: `arXiv search coming soon. For now, use this query on arxiv.org: ${query}${category ? ` in category ${category}` : ''}`,
              status: 'not_implemented',
            };
          },
        }),

        searchSemanticScholar: tool({
          description: 'Search Semantic Scholar for papers across all scientific disciplines. Returns papers with citation counts and related work.',
          parameters: z.object({
            query: z.string().describe('Search query'),
            maxResults: z.number().default(10).describe('Maximum number of results'),
            year: z.number().optional().describe('Filter by publication year'),
          }),
          execute: async ({ query, maxResults, year }) => {
            // TODO: Implement Semantic Scholar search in Phase 1
            return {
              message: `Semantic Scholar search coming soon. For now, search at semanticscholar.org: ${query}`,
              status: 'not_implemented',
            };
          },
        }),
      },
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
