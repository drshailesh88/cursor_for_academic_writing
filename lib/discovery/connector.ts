/**
 * Literature Connector
 *
 * Find connections between papers:
 * - Citation paths
 * - Shortest paths
 * - Connection explanations
 * - Multi-paper common ground
 */

import type { SearchResult } from '@/lib/research/types';
import type {
  ConnectionPath,
  LiteratureConnection,
  PathEdge,
  MultiPaperConnection,
  CommonGround,
  PaperRelationship,
  EnhancedLiteratureConnection,
  DisconnectionReason,
} from './types';
import {
  getSemanticScholarById,
  getCitations,
  getReferences,
  getRelatedPapers,
} from '@/lib/research/semantic-scholar';

/**
 * Find all paths between two papers
 */
export async function findPaths(
  sourcePaperId: string,
  targetPaperId: string,
  maxDepth = 3
): Promise<LiteratureConnection> {
  const paths: ConnectionPath[] = [];

  // Try different path types
  const citationPaths = await findCitationPaths(sourcePaperId, targetPaperId, maxDepth);
  paths.push(...citationPaths);

  const coCitationPath = await findCoCitationPath(sourcePaperId, targetPaperId);
  if (coCitationPath) paths.push(coCitationPath);

  const couplingPath = await findCouplingPath(sourcePaperId, targetPaperId);
  if (couplingPath) paths.push(couplingPath);

  const semanticPath = await findSemanticPath(sourcePaperId, targetPaperId);
  if (semanticPath) paths.push(semanticPath);

  // Sort by path length and weight
  paths.sort((a, b) => {
    if (a.papers.length !== b.papers.length) {
      return a.papers.length - b.papers.length;
    }
    return b.totalWeight - a.totalWeight;
  });

  const shortestPath = paths[0] || {
    id: `path-empty`,
    papers: [sourcePaperId, targetPaperId],
    edges: [],
    totalWeight: 0,
    type: 'citation' as const,
  };

  return {
    id: `connection-${Date.now()}`,
    userId: '',
    sourcePaperId,
    targetPaperId,
    paths,
    shortestPath,
    createdAt: new Date() as any,
  };
}

/**
 * Find shortest citation path using BFS
 */
export async function findShortestPath(
  sourcePaperId: string,
  targetPaperId: string,
  maxDepth = 3
): Promise<ConnectionPath | null> {
  const paths = await findCitationPaths(sourcePaperId, targetPaperId, maxDepth);
  return paths.length > 0 ? paths[0] : null;
}

/**
 * Explain why two papers are connected
 */
export async function explainConnection(path: ConnectionPath): Promise<string> {
  if (path.papers.length === 2) {
    return 'These papers are directly connected by citation or co-citation.';
  }

  const explanations: string[] = [];

  for (const edge of path.edges) {
    const source = await getSemanticScholarById(edge.source);
    const target = await getSemanticScholarById(edge.target);

    if (!source || !target) continue;

    switch (edge.type) {
      case 'cites':
        explanations.push(
          `"${source.title.substring(0, 40)}..." cites "${target.title.substring(0, 40)}..."`
        );
        break;
      case 'co_citation':
        explanations.push(
          `"${source.title.substring(0, 40)}..." and "${target.title.substring(0, 40)}..." are frequently co-cited`
        );
        break;
      case 'semantic':
        explanations.push(
          `"${source.title.substring(0, 40)}..." is semantically similar to "${target.title.substring(0, 40)}..."`
        );
        break;
    }
  }

  return explanations.join(' → ');
}

/**
 * Find common ground between multiple papers
 */
export async function findMultiPaperConnections(
  paperIds: string[]
): Promise<MultiPaperConnection> {
  // Fetch all papers
  const papers: SearchResult[] = [];
  for (const id of paperIds) {
    const paper = await getSemanticScholarById(id);
    if (paper) papers.push(paper);
  }

  // Find common ground
  const commonGround = await findCommonGround(papers);

  // Find pairwise relationships
  const relationships: PaperRelationship[] = [];
  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const rel = await findRelationship(papers[i], papers[j]);
      if (rel) relationships.push(rel);
    }
  }

  // Generate synthesis opportunities
  const synthesisOpportunities = generateSynthesisOpportunities(
    papers,
    commonGround,
    relationships
  );

  return {
    papers,
    commonGround,
    relationships,
    synthesisOpportunities,
  };
}

// ============================================================================
// Path Finding Algorithms
// ============================================================================

