// Deep Research - Citation Analyst Agent
// Analyzes citations and builds citation graphs

import {
  BaseAgent,
  RegisterAgent,
  type AgentConfig,
  type AgentContext,
  type AgentResult,
} from './base-agent';
import type {
  ResearchSource,
  CitationType,
  CitationGraph,
  CitationNode,
  CitationEdge,
  CitationCluster,
  ConsensusData,
  ConsensusBreakdown,
} from '../types';

/**
 * Citation Analyst Agent Configuration
 */
const CITATION_ANALYST_CONFIG: AgentConfig = {
  type: 'citation_analyst',
  name: 'Citation Analyst',
  description: 'Classifies citations and builds citation relationship graphs',
  systemPrompt: `You are a Citation Analyst Agent specializing in citation analysis and scientific consensus.

Your responsibilities:
1. Classify citation relationships (supporting, disputing, mentioning)
2. Build citation networks to identify key papers
3. Detect clusters of related research
4. Analyze consensus on research questions
5. Identify influential and bridge papers

Citation types:
- Supporting: Paper provides evidence for a claim
- Disputing: Paper provides counter-evidence
- Mentioning: Paper references without strong position
- Methodology: Paper is cited for methods/techniques
- Data source: Paper provides data used in analysis

Network analysis:
- Identify central papers (high connectivity)
- Find bridge papers (connect different clusters)
- Detect research communities
- Map citation flow over time`,
  temperature: 0.3,
  maxTokens: 3000,
};

/**
 * Citation classification result
 */
interface CitationClassification {
  sourceId: string;
  citationType: CitationType;
  confidence: number;
  reasoning: string;
}

/**
 * Result from citation analyst
 */
interface CitationAnalystResult {
  classifications: CitationClassification[];
  graph: CitationGraph;
  consensus: ConsensusData | null;
  keyPapers: string[];
  bridgePapers: string[];
}

/**
 * Citation Analyst Agent
 *
 * Analyzes citation relationships between papers, builds citation
 * networks, and identifies consensus patterns.
 */
@RegisterAgent('citation_analyst')
export class CitationAnalystAgent extends BaseAgent {
  private classifications: CitationClassification[] = [];
  private graph: CitationGraph | null = null;

  constructor(sessionId: string) {
    super(CITATION_ANALYST_CONFIG, sessionId);
  }

  /**
   * Classify a single citation based on content
   */
  private classifyCitation(source: ResearchSource): CitationClassification {
    // In production, this would use LLM to analyze abstract/context
    // Simple heuristic-based classification for now

    const abstract = (source.abstract || '').toLowerCase();
    let citationType: CitationType = 'mentioning';
    let confidence = 0.5;
    let reasoning = 'Default classification';

    // Look for supporting language
    if (abstract.match(/\b(confirm|support|consistent|agree|demonstrate|show)\b/)) {
      citationType = 'supporting';
      confidence = 0.7;
      reasoning = 'Contains supporting language patterns';
    }

    // Look for disputing language
    if (abstract.match(/\b(contrary|contradict|disagree|refute|challenge|oppose)\b/)) {
      citationType = 'disputing';
      confidence = 0.7;
      reasoning = 'Contains disputing language patterns';
    }

    // Look for methodology focus
    if (abstract.match(/\b(method|technique|approach|protocol|procedure|algorithm)\b/)) {
      if (!abstract.match(/\b(result|finding|outcome|effect)\b/)) {
        citationType = 'methodology';
        confidence = 0.6;
        reasoning = 'Focuses on methodology without results';
      }
    }

    // Look for data source indicators
    if (abstract.match(/\b(dataset|database|registry|cohort|sample)\b/)) {
      citationType = 'data_source';
      confidence = 0.6;
      reasoning = 'References data source';
    }

    return {
      sourceId: source.id,
      citationType,
      confidence,
      reasoning,
    };
  }

