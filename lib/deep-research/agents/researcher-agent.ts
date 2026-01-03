// Deep Research - Researcher Agent
// Executes searches and analyzes papers

import {
  BaseAgent,
  RegisterAgent,
  type AgentConfig,
  type AgentContext,
  type AgentResult,
} from './base-agent';
import type {
  DatabaseSource,
  ResearchSource,
  ExtractedContent,
  DataPoint,
  Author,
} from '../types';

/**
 * Researcher Agent Configuration
 */
const RESEARCHER_CONFIG: AgentConfig = {
  type: 'researcher',
  name: 'Research Executor',
  description: 'Executes searches across databases and analyzes papers for relevance',
  systemPrompt: `You are a Research Executor Agent specializing in literature search and analysis.

Your responsibilities:
1. Execute search queries across academic databases
2. Evaluate paper relevance to the research topic
3. Extract key findings, methodology, and data points
4. Identify limitations and gaps in each paper
5. Score papers for inclusion in the synthesis

Evaluation criteria:
- Relevance: How well does the paper address the research question?
- Quality: Study design, sample size, methodology rigor
- Recency: Publication date relative to field evolution
- Impact: Citation count, journal quality
- Contribution: Unique insights or data provided

Always extract specific data points (statistics, metrics, outcomes) when available.`,
  temperature: 0.3,
  maxTokens: 4000,
};

/**
 * Search execution result
 */
interface SearchExecutionResult {
  database: DatabaseSource;
  query: string;
  totalFound: number;
  retrieved: number;
  papers: RawPaper[];
  executedAt: Date;
}

/**
 * Raw paper from search
 */
interface RawPaper {
  id: string;
  source: DatabaseSource;
  externalId: string;
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  journal?: string;
  doi?: string;
  pmid?: string;
  citationCount?: number;
  url?: string;
}

/**
 * Paper evaluation result
 */
interface PaperEvaluation {
  paperId: string;
  relevanceScore: number;
  qualityScore: number;
  recencyScore: number;
  impactScore: number;
  overallScore: number;
  include: boolean;
  reason: string;
}

/**
 * Result from researcher agent
 */
interface ResearcherResult {
  searchResults: SearchExecutionResult[];
  evaluations: PaperEvaluation[];
  selectedSources: ResearchSource[];
  totalPapersFound: number;
  totalPapersSelected: number;
}

/**
 * Researcher Agent
 *
 * Executes search queries across multiple databases, evaluates papers
 * for relevance and quality, and extracts key content.
 */
@RegisterAgent('researcher')
export class ResearcherAgent extends BaseAgent {
  private searchResults: SearchExecutionResult[] = [];
  private selectedSources: ResearchSource[] = [];

  constructor(sessionId: string) {
    super(RESEARCHER_CONFIG, sessionId);
  }

  /**
   * Simulate search execution (would call actual APIs in production)
   */
  private async executeSearch(
    database: DatabaseSource,
    query: string,
    limit: number
  ): Promise<SearchExecutionResult> {
    // In production, this would call the actual search providers
    // For now, return simulated structure
    this.addMessage('assistant', `Searching ${database} with query: ${query.substring(0, 50)}...`);

    return {
      database,
      query,
      totalFound: 0, // Would be populated by actual search
      retrieved: 0,
      papers: [],
      executedAt: new Date(),
    };
  }

  /**
   * Calculate relevance score based on title/abstract matching
   */
  private calculateRelevanceScore(paper: RawPaper, topic: string): number {
    const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const text = `${paper.title} ${paper.abstract || ''}`.toLowerCase();

    let matches = 0;
    for (const word of topicWords) {
      if (text.includes(word)) matches++;
    }

    return Math.min(matches / topicWords.length, 1);
  }

  /**
   * Calculate quality score based on available metadata
   */
  private calculateQualityScore(paper: RawPaper): number {
    let score = 0.5; // Base score

    // Has abstract
    if (paper.abstract && paper.abstract.length > 200) score += 0.1;

    // Has DOI (peer-reviewed)
    if (paper.doi) score += 0.1;

    // Has journal name
    if (paper.journal) score += 0.1;

    // Multiple authors (collaborative research)
    if (paper.authors.length >= 3) score += 0.1;

    // Has PMID (indexed in PubMed)
    if (paper.pmid) score += 0.1;

    return Math.min(score, 1);
  }

  /**
   * Calculate recency score
   */
  private calculateRecencyScore(paper: RawPaper): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - paper.year;

