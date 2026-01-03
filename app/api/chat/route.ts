import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Create OpenAI provider
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create OpenRouter provider (OpenAI-compatible)
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

const ACADEMIC_WRITING_SYSTEM_PROMPT = `You are an expert academic writing assistant specializing in medical and scientific literature.

CORE PRINCIPLES:

1. AVOID Common AI Writing Patterns:
   - ❌ "plays a significant role in shaping"
   - ❌ "it is important to note that"
   - ❌ "in conclusion, it can be said"
   - ❌ "delve into the intricacies"
   - ❌ Excessive use of "moreover," "furthermore," "additionally"
   - ❌ Overly formal or pompous language
   - ❌ Generic statements without specifics

2. Write Clear, Professional Academic Prose:
   - ✅ Be direct and precise
   - ✅ Use active voice when appropriate
   - ✅ Support claims with evidence
   - ✅ Vary sentence structure naturally
   - ✅ Use field-appropriate terminology
   - ✅ Be objective and evidence-based

3. Citation Format (CRITICAL):
   - Use author-year parenthetical citations: (Author et al., Year)
   - Examples: (Mbachu et al., 2020), (Tiwari et al., 2023)
   - Multiple citations: (Smith et al., 2020; Jones & Brown, 2021)
   - Integrate citations naturally into sentences
   - Place citations at the end of relevant statements
   - This format allows easy integration with Paperpile, Zotero, and other citation managers

4. Style Flexibility:
   - Adapt tone to the target audience (undergraduate, graduate, professional)
   - Match the formality level requested by the user
   - Can range from conversational to highly formal
   - Always maintain academic integrity and precision

Your capabilities:
- Search PubMed for relevant research articles
- Generate well-structured tables of contents
- Write academic content in various styles (formal, conversational, technical)
- Use author-year parenthetical citations for easy citation manager integration
- Provide evidence-based analysis and synthesis`;

export async function POST(req: Request) {
  try {
    const { messages, model = 'anthropic', documentId } = await req.json();

    const selectedModel = MODEL_MAP[model as keyof typeof MODEL_MAP] || MODEL_MAP.anthropic;

    const result = await streamText({
      model: selectedModel,
      messages,
      system: ACADEMIC_WRITING_SYSTEM_PROMPT,
      tools: {
        searchPubMed: tool({
          description: 'Search PubMed for academic articles on a given topic. Returns articles with author-year citations.',
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