async function findCitationPaths(
  sourcePaperId: string,
  targetPaperId: string,
  maxDepth: number
): Promise<ConnectionPath[]> {
  const paths: ConnectionPath[] = [];

  // BFS to find paths
  interface QueueItem {
    paperId: string;
    path: string[];
    edges: PathEdge[];
    depth: number;
  }

  const queue: QueueItem[] = [
    { paperId: sourcePaperId, path: [sourcePaperId], edges: [], depth: 0 },
  ];
  const visited = new Set<string>();

  while (queue.length > 0 && paths.length < 5) {
    const current = queue.shift()!;

    if (current.depth > maxDepth) continue;
    if (visited.has(current.paperId)) continue;
    visited.add(current.paperId);

    // Found target
    if (current.paperId === targetPaperId) {
      paths.push({
        id: `path-${paths.length}`,
        papers: current.path,
        edges: current.edges,
        totalWeight: current.edges.reduce((sum, e) => sum + e.weight, 0),
        type: 'citation',
      });
      continue;
    }

    // Explore citations
    try {
      const citations = await getCitations(current.paperId, 10);
      for (const cited of citations) {
        if (!current.path.includes(cited.id)) {
          queue.push({
            paperId: cited.id,
            path: [...current.path, cited.id],
            edges: [
              ...current.edges,
              {
                source: cited.id,
                target: current.paperId,
                type: 'cites',
                weight: 1,
                explanation: `${cited.title.substring(0, 30)}... cites this work`,
              },
            ],
            depth: current.depth + 1,
          });
        }
      }

      // Explore references
      const references = await getReferences(current.paperId, 10);
      for (const ref of references) {
        if (!current.path.includes(ref.id)) {
          queue.push({
            paperId: ref.id,
            path: [...current.path, ref.id],
            edges: [
              ...current.edges,
              {
                source: current.paperId,
                target: ref.id,
                type: 'cites',
                weight: 1,
                explanation: `This work cites ${ref.title.substring(0, 30)}...`,
              },
            ],
            depth: current.depth + 1,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching citations:', error);
    }
  }

  return paths;
}

async function findCoCitationPath(
  sourcePaperId: string,
  targetPaperId: string
): Promise<ConnectionPath | null> {
  // Find papers that cite both
  const sourceCitations = await getCitations(sourcePaperId, 50);
  const targetCitations = await getCitations(targetPaperId, 50);

  const sourceCitingIds = new Set(sourceCitations.map((p) => p.id));
  const commonCiters = targetCitations.filter((p) => sourceCitingIds.has(p.id));

  if (commonCiters.length === 0) return null;

  // Use the most cited common paper as bridge
  const bridge = commonCiters.sort(
    (a, b) => (b.citationCount || 0) - (a.citationCount || 0)
  )[0];

  return {
    id: `path-cocitation`,
    papers: [sourcePaperId, bridge.id, targetPaperId],
    edges: [
      {
        source: bridge.id,
        target: sourcePaperId,
        type: 'co_citation',
        weight: 0.8,
        explanation: 'Co-cited in multiple works',
      },
      {
        source: bridge.id,
        target: targetPaperId,
        type: 'co_citation',
        weight: 0.8,
        explanation: 'Co-cited in multiple works',
      },
    ],
    totalWeight: 1.6,
    type: 'citation',
  };
}

async function findCouplingPath(
  sourcePaperId: string,
  targetPaperId: string
): Promise<ConnectionPath | null> {
  // Find shared references
  const sourceRefs = await getReferences(sourcePaperId, 100);
  const targetRefs = await getReferences(targetPaperId, 100);

  const sourceRefIds = new Set(sourceRefs.map((p) => p.id));
  const sharedRefs = targetRefs.filter((p) => sourceRefIds.has(p.id));

  if (sharedRefs.length === 0) return null;

  // Use the most cited shared reference as bridge
  const bridge = sharedRefs.sort(
    (a, b) => (b.citationCount || 0) - (a.citationCount || 0)
  )[0];

  return {
    id: `path-coupling`,
    papers: [sourcePaperId, bridge.id, targetPaperId],
    edges: [
      {
        source: sourcePaperId,
        target: bridge.id,
        type: 'cites',
        weight: 0.7,
        explanation: 'Both papers cite this foundational work',
      },
      {
        source: targetPaperId,
        target: bridge.id,
        type: 'cites',
        weight: 0.7,
        explanation: 'Both papers cite this foundational work',
      },
    ],
    totalWeight: 1.4,
    type: 'citation',
  };
}

async function findSemanticPath(
  sourcePaperId: string,
  targetPaperId: string
): Promise<ConnectionPath | null> {
  // Check if papers are semantically similar
  const related = await getRelatedPapers(sourcePaperId, 20);
  const isRelated = related.some((p) => p.id === targetPaperId);

  if (isRelated) {
    return {
      id: `path-semantic`,
      papers: [sourcePaperId, targetPaperId],
      edges: [
        {
          source: sourcePaperId,
          target: targetPaperId,
          type: 'semantic',
          weight: 0.9,
          explanation: 'Semantically similar based on content',
        },
      ],
      totalWeight: 0.9,
      type: 'semantic',
    };
  }

  return null;
}

// ============================================================================
// Common Ground Analysis
// ============================================================================

async function findCommonGround(papers: SearchResult[]): Promise<CommonGround> {
  // Find shared citations
  const allReferences: SearchResult[][] = [];
  for (const paper of papers) {
    try {
      const refs = await getReferences(paper.id, 50);
      allReferences.push(refs);
    } catch {
      allReferences.push([]);
    }
  }

  const sharedCitations = findIntersection(allReferences);

  // Find shared topics
  const allTopics = papers.flatMap((p) => [
    ...(p.categories || []),
    ...(p.keywords || []),
  ]);
  const topicCounts = new Map<string, number>();
  allTopics.forEach((t) => topicCounts.set(t, (topicCounts.get(t) || 0) + 1));
  const sharedTopics = Array.from(topicCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([topic]) => topic);

  // Find shared authors
  const allAuthors = papers.flatMap((p) => p.authors.map((a) => a.name));
  const authorCounts = new Map<string, number>();
  allAuthors.forEach((a) => authorCounts.set(a, (authorCounts.get(a) || 0) + 1));
  const sharedAuthors = Array.from(authorCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([author]) => author);

  // Find time overlap
  const years = papers.map((p) => p.year);
  const timeOverlap = {
    start: Math.max(...years),
    end: Math.min(...years),
  };

  return {
    sharedCitations,
    sharedTopics,
    sharedAuthors,
    timeOverlap: timeOverlap.start <= timeOverlap.end ? timeOverlap : null,
  };
}

async function findRelationship(
  paper1: SearchResult,
  paper2: SearchResult
): Promise<PaperRelationship | null> {
  // Check for direct citation
  try {
    const refs1 = await getReferences(paper1.id, 100);
    if (refs1.some((r) => r.id === paper2.id)) {
      return {
        paper1Id: paper1.id,
        paper2Id: paper2.id,
        relationshipType: 'cites',
        strength: 1,
        description: `"${paper1.title.substring(0, 30)}..." cites "${paper2.title.substring(0, 30)}..."`,
      };
    }

    const refs2 = await getReferences(paper2.id, 100);
    if (refs2.some((r) => r.id === paper1.id)) {
      return {
        paper1Id: paper1.id,
        paper2Id: paper2.id,
        relationshipType: 'cited-by',
        strength: 1,
        description: `"${paper1.title.substring(0, 30)}..." is cited by "${paper2.title.substring(0, 30)}..."`,
      };
    }

    // Check for co-citation
    const cit1 = await getCitations(paper1.id, 50);
    const cit2 = await getCitations(paper2.id, 50);
    const cit1Ids = new Set(cit1.map((c) => c.id));
    const commonCiters = cit2.filter((c) => cit1Ids.has(c.id));

    if (commonCiters.length > 2) {
      return {
        paper1Id: paper1.id,
        paper2Id: paper2.id,
        relationshipType: 'co-cited',
        strength: commonCiters.length / 10,
        description: `Co-cited in ${commonCiters.length} works`,
      };
    }

    // Check for semantic similarity
    const related = await getRelatedPapers(paper1.id, 20);
    if (related.some((r) => r.id === paper2.id)) {
      return {
        paper1Id: paper1.id,
        paper2Id: paper2.id,
        relationshipType: 'similar',
        strength: 0.7,
        description: 'Semantically similar content',
      };
    }
  } catch (error) {
    console.error('Error finding relationship:', error);
  }

  return null;
}

function findIntersection(arrays: SearchResult[][]): SearchResult[] {
  if (arrays.length === 0) return [];

  const idCounts = new Map<string, SearchResult>();
  arrays.forEach((arr) => {
    arr.forEach((item) => {
      idCounts.set(item.id, item);
    });
  });

  // Find items present in all arrays
  const result: SearchResult[] = [];
  for (const [id, paper] of Array.from(idCounts.entries())) {
    const presentInAll = arrays.every((arr) => arr.some((p) => p.id === id));
    if (presentInAll) {
      result.push(paper);
    }
  }

  return result;
}

function generateSynthesisOpportunities(
  papers: SearchResult[],
  commonGround: CommonGround,
  relationships: PaperRelationship[]
): string[] {
  const opportunities: string[] = [];

  if (commonGround.sharedTopics.length > 0) {
    opportunities.push(
      `These papers share ${commonGround.sharedTopics.length} common topics: ${commonGround.sharedTopics.slice(0, 3).join(', ')}. A synthesis could unify these perspectives.`
    );
  }

  if (commonGround.sharedCitations.length > 3) {
    opportunities.push(
      `All papers build on ${commonGround.sharedCitations.length} shared foundational works. A review could trace the evolution from these foundations.`
    );
  }

  const directCitations = relationships.filter((r) => r.relationshipType === 'cites');
  if (directCitations.length > 0) {
    opportunities.push(
      `${directCitations.length} direct citation(s) indicate an evolution of ideas worth tracing.`
    );
  }

  if (opportunities.length === 0) {
    opportunities.push(
      'These papers represent distinct but potentially complementary approaches to the topic.'
    );
  }

  return opportunities;
}

// ============================================================================
// Edge Case Handling: Disconnected Papers
// ============================================================================

/**
 * Find paths with enhanced disconnection handling
 */
export async function findEnhancedPaths(
  sourcePaperId: string,
  targetPaperId: string,
  maxDepth = 3
): Promise<EnhancedLiteratureConnection> {
  const connection = await findPaths(sourcePaperId, targetPaperId, maxDepth);

  // Calculate quality metrics
  const quality = {
    pathCount: connection.paths.length,
    avgPathLength: connection.paths.length > 0
      ? connection.paths.reduce((sum, p) => sum + p.papers.length, 0) / connection.paths.length
      : 0,
    strongestConnection: connection.paths.length > 0
      ? Math.max(...connection.paths.map((p) => p.totalWeight))
      : 0,
  };

  // Check if papers are disconnected
  if (connection.paths.length === 0) {
    const disconnectionReason = await analyzeDisconnection(sourcePaperId, targetPaperId);

    return {
      ...connection,
      quality,
      disconnectionReason,
    };
  }

  return {
    ...connection,
    quality,
  };
}

/**
 * Analyze why two papers are disconnected
 */
export async function analyzeDisconnection(
  sourcePaperId: string,
  targetPaperId: string
): Promise<DisconnectionReason> {
  try {
    // Fetch both papers
    const [sourcePaper, targetPaper] = await Promise.all([
      getSemanticScholarById(sourcePaperId),
      getSemanticScholarById(targetPaperId),
    ]);

    if (!sourcePaper || !targetPaper) {
      return {
        type: 'sparse_data',
        explanation: 'One or both papers have insufficient citation data available.',
        suggestions: [
          'Try using different paper identifiers (DOI, ArXiv ID, etc.)',
          'Check if papers are recently published (citation networks take time to form)',
          'Use semantic search to find conceptually related papers',
        ],
      };
    }

    // Check temporal gap
    const yearDiff = Math.abs(sourcePaper.year - targetPaper.year);
    if (yearDiff > 20) {
      return {
        type: 'temporal_gap',
        explanation: `Papers are separated by ${yearDiff} years. Direct citation paths are unlikely across this time gap.`,
        suggestions: [
          'Look for review papers that cite both works',
          'Search for papers from intermediate years that bridge the gap',
          'Consider if these papers are from the same research lineage',
        ],
        intermediateTopics: ['Review papers', `Papers from ${sourcePaper.year + Math.floor(yearDiff / 2)}`],
      };
    }

    // Check if from different fields
    const sourceTopics = new Set([...(sourcePaper.categories || []), ...(sourcePaper.keywords || [])]);
    const targetTopics = new Set([...(targetPaper.categories || []), ...(targetPaper.keywords || [])]);

    const sharedTopics = Array.from(sourceTopics).filter((t) => targetTopics.has(t));

    if (sharedTopics.length === 0 && sourceTopics.size > 0 && targetTopics.size > 0) {
      return {
        type: 'different_fields',
        explanation: 'Papers appear to be from different research fields with no overlapping topics.',
        suggestions: [
          'These papers may be addressing unrelated problems',
          'Look for interdisciplinary work that bridges these fields',
          'Consider if there are methodological connections rather than topical ones',
        ],
        intermediateTopics: [
          'Interdisciplinary papers',
          'Methodology papers',
          'Bridging concepts',
        ],
      };
    }

    // Check citation counts
    const sourceCitations = sourcePaper.citationCount || 0;
    const targetCitations = targetPaper.citationCount || 0;

    if (sourceCitations < 5 || targetCitations < 5) {
      return {
        type: 'sparse_data',
        explanation: 'One or both papers have very few citations, making connection paths difficult to find.',
        suggestions: [
          'Papers may be too recent to have formed citation networks',
          'Look for papers by the same authors',
          'Use semantic similarity to find related work',
          'Check if papers are preprints or unpublished',
        ],
      };
    }

    // Check if in disconnected components
    // (This would require fetching more data, so we'll infer)
    if (sourceCitations > 20 && targetCitations > 20 && sharedTopics.length > 0) {
      return {
        type: 'disconnected_components',
        explanation: 'Papers are in disconnected research communities despite being in related fields.',
        suggestions: [
          'These may represent parallel research traditions',
          'Look for papers that explicitly compare or contrast these approaches',
          'Search for papers citing both (even if not directly connected)',
          'Consider if geographic or linguistic factors create separate communities',
        ],
        intermediateTopics: [
          'Comparative studies',
          'Survey papers',
          'Meta-analyses',
        ],
      };
    }

    // Default: no clear path
    return {
      type: 'no_citation_path',
      explanation: 'No citation path found within search depth. Papers may be indirectly related.',
      suggestions: [
        'Increase search depth (may be slower)',
        'Look for papers that cite both works',
        'Use semantic search to find conceptually similar papers',
        'Consider manual literature review to bridge the gap',
      ],
    };
  } catch (error) {
    console.error('Error analyzing disconnection:', error);
    return {
      type: 'sparse_data',
      explanation: 'Unable to analyze connection. Data may be temporarily unavailable.',
      suggestions: [
        'Try again in a few moments',
        'Check your internet connection',
        'Verify paper identifiers are correct',
      ],
    };
  }
}

/**
 * Suggest bridge papers that could connect disconnected papers
 */
export async function suggestBridgePapers(
  sourcePaperId: string,
  targetPaperId: string
): Promise<SearchResult[]> {
  const bridgePapers: SearchResult[] = [];

  try {
    // Strategy 1: Find papers that cite both
    const [sourceCitations, targetCitations] = await Promise.all([
      getCitations(sourcePaperId, 100),
      getCitations(targetPaperId, 100),
    ]);

    const sourceCitingIds = new Set(sourceCitations.map((p) => p.id));
    const commonCiters = targetCitations.filter((p) => sourceCitingIds.has(p.id));

    // Add top common citers
    bridgePapers.push(...commonCiters.slice(0, 5));

    // Strategy 2: Find papers cited by both
    const [sourceRefs, targetRefs] = await Promise.all([
      getReferences(sourcePaperId, 100),
      getReferences(targetPaperId, 100),
    ]);

    const sourceRefIds = new Set(sourceRefs.map((p) => p.id));
    const commonRefs = targetRefs.filter((p) => sourceRefIds.has(p.id));

    // Add top common references
    for (const ref of commonRefs.slice(0, 5)) {
      if (!bridgePapers.some((p) => p.id === ref.id)) {
        bridgePapers.push(ref);
      }
    }

    // Sort by citation count and limit
    bridgePapers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));

    return bridgePapers.slice(0, 10);
  } catch (error) {
    console.error('Error suggesting bridge papers:', error);
    return [];
  }
}

/**
 * Find alternative connection paths using bridge papers
 */
export async function findPathsViaBridge(
  sourcePaperId: string,
  targetPaperId: string,
  bridgePaperId: string
): Promise<ConnectionPath[]> {
  const paths: ConnectionPath[] = [];

  try {
    // Find path from source to bridge
    const sourceConnection = await findPaths(sourcePaperId, bridgePaperId, 2);

    // Find path from bridge to target
    const targetConnection = await findPaths(bridgePaperId, targetPaperId, 2);

    if (sourceConnection.paths.length > 0 && targetConnection.paths.length > 0) {
      // Combine paths through bridge
      const sourcePath = sourceConnection.paths[0];
      const targetPath = targetConnection.paths[0];

      const combinedPath: ConnectionPath = {
        id: `path-via-bridge-${bridgePaperId}`,
        papers: [...sourcePath.papers, ...targetPath.papers.slice(1)],
        edges: [...sourcePath.edges, ...targetPath.edges],
        totalWeight: sourcePath.totalWeight + targetPath.totalWeight,
        type: 'citation',
      };

      paths.push(combinedPath);
    }
  } catch (error) {
    console.error('Error finding paths via bridge:', error);
  }

  return paths;
}
