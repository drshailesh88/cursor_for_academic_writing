// Deep Research - Writer Agent
// Generates final research report with proper formatting and citations

import {
  BaseAgent,
  RegisterAgent,
  type AgentConfig,
  type AgentContext,
  type AgentResult,
} from './base-agent';
import type {
  ResearchSource,
  SynthesisSection,
  ResearchReport,
  ReportSection,
  Reference,
  Author,
} from '../types';

/**
 * Writer Agent Configuration
 */
const WRITER_CONFIG: AgentConfig = {
  type: 'writer',
  name: 'Research Writer',
  description: 'Generates final research report with proper formatting and citations',
  systemPrompt: `You are a Research Writer Agent specializing in academic writing.

Your responsibilities:
1. Transform synthesis into polished academic prose
2. Format references according to specified style
3. Ensure consistent academic tone throughout
4. Create executive summary and key takeaways
5. Structure report for maximum readability

Writing guidelines:
- Use active voice where possible
- Cite sources naturally in the flow of text
- Avoid jargon or explain technical terms
- Use data-driven language (percentages, statistics)
- Maintain objectivity - present evidence, not opinions
- Acknowledge limitations and gaps

Report structure:
1. Executive Summary
2. Introduction
3. Methodology
4. Findings (by theme)
5. Discussion
6. Conclusions
7. Limitations
8. References`,
  temperature: 0.5,
  maxTokens: 8000,
};

/**
 * Citation style options
 */
type CitationStyle = 'apa' | 'vancouver' | 'harvard' | 'chicago';

/**
 * Writer configuration options
 */
interface WriterOptions {
  citationStyle: CitationStyle;
  includeAbstract: boolean;
  includeKeywords: boolean;
  maxWordCount?: number;
}

/**
 * Result from writer agent
 */
interface WriterResult {
  report: ResearchReport;
  wordCount: number;
  citationCount: number;
  readingTime: number; // minutes
}

/**
 * Writer Agent
 *
 * Generates the final research report from synthesized findings,
 * with proper academic formatting and citations.
 */
@RegisterAgent('writer')
export class WriterAgent extends BaseAgent {
  private report: ResearchReport | null = null;
  private options: WriterOptions = {
    citationStyle: 'apa',
    includeAbstract: true,
    includeKeywords: true,
  };

  constructor(sessionId: string) {
    super(WRITER_CONFIG, sessionId);
  }

  /**
   * Set writer options
   */
  setOptions(options: Partial<WriterOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    topic: string,
    sections: SynthesisSection[],
    sources: ResearchSource[],
    keyFindings: string[]
  ): string {
    const yearRange = this.getYearRange(sources);

    let summary = `This research synthesis examines ${topic}, `;
    summary += `drawing on ${sources.length} sources published between ${yearRange.min} and ${yearRange.max}. `;

    if (keyFindings.length > 0) {
      summary += `\n\nKey findings include:\n`;
      keyFindings.slice(0, 5).forEach((finding, i) => {
        summary += `${i + 1}. ${finding}\n`;
      });
    }

    const contentSections = sections.filter(
      s => !['Introduction', 'Conclusions'].includes(s.title)
    );
    if (contentSections.length > 0) {
      summary += `\nThe synthesis covers ${contentSections.length} major themes: `;
      summary += contentSections.map(s => s.title.toLowerCase()).join(', ');
      summary += '.';
    }

    return summary;
  }

  /**
   * Generate introduction section
   */
  private generateIntroduction(
    topic: string,
    sources: ResearchSource[],
    existingIntro?: string
  ): string {
    if (existingIntro && existingIntro.length > 100) {
      return existingIntro;
    }

    let intro = `The current body of research on ${topic} encompasses a diverse range of studies `;
    intro += `investigating various aspects of this important topic. `;
    intro += `Understanding the current state of evidence is essential for informing `;
    intro += `future research directions and practical applications.\n\n`;

    intro += `This synthesis aims to provide a comprehensive overview of the available literature, `;
    intro += `identifying key themes, areas of consensus, and remaining gaps in our understanding. `;

    const recentCount = sources.filter(s => s.year >= new Date().getFullYear() - 3).length;
    if (recentCount > 0) {
      intro += `Notably, ${recentCount} of the ${sources.length} included studies `;
      intro += `were published within the last three years, reflecting ongoing research activity in this area.`;
    }

    return intro;
  }