    if (age <= 2) return 1.0;
    if (age <= 5) return 0.8;
    if (age <= 10) return 0.6;
    if (age <= 15) return 0.4;
    return 0.2;
  }

  /**
   * Calculate impact score based on citations
   */
  private calculateImpactScore(paper: RawPaper): number {
    const citations = paper.citationCount || 0;

    if (citations >= 100) return 1.0;
    if (citations >= 50) return 0.8;
    if (citations >= 20) return 0.6;
    if (citations >= 5) return 0.4;
    return 0.2;
  }

  /**
   * Evaluate a paper for inclusion
   */
  private evaluatePaper(paper: RawPaper, topic: string, minScore: number): PaperEvaluation {
    const relevanceScore = this.calculateRelevanceScore(paper, topic);
    const qualityScore = this.calculateQualityScore(paper);
    const recencyScore = this.calculateRecencyScore(paper);
    const impactScore = this.calculateImpactScore(paper);

    // Weighted overall score
    const overallScore =
      relevanceScore * 0.4 +
      qualityScore * 0.25 +
      recencyScore * 0.2 +
      impactScore * 0.15;

    const include = overallScore >= minScore;
    let reason = '';

    if (!include) {
      if (relevanceScore < 0.3) reason = 'Low relevance to research topic';
      else if (qualityScore < 0.4) reason = 'Insufficient quality indicators';
      else reason = 'Below threshold for inclusion';
    } else {
      reason = 'Meets inclusion criteria';
    }

    return {
      paperId: paper.id,
      relevanceScore,
      qualityScore,
      recencyScore,
      impactScore,
      overallScore,
      include,
      reason,
    };
  }

  /**
   * Extract content from a paper
   */
  private extractContent(paper: RawPaper): ExtractedContent {
    // In production, this would use NLP/LLM to extract structured content
    const dataPoints: DataPoint[] = [];

    // Simple extraction from abstract
    if (paper.abstract) {
      // Look for numbers that might be statistics
      const statMatches = paper.abstract.match(/\d+\.?\d*\s*%/g);
      if (statMatches) {
        statMatches.forEach((match, i) => {
          dataPoints.push({
            type: 'statistic',
            label: `Statistic ${i + 1}`,
            value: match,
            context: 'Extracted from abstract',
          });
        });
      }
    }

    return {
      keyFindings: [], // Would be extracted by LLM
      methodology: undefined,
      limitations: [],
      conclusions: undefined,
      dataPoints,
    };
  }

  /**
   * Convert raw paper to research source
   */
  private toResearchSource(paper: RawPaper, evaluation: PaperEvaluation): ResearchSource {
    const authors: Author[] = paper.authors.map(name => ({
      name,
      isCorresponding: false,
    }));

    return {
      id: `source-${paper.id}`,
      paperId: paper.id,
      doi: paper.doi,
      pmid: paper.pmid,
      title: paper.title,
      authors,
      year: paper.year,
      journal: paper.journal,
      abstract: paper.abstract,
      database: paper.source,
      url: paper.url,
      openAccess: false, // Would be determined from metadata
      extractedContent: this.extractContent(paper),
      citationType: 'mentioning', // Would be classified later
      citationContext: '',
      citationCount: paper.citationCount,
      influenceScore: evaluation.overallScore,
      processedAt: new Date() as any,
    };
  }

  /**
   * Execute the researcher agent
   */
  async execute(context: AgentContext): Promise<AgentResult<ResearcherResult>> {
    this.updateStatus('working', 'Preparing search execution', 0);

    try {
      const { topic, config } = context.session;

      this.addMessage('system', this.config.systemPrompt);
      this.addMessage('user', `Execute searches for: "${topic}"`);

      // Get search strategies from previous agent
      const strategyOutput = context.previousAgentOutputs.get('search_strategist') as
        { strategy: { queries: Array<{ database: DatabaseSource; query: string }> } } | undefined;

      // Get queries from strategy or create basic ones
      let queries: Array<{ database: DatabaseSource; query: string }>;

      if (strategyOutput?.strategy?.queries) {
        queries = strategyOutput.strategy.queries;
      } else {
        // Create basic queries if no strategy available
        queries = config.sources.map(source => ({
          database: source,
          query: topic,
        }));
      }

      // Execute searches
      this.updateStatus('working', 'Executing database searches', 20);
      this.searchResults = [];

      for (let i = 0; i < queries.length; i++) {
        const { database, query } = queries[i];
        const progress = 20 + (i / queries.length) * 30;
        this.updateStatus('working', `Searching ${database}`, progress);

        const result = await this.executeSearch(database, query, config.maxSources);
        this.searchResults.push(result);
      }

      // Collect all papers
      const allPapers = this.searchResults.flatMap(r => r.papers);
      this.addMessage('assistant', `Found ${allPapers.length} papers across ${queries.length} databases`);

      // Evaluate papers
      this.updateStatus('working', 'Evaluating papers', 60);
      const minScore = config.maxSources > 50 ? 0.5 : 0.6; // Adjust threshold based on target
      const evaluations = allPapers.map(paper => this.evaluatePaper(paper, topic, minScore));

      // Select papers
      this.updateStatus('working', 'Selecting papers', 80);
      const selectedEvaluations = evaluations
        .filter(e => e.include)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, config.maxSources);

      this.selectedSources = allPapers
        .filter(paper => selectedEvaluations.some(e => e.paperId === paper.id))
        .map(paper => {
          const evaluation = selectedEvaluations.find(e => e.paperId === paper.id)!;
          return this.toResearchSource(paper, evaluation);
        });

      this.updateStatus('complete', 'Research execution complete', 100);

      this.addMessage('assistant',
        `Selected ${this.selectedSources.length} papers from ${allPapers.length} found`
      );

      const result: ResearcherResult = {
        searchResults: this.searchResults,
        evaluations,
        selectedSources: this.selectedSources,
        totalPapersFound: allPapers.length,
        totalPapersSelected: this.selectedSources.length,
      };

      return {
        success: true,
        data: result,
        messages: this.messages,
        tokensUsed: 0,
      };
    } catch (error) {
      this.updateStatus('error', `Research execution failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: this.messages,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get selected sources
   */
  getSelectedSources(): ResearchSource[] {
    return [...this.selectedSources];
  }

  /**
   * Get search results
   */
  getSearchResults(): SearchExecutionResult[] {
    return [...this.searchResults];
  }
}
