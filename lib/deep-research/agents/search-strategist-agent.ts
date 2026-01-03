// Deep Research - Search Strategist Agent
// Creates search strategies for academic databases

import {
  BaseAgent,
  RegisterAgent,
  type AgentConfig,
  type AgentContext,
  type AgentResult,
} from './base-agent';
import type { DatabaseSource, Perspective } from '../types';

/**
 * Search Strategist Agent Configuration
 */
const SEARCH_STRATEGIST_CONFIG: AgentConfig = {
  type: 'search_strategist',
  name: 'Search Strategist',
  description: 'Creates optimized search strategies for academic databases',
  systemPrompt: `You are a Search Strategist Agent specializing in academic literature search.

Your responsibilities:
1. Analyze research topics and break them into searchable concepts
2. Generate keyword variations including synonyms and related terms
3. Create Boolean search queries optimized for each database
4. Apply appropriate MeSH terms for PubMed searches
5. Prioritize databases based on topic relevance

Search strategy principles:
- Use AND to combine concepts
- Use OR to include synonyms
- Use quotation marks for exact phrases
- Consider truncation (*) for word variations
- Include both technical and common terminology
- Balance sensitivity (comprehensive) vs specificity (precise)

Database-specific considerations:
- PubMed: Use MeSH terms, clinical focus
- arXiv: Technical terms, preprints
- Semantic Scholar: Broad coverage, AI/CS focus
- CrossRef: DOI-based, comprehensive metadata
- Europe PMC: European research, open access`,
  temperature: 0.5,
  maxTokens: 3000,
};

/**
 * Search concept with variations
 */
interface SearchConcept {
  id: string;
  mainTerm: string;
  synonyms: string[];
  meshTerms?: string[];
  relatedTerms: string[];
}

/**
 * Database-specific search query
 */
interface DatabaseSearchQuery {
  database: DatabaseSource;
  query: string;
  filters: {
    dateRange?: { start: string; end: string };
    articleTypes?: string[];
    languages?: string[];
  };
  priority: number;
  expectedResults: 'high' | 'medium' | 'low';
}

/**
 * Complete search strategy
 */
interface SearchStrategy {
  concepts: SearchConcept[];
  queries: DatabaseSearchQuery[];
  searchOrder: DatabaseSource[];
  estimatedCoverage: number;
}

/**
 * Result from search strategist
 */
interface SearchStrategistResult {
  strategy: SearchStrategy;
  concepts: SearchConcept[];
  perspectiveStrategies: Map<string, SearchStrategy>;
}

/**
 * Search Strategist Agent
 *
 * Creates comprehensive search strategies optimized for each academic
 * database, including keyword variations and Boolean queries.
 */
@RegisterAgent('search_strategist')
export class SearchStrategistAgent extends BaseAgent {
  private strategy: SearchStrategy | null = null;

  /**
   * Common medical/scientific synonyms
   */
  private readonly synonymMappings: Record<string, string[]> = {
    'artificial intelligence': ['AI', 'machine learning', 'deep learning', 'neural network'],
    'treatment': ['therapy', 'intervention', 'management', 'therapeutic'],
    'diagnosis': ['detection', 'identification', 'screening', 'diagnostic'],
    'patient': ['subject', 'participant', 'individual', 'case'],
    'outcome': ['result', 'endpoint', 'measure', 'finding'],
    'study': ['trial', 'research', 'investigation', 'analysis'],
    'effect': ['impact', 'influence', 'association', 'relationship'],
    'disease': ['disorder', 'condition', 'illness', 'pathology'],
    'cancer': ['neoplasm', 'malignancy', 'tumor', 'carcinoma'],
    'accuracy': ['precision', 'performance', 'sensitivity', 'specificity'],
  };

  constructor(sessionId: string) {
    super(SEARCH_STRATEGIST_CONFIG, sessionId);
  }

  /**
   * Extract key concepts from a research topic
   */
  private extractConcepts(topic: string): SearchConcept[] {
    const concepts: SearchConcept[] = [];
    const words = topic.toLowerCase().split(/\s+/);

    // Find multi-word phrases first
    const phrases: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      if (this.synonymMappings[twoWord]) {
        phrases.push(twoWord);
      }
    }

    // Add phrases as concepts
    phrases.forEach((phrase, index) => {
      concepts.push({
        id: `concept-${index + 1}`,
        mainTerm: phrase,
        synonyms: this.synonymMappings[phrase] || [],
        relatedTerms: [],
      });
    });

    // Add individual significant words
    const stopWords = new Set(['the', 'a', 'an', 'in', 'of', 'for', 'and', 'or', 'to', 'with', 'on']);
    words.forEach((word, index) => {
      if (!stopWords.has(word) && word.length > 2) {
        // Check if already covered by a phrase
        const inPhrase = phrases.some(p => p.includes(word));
        if (!inPhrase) {
          concepts.push({
            id: `concept-${concepts.length + 1}`,
            mainTerm: word,
            synonyms: this.synonymMappings[word] || [],
            relatedTerms: [],
          });
        }
      }
    });