  /**
   * Generate methodology section
   */
  private generateMethodology(sources: ResearchSource[]): string {
    const databases = [...new Set(sources.map(s => s.database))];
    const yearRange = this.getYearRange(sources);

    let methodology = `### Search Strategy\n\n`;
    methodology += `A systematic search was conducted across ${databases.length} academic database(s) `;
    methodology += `(${databases.join(', ')}). `;
    methodology += `Studies published between ${yearRange.min} and ${yearRange.max} were considered for inclusion.\n\n`;

    methodology += `### Inclusion Criteria\n\n`;
    methodology += `Studies were included if they:\n`;
    methodology += `- Were published in peer-reviewed journals\n`;
    methodology += `- Addressed the primary research topic\n`;
    methodology += `- Provided relevant findings or data\n\n`;

    methodology += `### Study Selection\n\n`;
    methodology += `A total of ${sources.length} sources met the inclusion criteria. `;

    // Describe study types
    const hasRCT = sources.some(s => s.abstract?.toLowerCase().includes('randomized'));
    const hasReview = sources.some(s => s.abstract?.toLowerCase().includes('systematic review'));
    const hasCohort = sources.some(s => s.abstract?.toLowerCase().includes('cohort'));

    const types: string[] = [];
    if (hasRCT) types.push('randomized controlled trials');
    if (hasReview) types.push('systematic reviews');
    if (hasCohort) types.push('cohort studies');

    if (types.length > 0) {
      methodology += `The included studies encompass ${types.join(', ')}, and other study designs.`;
    }

    return methodology;
  }

  /**
   * Format a section for the report
   */
  private formatSection(section: SynthesisSection, sources: ResearchSource[]): ReportSection {
    let content = section.content;

    // Add evidence with citations
    if (section.evidence.length > 0) {
      content += '\n\n';
      for (const evidence of section.evidence) {
        const citations = this.formatInlineCitations(evidence.sourceIds, sources);
        if (evidence.quote) {
          content += `"${evidence.quote}" ${citations}. `;
        } else {
          content += `${evidence.claim} ${citations}. `;
        }
      }
    }

    return {
      id: section.id,
      title: section.title,
      content,
      order: section.order,
    };
  }

  /**
   * Format inline citations according to style
   */
  private formatInlineCitations(sourceIds: string[], sources: ResearchSource[]): string {
    const citedSources = sources.filter(s => sourceIds.includes(s.id));
    if (citedSources.length === 0) return '';

    switch (this.options.citationStyle) {
      case 'apa':
        return this.formatAPACitation(citedSources);
      case 'vancouver':
        return this.formatVancouverCitation(citedSources, sources);
      case 'harvard':
        return this.formatHarvardCitation(citedSources);
      case 'chicago':
        return this.formatChicagoCitation(citedSources);
      default:
        return this.formatAPACitation(citedSources);
    }
  }

  /**
   * Format APA style citation
   */
  private formatAPACitation(sources: ResearchSource[]): string {
    if (sources.length === 1) {
      const s = sources[0];
      const firstAuthor = s.authors[0]?.name.split(' ').pop() || 'Unknown';
      if (s.authors.length === 1) {
        return `(${firstAuthor}, ${s.year})`;
      } else if (s.authors.length === 2) {
        const secondAuthor = s.authors[1].name.split(' ').pop();
        return `(${firstAuthor} & ${secondAuthor}, ${s.year})`;
      } else {
        return `(${firstAuthor} et al., ${s.year})`;
      }
    }

    // Multiple sources
    const citations = sources.map(s => {
      const firstAuthor = s.authors[0]?.name.split(' ').pop() || 'Unknown';
      return `${firstAuthor}, ${s.year}`;
    });
    return `(${citations.join('; ')})`;
  }

  /**
   * Format Vancouver style citation (numbered)
   */
  private formatVancouverCitation(citedSources: ResearchSource[], allSources: ResearchSource[]): string {
    const numbers = citedSources.map(s => allSources.findIndex(as => as.id === s.id) + 1);
    if (numbers.length === 1) {
      return `[${numbers[0]}]`;
    }
    return `[${numbers.join(',')}]`;
  }

  /**
   * Format Harvard style citation
   */
  private formatHarvardCitation(sources: ResearchSource[]): string {
    // Similar to APA but slightly different formatting
    return this.formatAPACitation(sources);
  }

