/**
 * Deep Research Engine
 *
 * Main orchestration engine for deep research mode.
 * Coordinates multi-perspective research across multiple databases
 * with parallel execution and intelligent deduplication.
 */

import { unifiedSearch, type SearchResult, type UnifiedSearchOptions } from '../index';
import type { Perspective, ExplorationTree, ResearchNode, ResearchConfig, ResearchSession } from './types';
import { generatePerspectivesWithAgent } from './agents';
import {
  deduplicateAcrossSources,
  isTopicTooBroad,
  generateAlternativeSearchTerms,
  estimateTimeRemaining,
} from './utils';

/**
 * Research modes
 */
export type ResearchMode = 'comprehensive' | 'focused' | 'rapid';

/**
 * Start a deep research session with edge case validation
 */
export async function startResearch(
  topic: string,
  mode: 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic' = 'standard',
  customConfig?: Partial<ResearchConfig>
): Promise<Partial<ResearchSession>> {
  const { getDefaultConfig } = await import('./types');
  const config: ResearchConfig = {
    ...getDefaultConfig(mode),
    ...customConfig,
  };

  // Edge Case: Check if topic is too broad
  const broadCheck = isTopicTooBroad(topic);
  if (broadCheck.isBroad) {
    throw new Error(
      `Topic too broad: ${broadCheck.suggestion}\n\nExamples:\n${broadCheck.examples?.join('\n')}`
    );
  }

  // Edge Case: Validate topic is not empty
  if (!topic.trim() || topic.trim().length < 5) {
    throw new Error('Research topic must be at least 5 characters long');
  }

  const sessionId = generateSessionId();
  const startTime = Date.now();

  return {
    id: sessionId,
    topic,
    mode,
    config,
    status: 'planning',
    perspectives: [],
    sources: [],
    progress: {
      percentage: 0,
      stage: 'planning',
      sourcesCollected: 0,
      sourcesTarget: config.maxSources,
      nodesComplete: 0,
      nodesTotal: 0,
    },
  };
}

/**
 * Generate expert perspectives for a topic
 */
export async function generatePerspectives(
  topic: string,
  config: ResearchConfig
): Promise<Perspective[]> {
  // Use the Perspective Analyst agent to generate perspectives
  const agent = await import('./agents');
  const perspectiveAnalyst = new agent.PerspectiveAnalystAgent();

  // Generate up to breadth perspectives
  const response = await perspectiveAnalyst.generatePerspectives(topic, config.breadth);

  return response.data;
}

/**
 * Build exploration tree from perspectives
 */
export function buildExplorationTree(
  topic: string,
  perspectives: Perspective[]
): ExplorationTree {
  const rootId = 'root';
  const nodes: Record<string, ResearchNode> = {};

  // Create root node
  nodes[rootId] = {
    id: rootId,
    topic,
    depth: 0,
    status: 'pending',
    iterations: [],
    sourceIds: [],
    children: [],
  };

  // Create child nodes for each perspective
  const perspectiveNodeIds: string[] = [];
  perspectives.forEach((perspective, index) => {
    const nodeId = `perspective-${index}`;
    perspectiveNodeIds.push(nodeId);

    nodes[nodeId] = {
      id: nodeId,
      topic: perspective.searchStrategies[0] || topic, // Use first search strategy
      perspectiveId: perspective.id,
      parentId: rootId,
      depth: 1,
      status: 'pending',
      iterations: [],
      sourceIds: [],
      children: [],
    };
  });

  nodes[rootId].children = perspectiveNodeIds;

  return {
    rootId,
    nodes,
    totalNodes: 1 + perspectiveNodeIds.length,
    completedNodes: 0,
  };
}

/**
 * Execute research across the exploration tree with timeout handling
 */