    return concepts.slice(0, 5); // Limit to 5 main concepts
  }

  /**
   * Build Boolean query from concepts
   */
  private buildBooleanQuery(concepts: SearchConcept[], database: DatabaseSource): string {
    const conceptQueries = concepts.map(concept => {
      const terms = [concept.mainTerm, ...concept.synonyms];
      const quotedTerms = terms.map(t =>
        t.includes(' ') ? `"${t}"` : t
      );
      return `(${quotedTerms.join(' OR ')})`;
    });

    return conceptQueries.join(' AND ');
  }

  /**
   * Create database-specific query
   */
  private createDatabaseQuery(
    concepts: SearchConcept[],
    database: DatabaseSource,
    config: { dateStart?: Date; dateEnd?: Date }
  ): DatabaseSearchQuery {
    const query = this.buildBooleanQuery(concepts, database);

    // Database-specific adjustments
    let priority: number;
    let expectedResults: DatabaseSearchQuery['expectedResults'];

    switch (database) {
      case 'pubmed':
        priority = 1;
        expectedResults = 'high';
        break;
      case 'semantic_scholar':
        priority = 2;
        expectedResults = 'high';
        break;
      case 'arxiv':
        priority = 3;
        expectedResults = 'medium';
        break;
      case 'crossref':
        priority = 4;
        expectedResults = 'high';
        break;
      case 'europe_pmc':
        priority = 5;
        expectedResults = 'medium';
        break;
      case 'core':
        priority = 6;
        expectedResults = 'medium';
        break;
      default:
        priority = 10;
        expectedResults = 'low';
    }

    return {
      database,
      query,
      filters: {
        dateRange: config.dateStart && config.dateEnd ? {
          start: config.dateStart.toISOString().split('T')[0],
          end: config.dateEnd.toISOString().split('T')[0],
        } : undefined,
        languages: ['en'],
      },
      priority,
      expectedResults,
    };
  }

  /**
   * Determine search order based on topic
   */
  private determineSearchOrder(topic: string, sources: DatabaseSource[]): DatabaseSource[] {
    const lowercaseTopic = topic.toLowerCase();

    // Medical/clinical topics prioritize PubMed
    if (lowercaseTopic.match(/\b(medical|clinical|patient|treatment|disease|health)\b/)) {
      return sources.sort((a, b) => {
        const order: Record<DatabaseSource, number> = {
          pubmed: 1,
          europe_pmc: 2,
          semantic_scholar: 3,
          crossref: 4,
          arxiv: 5,
          core: 6,
        };
        return (order[a] || 10) - (order[b] || 10);
      });
    }

    // AI/CS topics prioritize arXiv
    if (lowercaseTopic.match(/\b(ai|machine learning|algorithm|neural|computer)\b/)) {
      return sources.sort((a, b) => {
        const order: Record<DatabaseSource, number> = {
          arxiv: 1,
          semantic_scholar: 2,
          crossref: 3,
          pubmed: 4,
          europe_pmc: 5,
          core: 6,
        };
        return (order[a] || 10) - (order[b] || 10);
      });
    }

    // Default order
    return sources;
  }

  /**
   * Execute the search strategist agent
   */
  async execute(context: AgentContext): Promise<AgentResult<SearchStrategistResult>> {
    this.updateStatus('working', 'Analyzing search requirements', 0);

    try {
      const { topic, config } = context.session;

      this.addMessage('system', this.config.systemPrompt);
      this.addMessage('user', `Create search strategy for: "${topic}"`);

      // Extract concepts
      this.updateStatus('working', 'Extracting search concepts', 20);
      const concepts = this.extractConcepts(topic);

      this.addMessage('assistant',
        `Identified ${concepts.length} key concepts: ${concepts.map(c => c.mainTerm).join(', ')}`
      );

      // Create queries for each database
      this.updateStatus('working', 'Building database queries', 40);
      const queries: DatabaseSearchQuery[] = config.sources.map(source =>
        this.createDatabaseQuery(concepts, source, {
          dateStart: config.dateRange.start,
          dateEnd: config.dateRange.end,
        })
      );

      // Determine search order
      this.updateStatus('working', 'Optimizing search order', 60);
      const searchOrder = this.determineSearchOrder(topic, config.sources);

      // Create strategy for each perspective if available
      this.updateStatus('working', 'Creating perspective strategies', 80);
      const perspectiveStrategies = new Map<string, SearchStrategy>();

      const perspectives = context.previousAgentOutputs.get('perspective_analyst') as
        { perspectives: Perspective[] } | undefined;

      if (perspectives?.perspectives) {
        for (const perspective of perspectives.perspectives) {
          const perspectiveConcepts = this.extractConcepts(
            `${topic} ${perspective.focusAreas.join(' ')}`
          );
          const perspectiveQueries = config.sources.map(source =>
            this.createDatabaseQuery(perspectiveConcepts, source, {
              dateStart: config.dateRange.start,
              dateEnd: config.dateRange.end,
            })
          );

          perspectiveStrategies.set(perspective.id, {
            concepts: perspectiveConcepts,
            queries: perspectiveQueries,
            searchOrder,
            estimatedCoverage: 0.8,
          });
        }
      }

      // Build main strategy
      this.strategy = {
        concepts,
        queries,
        searchOrder,
        estimatedCoverage: 0.85,
      };

      this.updateStatus('complete', 'Search strategy complete', 100);

      this.addMessage('assistant',
        `Created ${queries.length} database queries. Search order: ${searchOrder.join(' → ')}`
      );

      const result: SearchStrategistResult = {
        strategy: this.strategy,
        concepts,
        perspectiveStrategies,
      };

      return {
        success: true,
        data: result,
        messages: this.messages,
        tokensUsed: 0,
      };
    } catch (error) {
      this.updateStatus('error', `Strategy creation failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: this.messages,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get the current strategy
   */
  getStrategy(): SearchStrategy | null {
    return this.strategy;
  }
}