  /**
   * Format Chicago style citation
   */
  private formatChicagoCitation(sources: ResearchSource[]): string {
    // Footnote style would need different handling
    // Using author-date for simplicity
    return this.formatAPACitation(sources);
  }

  /**
   * Generate reference list
   */
  private generateReferences(sources: ResearchSource[]): Reference[] {
    return sources.map((source, index) => {
      const formatted = this.formatReference(source);
      return {
        id: source.id,
        number: index + 1,
        authors: source.authors,
        year: source.year,
        title: source.title,
        journal: source.journal,
        doi: source.doi,
        pmid: source.pmid,
        url: source.url,
        formatted,
      };
    });
  }

  /**
   * Format a single reference
   */
  private formatReference(source: ResearchSource): string {
    const authors = this.formatAuthors(source.authors);
    const year = source.year;
    const title = source.title;
    const journal = source.journal || 'Unknown Journal';

    switch (this.options.citationStyle) {
      case 'apa':
        return `${authors} (${year}). ${title}. *${journal}*.${source.doi ? ` https://doi.org/${source.doi}` : ''}`;
      case 'vancouver':
        return `${authors}. ${title}. ${journal}. ${year}.${source.pmid ? ` PMID: ${source.pmid}` : ''}`;
      case 'harvard':
        return `${authors} (${year}) '${title}', *${journal}*.`;
      case 'chicago':
        return `${authors}. "${title}." *${journal}* (${year}).`;
      default:
        return `${authors} (${year}). ${title}. ${journal}.`;
    }
  }

  /**
   * Format authors list
   */
  private formatAuthors(authors: Author[]): string {
    if (authors.length === 0) return 'Unknown Author';
    if (authors.length === 1) return authors[0].name;
    if (authors.length === 2) return `${authors[0].name} & ${authors[1].name}`;

    // APA style: First 19 authors, then ... last author
    if (authors.length <= 7) {
      const allButLast = authors.slice(0, -1).map(a => a.name).join(', ');
      return `${allButLast}, & ${authors[authors.length - 1].name}`;
    }

    return `${authors[0].name}, et al.`;
  }

  /**
   * Generate keywords from content
   */
  private generateKeywords(topic: string, sections: SynthesisSection[]): string[] {
    const keywords = new Set<string>();

    // Extract from topic
    const topicWords = topic.split(/\s+/)
      .filter(w => w.length > 4)
      .map(w => w.toLowerCase());
    topicWords.forEach(w => keywords.add(w));

    // Extract from section titles
    sections.forEach(s => {
      const titleWords = s.title.split(/\s+/)
        .filter(w => w.length > 4)
        .map(w => w.toLowerCase());
      titleWords.forEach(w => keywords.add(w));
    });

    return [...keywords].slice(0, 8);
  }