  /**
   * Build citation graph from sources
   */
  private buildCitationGraph(sources: ResearchSource[]): CitationGraph {
    const nodes: CitationNode[] = [];
    const edges: CitationEdge[] = [];

    // Create nodes
    sources.forEach((source, index) => {
      // Position in a circle for visualization
      const angle = (2 * Math.PI * index) / sources.length;
      const radius = 100;

      nodes.push({
        id: source.id,
        sourceId: source.id,
        x: Math.cos(angle) * radius + 200,
        y: Math.sin(angle) * radius + 200,
        size: Math.log10((source.citationCount || 1) + 1) * 10 + 5,
        color: this.getColorForYear(source.year),
        label: source.title.substring(0, 30) + '...',
      });
    });

    // Create edges based on co-citation (simulated)
    // In production, would use actual citation data
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        // Check for shared keywords as proxy for co-citation
        const s1 = sources[i];
        const s2 = sources[j];

        if (this.areRelated(s1, s2)) {
          edges.push({
            source: s1.id,
            target: s2.id,
            type: 'co_citation',
            weight: 0.5,
          });
        }
      }
    }

    // Detect clusters
    const clusters = this.detectClusters(nodes, edges);

    return { nodes, edges, clusters };
  }

  /**
   * Get color based on publication year
   */
  private getColorForYear(year: number): string {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age <= 2) return '#2563eb'; // Blue - recent
    if (age <= 5) return '#7c3aed'; // Purple - moderately recent
    if (age <= 10) return '#db2777'; // Pink - older
    return '#9ca3af'; // Gray - old
  }

  /**
   * Check if two sources are related (simple heuristic)
   */
  private areRelated(s1: ResearchSource, s2: ResearchSource): boolean {
    // Same year is a weak signal
    if (Math.abs(s1.year - s2.year) > 3) return false;

    // Check for shared authors
    const authors1 = s1.authors.map(a => a.name.toLowerCase());
    const authors2 = s2.authors.map(a => a.name.toLowerCase());
    if (authors1.some(a => authors2.includes(a))) return true;

    // Check for shared keywords in title
    const words1 = s1.title.toLowerCase().split(/\s+/);
    const words2 = s2.title.toLowerCase().split(/\s+/);
    const shared = words1.filter(w => w.length > 4 && words2.includes(w));
    return shared.length >= 2;
  }

  /**
   * Detect clusters using simple grouping
   */
  private detectClusters(nodes: CitationNode[], edges: CitationEdge[]): CitationCluster[] {
    // Simple clustering based on connectivity
    const clusters: CitationCluster[] = [];
    const assigned = new Set<string>();

    // Build adjacency list
    const adjacency = new Map<string, Set<string>>();
    for (const node of nodes) {
      adjacency.set(node.id, new Set());
    }
    for (const edge of edges) {
      adjacency.get(edge.source)?.add(edge.target);
      adjacency.get(edge.target)?.add(edge.source);
    }

    // Group connected nodes
    let clusterIndex = 0;
    for (const node of nodes) {
      if (assigned.has(node.id)) continue;

      const clusterNodes: string[] = [];
      const queue = [node.id];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (assigned.has(current)) continue;

        assigned.add(current);
        clusterNodes.push(current);

        const neighbors = adjacency.get(current) || new Set();
        for (const neighbor of neighbors) {
          if (!assigned.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      if (clusterNodes.length > 0) {
        clusters.push({
          id: `cluster-${clusterIndex}`,
          label: `Research Group ${clusterIndex + 1}`,
          nodeIds: clusterNodes,
          color: this.getClusterColor(clusterIndex),
        });
        clusterIndex++;
      }
    }

    return clusters;
  }

  /**
   * Get color for a cluster
   */
  private getClusterColor(index: number): string {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];
    return colors[index % colors.length];
  }

  /**
   * Identify key papers (high centrality)
   */
  private identifyKeyPapers(graph: CitationGraph): string[] {
    // Calculate degree centrality
    const degrees = new Map<string, number>();

    for (const node of graph.nodes) {
      degrees.set(node.id, 0);
    }

    for (const edge of graph.edges) {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    }

    // Sort by degree and return top papers
    return [...degrees.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
  }

  /**
   * Identify bridge papers (connect clusters)
   */
  private identifyBridgePapers(graph: CitationGraph): string[] {
    // Find papers that connect different clusters
    const bridgePapers: string[] = [];

    for (const edge of graph.edges) {
      const sourceCluster = graph.clusters.find(c => c.nodeIds.includes(edge.source));
      const targetCluster = graph.clusters.find(c => c.nodeIds.includes(edge.target));

      if (sourceCluster && targetCluster && sourceCluster.id !== targetCluster.id) {
        if (!bridgePapers.includes(edge.source)) bridgePapers.push(edge.source);
        if (!bridgePapers.includes(edge.target)) bridgePapers.push(edge.target);
      }
    }

    return bridgePapers.slice(0, 5);
  }

  /**
   * Analyze consensus from classifications
   */
  private analyzeConsensus(
    classifications: CitationClassification[],
    sources: ResearchSource[],
    topic: string
  ): ConsensusData | null {
    // Check if topic is a yes/no question
    const isQuestion = topic.includes('?') || topic.toLowerCase().match(/^(does|is|can|should|do|are)/);

    if (!isQuestion) return null;

    const supporting = classifications.filter(c => c.citationType === 'supporting');
    const disputing = classifications.filter(c => c.citationType === 'disputing');
    const total = classifications.length;

    if (total === 0) return null;

    const yesPercentage = (supporting.length / total) * 100;
    const noPercentage = (disputing.length / total) * 100;
    const unclearPercentage = 100 - yesPercentage - noPercentage;

    const breakdowns: ConsensusBreakdown[] = [
      {
        position: 'yes',
        sourceIds: supporting.map(c => c.sourceId),
        summary: `${supporting.length} studies support this position`,
      },
      {
        position: 'no',
        sourceIds: disputing.map(c => c.sourceId),
        summary: `${disputing.length} studies oppose this position`,
      },
      {
        position: 'unclear',
        sourceIds: classifications
          .filter(c => c.citationType === 'mentioning')
          .map(c => c.sourceId),
        summary: 'Studies without clear position',
      },
    ];

    let confidenceLevel: ConsensusData['confidenceLevel'];
    if (total < 5) confidenceLevel = 'low';
    else if (Math.max(yesPercentage, noPercentage) > 70) confidenceLevel = 'high';
    else confidenceLevel = 'moderate';

    return {
      question: topic,
      isYesNoQuestion: true,
      yesPercentage: Math.round(yesPercentage),
      noPercentage: Math.round(noPercentage),
      unclearPercentage: Math.round(unclearPercentage),
      totalStudies: total,
      breakdown: breakdowns,
      confidenceLevel,
      explanation: `Based on ${total} studies, there is ${confidenceLevel} confidence in the consensus.`,
    };
  }

  /**
   * Execute the citation analyst agent
   */
  async execute(context: AgentContext): Promise<AgentResult<CitationAnalystResult>> {
    this.updateStatus('working', 'Analyzing citations', 0);

    try {
      const { topic } = context.session;

      // Get sources from researcher
      const researcherOutput = context.previousAgentOutputs.get('researcher') as
        { selectedSources: ResearchSource[] } | undefined;

      const sources = researcherOutput?.selectedSources || context.session.sources;

      if (!sources || sources.length === 0) {
        throw new Error('No sources available for citation analysis');
      }

      this.addMessage('system', this.config.systemPrompt);
      this.addMessage('user', `Analyze citations for ${sources.length} papers on: "${topic}"`);

      // Classify citations
      this.updateStatus('working', 'Classifying citations', 25);
      this.classifications = sources.map(source => this.classifyCitation(source));

      this.addMessage('assistant',
        `Classified ${this.classifications.length} citations: ` +
        `${this.classifications.filter(c => c.citationType === 'supporting').length} supporting, ` +
        `${this.classifications.filter(c => c.citationType === 'disputing').length} disputing`
      );

      // Build citation graph
      this.updateStatus('working', 'Building citation graph', 50);
      this.graph = this.buildCitationGraph(sources);

      // Identify key papers
      this.updateStatus('working', 'Identifying key papers', 70);
      const keyPapers = this.identifyKeyPapers(this.graph);
      const bridgePapers = this.identifyBridgePapers(this.graph);

      // Analyze consensus
      this.updateStatus('working', 'Analyzing consensus', 85);
      const consensus = this.analyzeConsensus(this.classifications, sources, topic);

      this.updateStatus('complete', 'Citation analysis complete', 100);

      this.addMessage('assistant',
        `Built graph with ${this.graph.nodes.length} nodes, ` +
        `${this.graph.edges.length} edges, ${this.graph.clusters.length} clusters. ` +
        `Identified ${keyPapers.length} key papers and ${bridgePapers.length} bridge papers.`
      );

      const result: CitationAnalystResult = {
        classifications: this.classifications,
        graph: this.graph,
        consensus,
        keyPapers,
        bridgePapers,
      };

      return {
        success: true,
        data: result,
        messages: this.messages,
        tokensUsed: 0,
      };
    } catch (error) {
      this.updateStatus('error', `Citation analysis failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: this.messages,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get classifications
   */
  getClassifications(): CitationClassification[] {
    return [...this.classifications];
  }

  /**
   * Get citation graph
   */
  getGraph(): CitationGraph | null {
    return this.graph;
  }
}
