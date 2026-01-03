// Smart Model Router
// Selects the most cost-effective model based on query complexity

import { ModelConfig, AVAILABLE_MODELS, ModelTier } from './types';

interface QueryAnalysis {
  isSimple: boolean;
  requiresReasoning: boolean;
  contextLength: number;
  estimatedOutputTokens: number;
}

interface ModelSelection {
  model: ModelConfig;
  reason: string;
  estimatedCost: number;
}

/**
 * Analyze query complexity to determine appropriate model
 */
function analyzeQuery(query: string, contextLength: number): QueryAnalysis {
  const queryLower = query.toLowerCase();

  // Simple queries: definitions, lists, factual lookups
  const simplePatterns = [
    /^what is/,
    /^who is/,
    /^when did/,
    /^where is/,
    /^define/,
    /^list/,
    /^name/,
    /^how many/,
  ];

  const isSimple = simplePatterns.some((p) => p.test(queryLower));

  // Complex queries requiring reasoning
  const reasoningPatterns = [
    /compare/,
    /contrast/,
    /analyze/,
    /evaluate/,
    /explain why/,
    /what are the implications/,
    /how does .* relate to/,
    /synthesize/,
    /critique/,
    /argue/,
  ];

  const requiresReasoning = reasoningPatterns.some((p) => p.test(queryLower));

  // Estimate output tokens based on query type
  let estimatedOutputTokens = 200; // Default short response
  if (requiresReasoning) {
    estimatedOutputTokens = 800; // Longer analytical response
  }
  if (queryLower.includes('detail') || queryLower.includes('comprehensive')) {
    estimatedOutputTokens = 1200;
  }

  return {
    isSimple,
    requiresReasoning,
    contextLength,
    estimatedOutputTokens,
  };
}

/**
 * Calculate estimated cost for a model given the analysis
 */
function calculateCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M;
  return inputCost + outputCost;
}

/**
 * Select the most appropriate model based on query and context
 */
export function selectModel(
  query: string,
  contextLength: number,
  preferredTier?: ModelTier
): ModelSelection {
  const analysis = analyzeQuery(query, contextLength);

  // Estimate input tokens (context + query + system prompt)
  const systemPromptTokens = 500; // Approximate
  const queryTokens = Math.ceil(query.length / 4);
  const contextTokens = Math.ceil(contextLength / 4);
  const totalInputTokens = systemPromptTokens + queryTokens + contextTokens;

  // If user has a preferred tier, try to use it
  if (preferredTier) {
    const preferredModels = Object.values(AVAILABLE_MODELS).filter(
      (m) => m.tier === preferredTier
    );
    if (preferredModels.length > 0) {
      const model = preferredModels[0];
      return {
        model,
        reason: `User preferred tier: ${preferredTier}`,
        estimatedCost: calculateCost(model, totalInputTokens, analysis.estimatedOutputTokens),
      };
    }
  }

  // Decision logic
  let selectedModel: ModelConfig;
  let reason: string;

  // For simple queries with short context, use economy tier
  if (analysis.isSimple && contextTokens < 2000) {
    selectedModel = AVAILABLE_MODELS['gemini-1.5-flash'];
    reason = 'Simple query with short context - using economy model';
  }
  // For long context, prefer Gemini (1M token window) or GPT-4o-mini
  else if (contextTokens > 50000) {
    selectedModel = AVAILABLE_MODELS['gemini-1.5-flash'];
    reason = 'Long context - using Gemini for large context window';
  }
  // For complex reasoning, use standard tier
  else if (analysis.requiresReasoning) {
    selectedModel = AVAILABLE_MODELS['gpt-4o-mini'];
    reason = 'Complex reasoning required - using standard model';
  }
  // Default to economy for cost savings
  else {
    selectedModel = AVAILABLE_MODELS['gemini-1.5-flash'];
    reason = 'Default selection - economy model for cost efficiency';
  }

  return {
    model: selectedModel,
    reason,
    estimatedCost: calculateCost(
      selectedModel,
      totalInputTokens,
      analysis.estimatedOutputTokens
    ),
  };
}

/**
 * Get model provider configuration for AI SDK
 */
export function getModelProvider(modelId: string): {
  provider: 'openai' | 'google' | 'anthropic';
  modelId: string;
} {
  const model = AVAILABLE_MODELS[modelId];
  if (!model) {
    // Default to GPT-4o-mini
    return { provider: 'openai', modelId: 'gpt-4o-mini' };
  }

  switch (model.provider) {
    case 'google':
      return { provider: 'google', modelId: model.id };
    case 'anthropic':
      return { provider: 'anthropic', modelId: model.id };
    case 'deepseek':
      // DeepSeek uses OpenAI-compatible API
      return { provider: 'openai', modelId: model.id };
    default:
      return { provider: 'openai', modelId: model.id };
  }
}

/**
 * Estimate monthly cost based on usage patterns
 */
export function estimateMonthlyCost(
  queriesPerMonth: number,
  avgContextTokens: number,
  avgOutputTokens: number,
  tier: ModelTier = 'economy'
): {
  model: string;
  costPerQuery: number;
  monthlyCost: number;
} {
  const models = Object.values(AVAILABLE_MODELS).filter((m) => m.tier === tier);
  const model = models[0] || AVAILABLE_MODELS['gemini-1.5-flash'];

  const costPerQuery = calculateCost(model, avgContextTokens, avgOutputTokens);
  const monthlyCost = costPerQuery * queriesPerMonth;

  return {
    model: model.id,
    costPerQuery,
    monthlyCost,
  };
}