  /**
   * Calculate reading time
   */
  private calculateReadingTime(wordCount: number): number {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Get year range from sources
   */
  private getYearRange(sources: ResearchSource[]): { min: number; max: number } {
    const years = sources.map(s => s.year);
    return {
      min: Math.min(...years),
      max: Math.max(...years),
    };
  }

  /**
   * Generate limitations section
   */
  private generateLimitations(gaps: string[]): string {
    let limitations = `This synthesis has several limitations that should be considered when interpreting the findings.\n\n`;

    if (gaps.length > 0) {
      limitations += `The following gaps were identified in the literature:\n`;
      gaps.forEach((gap, i) => {
        limitations += `${i + 1}. ${gap}\n`;
      });
      limitations += '\n';
    }

    limitations += `Additionally, the quality of evidence varies across included studies, `;
    limitations += `and the synthesis may be limited by publication bias toward positive findings.`;

    return limitations;
  }

  /**
   * Execute the writer agent
   */
  async execute(context: AgentContext): Promise<AgentResult<WriterResult>> {
    this.updateStatus('working', 'Generating research report', 0);

    try {
      const { topic } = context.session;

      // Get data from previous agents
      const researcherOutput = context.previousAgentOutputs.get('researcher') as
        { selectedSources: ResearchSource[] } | undefined;

      const synthesizerOutput = context.previousAgentOutputs.get('synthesizer') as
        {
          sections: SynthesisSection[];
          keyFindings: string[];
          gaps: string[];
        } | undefined;

      const sources = researcherOutput?.selectedSources || context.session.sources;
      const sections = synthesizerOutput?.sections || [];
      const keyFindings = synthesizerOutput?.keyFindings || [];
      const gaps = synthesizerOutput?.gaps || [];

      if (!sources || sources.length === 0) {
        throw new Error('No sources available for report generation');
      }

      this.addMessage('system', this.config.systemPrompt);
      this.addMessage('user', `Generate research report on: "${topic}"`);

      // Generate report components
      this.updateStatus('working', 'Generating executive summary', 10);
      const executiveSummary = this.generateExecutiveSummary(topic, sections, sources, keyFindings);

      this.updateStatus('working', 'Generating introduction', 20);
      const introSection = sections.find(s => s.title === 'Introduction');
      const introduction = this.generateIntroduction(topic, sources, introSection?.content);

      this.updateStatus('working', 'Generating methodology', 30);
      const methodology = this.generateMethodology(sources);

      // Format content sections
      this.updateStatus('working', 'Formatting sections', 50);
      const contentSections = sections
        .filter(s => !['Introduction', 'Conclusions'].includes(s.title))
        .map(s => this.formatSection(s, sources));

      // Generate conclusions
      this.updateStatus('working', 'Generating conclusions', 65);
      const conclusionSection = sections.find(s => s.title === 'Conclusions');
      const conclusions = conclusionSection?.content ||
        `This synthesis highlights the current state of research on ${topic}. ` +
        `Further investigation is warranted to address identified gaps.`;

      // Generate limitations
      this.updateStatus('working', 'Generating limitations', 75);
      const limitations = this.generateLimitations(gaps);

      // Generate references
      this.updateStatus('working', 'Formatting references', 85);
      const references = this.generateReferences(sources);

      // Generate keywords
      const keywords = this.options.includeKeywords
        ? this.generateKeywords(topic, sections)
        : undefined;

      // Assemble report
      this.updateStatus('working', 'Assembling report', 95);

      this.report = {
        id: `report-${context.session.id}`,
        sessionId: context.session.id,
        title: `Research Synthesis: ${topic}`,
        abstract: this.options.includeAbstract ? executiveSummary : undefined,
        keywords,
        sections: [
          {
            id: 'section-summary',
            title: 'Executive Summary',
            content: executiveSummary,
            order: 0,
          },
          {
            id: 'section-introduction',
            title: 'Introduction',
            content: introduction,
            order: 1,
          },
          {
            id: 'section-methodology',
            title: 'Methodology',
            content: methodology,
            order: 2,
          },
          ...contentSections.map((s, i) => ({ ...s, order: i + 3 })),
          {
            id: 'section-conclusions',
            title: 'Conclusions',
            content: conclusions,
            order: contentSections.length + 3,
          },
          {
            id: 'section-limitations',
            title: 'Limitations',
            content: limitations,
            order: contentSections.length + 4,
          },
        ],
        references,
        generatedAt: new Date() as any,
        citationStyle: this.options.citationStyle,
      };

      // Calculate stats
      const allContent = this.report.sections.map(s => s.content).join(' ');
      const wordCount = this.countWords(allContent);
      const readingTime = this.calculateReadingTime(wordCount);

      this.updateStatus('complete', 'Report generation complete', 100);

      this.addMessage('assistant',
        `Generated research report with ${this.report.sections.length} sections, ` +
        `${references.length} references, ${wordCount} words (${readingTime} min read)`
      );

      const result: WriterResult = {
        report: this.report,
        wordCount,
        citationCount: references.length,
        readingTime,
      };

      return {
        success: true,
        data: result,
        messages: this.messages,
        tokensUsed: 0,
      };
    } catch (error) {
      this.updateStatus('error', `Report generation failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: this.messages,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get generated report
   */
  getReport(): ResearchReport | null {
    return this.report;
  }

  /**
   * Export report as markdown
   */
  exportAsMarkdown(): string {
    if (!this.report) return '';

    let markdown = `# ${this.report.title}\n\n`;

    if (this.report.keywords) {
      markdown += `**Keywords:** ${this.report.keywords.join(', ')}\n\n`;
    }

    markdown += `---\n\n`;

    for (const section of this.report.sections) {
      markdown += `## ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
    }

    markdown += `## References\n\n`;
    for (const ref of this.report.references) {
      markdown += `${ref.number}. ${ref.formatted}\n\n`;
    }

    return markdown;
  }
}
