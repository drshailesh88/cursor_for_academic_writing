import { streamText, tool } from 'ai';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getSystemPrompt, type DisciplineId } from '@/lib/prompts/disciplines';
import {
  unifiedSearch,
  searchDatabase,
  formatResultsForAI,
  generateCitation,
  type DatabaseSource,
} from '@/lib/research';

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

// Default discipline for backwards compatibility
const DEFAULT_DISCIPLINE: DisciplineId = 'life-sciences';

export async function POST(req: Request) {
  try {
    const {
      messages,
      model = 'anthropic',
      documentId,
      discipline = DEFAULT_DISCIPLINE,
    } = await req.json();

    const selectedModel = MODEL_MAP[model as keyof typeof MODEL_MAP] || MODEL_MAP.anthropic;

    // Get discipline-specific system prompt
    const systemPrompt = getSystemPrompt(discipline as DisciplineId);

    const result = await streamText({
      model: selectedModel,
      messages,
      system: systemPrompt,
      tools: {
        // Unified search across all databases
        searchResearch: tool({
          description: `Search academic databases for research papers. Automatically searches the most relevant databases for the current discipline (${discipline}). Returns papers with citations, abstracts, and metadata.`,
          parameters: z.object({
            query: z.string().describe('Search query (e.g., "machine learning protein folding")'),
            maxResults: z.number().default(15).describe('Maximum number of results'),
            yearStart: z.number().optional().describe('Filter: minimum publication year'),
            yearEnd: z.number().optional().describe('Filter: maximum publication year'),
            openAccessOnly: z.boolean().default(false).describe('Only return open access papers'),
          }),
          execute: async ({ query, maxResults, yearStart, yearEnd, openAccessOnly }) => {
            try {
              const response = await unifiedSearch({
                text: query,
                discipline: discipline as DisciplineId,
                limit: maxResults,
                yearRange: yearStart || yearEnd ? { start: yearStart, end: yearEnd } : undefined,
                openAccessOnly,
                deduplicate: true,
              });

              const citations = response.results.map((r) => generateCitation(r));
              const formatted = formatResultsForAI(response.results);

              return {
                success: true,
                count: response.results.length,
                totalFound: response.total,
                sources: response.bySource,
                duplicatesRemoved: response.deduplicated,
                searchTimeMs: response.executionTimeMs,
                citations: citations.join(', '),
                results: formatted,
                message: `Found ${response.results.length} papers across ${Object.keys(response.bySource).join(', ')}. Use these citations: ${citations.slice(0, 5).join(', ')}${citations.length > 5 ? '...' : ''}`,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed',
                message: 'Research search failed. Please try again.',
              };
            }
          },
        }),

        // PubMed-specific search (for medical/life sciences)
        searchPubMed: tool({
          description: 'Search PubMed specifically for biomedical and life sciences literature. Best for clinical medicine, pharmacology, and biology.',
          parameters: z.object({
            query: z.string().describe('PubMed search query (e.g., "SGLT2 inhibitors heart failure")'),
            maxResults: z.number().default(15).describe('Maximum number of results'),
            yearStart: z.number().optional().describe('Minimum publication year'),
            yearEnd: z.number().optional().describe('Maximum publication year'),
          }),
          execute: async ({ query, maxResults, yearStart, yearEnd }) => {
            try {
              const response = await searchDatabase('pubmed', {
                text: query,
                limit: maxResults,
                yearRange: yearStart || yearEnd ? { start: yearStart, end: yearEnd } : undefined,
              });

              const citations = response.results.map((r) => generateCitation(r));

              return {
                success: true,
                count: response.results.length,
                source: 'PubMed',
                citations: citations.join(', '),
                results: formatResultsForAI(response.results),
                message: `Found ${response.results.length} PubMed articles. Citations: ${citations.slice(0, 5).join(', ')}`,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'PubMed search failed',
              };
            }
          },
        }),

        // arXiv-specific search (for physics, CS, math)
        searchArxiv: tool({
          description: 'Search arXiv for preprints in physics, mathematics, computer science, quantitative biology, astronomy, and economics.',
          parameters: z.object({
            query: z.string().describe('arXiv search query'),
            category: z.enum([
              'physics', 'hep-ph', 'hep-th', 'cond-mat', 'quant-ph', 'astro-ph',
              'math', 'cs', 'cs.AI', 'cs.LG', 'cs.CV', 'cs.CL',
              'q-bio', 'stat', 'stat.ML', 'econ', 'eess'
            ]).optional().describe('arXiv category to filter'),
            maxResults: z.number().default(10).describe('Maximum number of results'),
          }),
          execute: async ({ query, category, maxResults }) => {
            try {
              const response = await searchDatabase('arxiv', {
                text: query,
                categories: category ? [category] : undefined,
                limit: maxResults,
              });

              const citations = response.results.map((r) => generateCitation(r));

              return {
                success: true,
                count: response.results.length,
                source: 'arXiv',
                citations: citations.join(', '),
                results: formatResultsForAI(response.results),
                message: `Found ${response.results.length} arXiv preprints. Citations: ${citations.slice(0, 5).join(', ')}`,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'arXiv search failed',
              };
            }
          },
        }),

        // Semantic Scholar search (all disciplines, with citations)
        searchSemanticScholar: tool({
          description: 'Search Semantic Scholar for papers across all disciplines. Includes citation counts and can find related papers.',
          parameters: z.object({
            query: z.string().describe('Search query'),
            maxResults: z.number().default(10).describe('Maximum number of results'),
            yearStart: z.number().optional().describe('Minimum publication year'),
            fieldsOfStudy: z.array(z.string()).optional().describe('Filter by fields (e.g., ["Computer Science", "Medicine"])'),
          }),
          execute: async ({ query, maxResults, yearStart, fieldsOfStudy }) => {
            try {
              const response = await searchDatabase('semantic-scholar', {
                text: query,
                limit: maxResults,
                yearRange: yearStart ? { start: yearStart } : undefined,
                categories: fieldsOfStudy,
              });

              const citations = response.results.map((r) => generateCitation(r));

              // Sort by citation count for this source
              const sorted = response.results.sort((a, b) =>
                (b.citationCount || 0) - (a.citationCount || 0)
              );

              return {
                success: true,
                count: sorted.length,
                source: 'Semantic Scholar',
                citations: citations.join(', '),
                results: formatResultsForAI(sorted),
                topCited: sorted.slice(0, 3).map((r) => ({
                  title: r.title,
                  citations: r.citationCount,
                  year: r.year,
                })),
                message: `Found ${sorted.length} papers. Most cited: ${sorted[0]?.title} (${sorted[0]?.citationCount} citations)`,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Semantic Scholar search failed',
              };
            }
          },
        }),

        // OpenAlex search (comprehensive, 250M+ works)
        searchOpenAlex: tool({
          description: 'Search OpenAlex, a comprehensive open catalog of 250M+ scholarly works across all disciplines.',
          parameters: z.object({
            query: z.string().describe('Search query'),
            maxResults: z.number().default(10).describe('Maximum number of results'),
            openAccessOnly: z.boolean().default(false).describe('Only return open access works'),
          }),
          execute: async ({ query, maxResults, openAccessOnly }) => {
            try {
              const response = await searchDatabase('openalex', {
                text: query,
                limit: maxResults,
                openAccessOnly,
              });

              const citations = response.results.map((r) => generateCitation(r));

              return {
                success: true,
                count: response.results.length,
                source: 'OpenAlex',
                citations: citations.join(', '),
                results: formatResultsForAI(response.results),
                message: `Found ${response.results.length} works in OpenAlex. Citations: ${citations.slice(0, 5).join(', ')}`,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'OpenAlex search failed',
              };
            }
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