export async function executeResearch(
  tree: ExplorationTree,
  config: ResearchConfig,
  onProgress?: (progress: ResearchProgress) => void,
  options?: {
    timeoutMs?: number;
    startTime?: number;
  }
): Promise<SearchResult[]> {
  const allSources: SearchResult[] = [];
  const rootNode = tree.nodes[tree.rootId];
  const nodesToExplore = rootNode.children.map((id) => tree.nodes[id]);

  // Edge Case: Set timeout based on mode
  const timeoutMs = options?.timeoutMs || getTimeoutForMode(config);
  const startTime = options?.startTime || Date.now();

  // Execute research in parallel batches
  const batchSize = config.breadth;
  for (let i = 0; i < nodesToExplore.length; i += batchSize) {
    // Edge Case: Check for timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > timeoutMs) {
      console.warn(`Research timeout after ${elapsed}ms. Returning partial results.`);
      if (onProgress) {
        onProgress({
          perspectivesGenerated: nodesToExplore.length,
          nodesExplored: tree.completedNodes,
          sourcesFound: allSources.length,
          currentPhase: 'timeout',
        });
      }
      break;
    }

    const batch = nodesToExplore.slice(i, i + batchSize);

    const batchPromises = batch.map(async (node) => {
      return executeNodeResearch(node, config);
    });

    const batchResults = await Promise.all(batchPromises);

    // Collect sources from this batch
    for (let j = 0; j < batch.length; j++) {
      const node = batch[j];
      const sources = batchResults[j];

      // Store source IDs in node (in real implementation, sources would be stored separately)
      node.sourceIds = sources.map((s) => s.id);
      node.status = 'complete';
      allSources.push(...sources);

      tree.completedNodes++;

      // Report progress with time estimate
      if (onProgress) {
        const timeEstimate = estimateTimeRemaining(
          tree.completedNodes,
          tree.totalNodes,
          Date.now() - startTime
        );

        onProgress({
          perspectivesGenerated: nodesToExplore.length,
          nodesExplored: tree.completedNodes,
          sourcesFound: allSources.length,
          currentPhase: 'research',
        });
      }
    }

    // Optionally expand tree with follow-up queries
    if (config.depth && config.depth > 1) {
      for (const node of batch) {
        if (node.depth < config.depth) {
          const followUpNodeIds = await generateFollowUpNodes(node, tree, config);
          node.children = followUpNodeIds;
          tree.totalNodes += followUpNodeIds.length;
        }
      }
    }
  }

  // Edge Case: Handle no sources found
  if (allSources.length === 0) {
    const alternatives = generateAlternativeSearchTerms(rootNode.topic);
    throw new Error(
      `No sources found for "${rootNode.topic}". Try these alternative search terms:\n${alternatives.join('\n')}`
    );
  }

  return allSources;
}

/**
 * Get timeout duration based on research mode
 */
function getTimeoutForMode(config: ResearchConfig): number {
  // Timeout in milliseconds based on depth and breadth
  const baseTimeout = 60000; // 1 minute
  const perNodeTimeout = 5000; // 5 seconds per node
  const estimatedNodes = config.depth * config.breadth;

  return Math.min(baseTimeout + estimatedNodes * perNodeTimeout, 600000); // Max 10 minutes
}

/**
 * Execute research for a single node with retry logic
 */
async function executeNodeResearch(
  node: ResearchNode,
  config: ResearchConfig
): Promise<SearchResult[]> {
  node.status = 'searching';

  const searchOptions: UnifiedSearchOptions = {
    text: node.topic,
    limit: Math.floor(config.maxSources / config.breadth),
    deduplicate: true,
  };

  try {
    const response = await unifiedSearch(searchOptions);

    // Edge Case: Handle empty results for this node
    if (response.results.length === 0) {
      console.warn(`No results found for node ${node.id} (${node.topic})`);

      // Try alternative search if available
      const alternatives = generateAlternativeSearchTerms(node.topic);
      if (alternatives.length > 0) {
        // Try first alternative
        const altResponse = await unifiedSearch({
          ...searchOptions,
          text: alternatives[0],
        });
        if (altResponse.results.length > 0) {
          console.info(`Found ${altResponse.results.length} results using alternative: ${alternatives[0]}`);
          return altResponse.results;
        }
      }
    }

    return response.results;
  } catch (error) {
    console.error(`Research error for node ${node.id}:`, error);
    node.status = 'failed';

    // Edge Case: Don't fail entire research if one node fails
    return [];
  }
}

/**
 * Generate follow-up research nodes based on initial findings
 */
async function generateFollowUpNodes(
  parentNode: ResearchNode,
  tree: ExplorationTree,
  config: ResearchConfig
): Promise<string[]> {
  // This would use an agent to analyze the sources and generate follow-up questions
  // For now, return empty array (can be implemented later)
  return [];
}

/**
 * Deduplicate sources across all databases and perspectives
 */
export function deduplicateSources(sources: SearchResult[]): {
  deduplicated: SearchResult[];
  duplicateCount: number;
  deduplicationMap: Map<string, string[]>;
} {
  return deduplicateAcrossSources(sources);
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `research-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Research progress tracking
 */
export interface ResearchProgress {
  perspectivesGenerated: number;
  nodesExplored: number;
  sourcesFound: number;
  currentPhase: 'initialization' | 'perspective-generation' | 'research' | 'analysis' | 'synthesis' | 'timeout';
}
