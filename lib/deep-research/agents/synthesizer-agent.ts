// Deep Research - Synthesizer Agent
// Combines findings into coherent narrative with evidence synthesis

import {
  BaseAgent,
  RegisterAgent,
  type AgentConfig,
  type AgentContext,
  type AgentResult,
} from './base-agent';
import type {
  ResearchSource,
  Perspective,
  CitationType,
  SynthesisSection,
  EvidenceItem,
  ConflictingEvidence,
} from '../types';

/**
 * Synthesizer Agent Configuration
 */
const SYNTHESIZER_CONFIG: AgentConfig = {
  type: 'synthesizer',
  name: 'Research Synthesizer',
  description: 'Synthesizes findings from multiple sources into coherent narrative',
  systemPrompt: `You are a Research Synthesizer Agent specializing in evidence synthesis.

Your responsibilities:
1. Combine findings from multiple sources coherently
2. Identify themes and patterns across studies
3. Highlight areas of consensus and disagreement
4. Weight evidence by study quality and relevance
5. Create narrative synthesis with proper attribution

Synthesis principles:
- Group findings by theme, not by source
- Use meta-analytic thinking even without formal meta-analysis
- Highlight effect sizes and confidence where available
- Acknowledge heterogeneity in findings
- Maintain academic objectivity

Evidence weighting:
- Systematic reviews > RCTs > cohort studies > case studies
- Larger samples > smaller samples
- Recent studies for evolving fields
- Multiple independent replications increase confidence`,
  temperature: 0.4,
  maxTokens: 6000,
};

/**
 * Theme identified across sources
 */
interface SynthesisTheme {
  id: string;
  name: string;
  description: string;
  sourceIds: string[];
  strength: 'strong' | 'moderate' | 'weak';
  consensus: 'high' | 'mixed' | 'low';
}

/**
 * Evidence synthesis item
 */
interface SynthesizedEvidence {
  claim: string;
  supportingSources: string[];
  opposingSources: string[];
  strength: number; // 0-1
  confidence: 'high' | 'moderate' | 'low';
  notes: string;
}

/**
 * Result from synthesizer agent
 */
interface SynthesizerResult {
  themes: SynthesisTheme[];
  sections: SynthesisSection[];
  evidence: SynthesizedEvidence[];
  conflicts: ConflictingEvidence[];
  keyFindings: string[];
  gaps: string[];
}

/**
 * Synthesizer Agent
 *
 * Combines research findings from multiple sources into a coherent
 * narrative, identifying themes, consensus, and conflicts.
 */
@RegisterAgent('synthesizer')
export class SynthesizerAgent extends BaseAgent {
  private themes: SynthesisTheme[] = [];
  private sections: SynthesisSection[] = [];

  constructor(sessionId: string) {
    super(SYNTHESIZER_CONFIG, sessionId);
  }

  /**
   * Extract key themes from sources
   */
  private extractThemes(sources: ResearchSource[]): SynthesisTheme[] {
    const themeMap = new Map<string, {
      sources: string[];
      keywords: string[];
    }>();

    // Common research themes to look for
    const themePatterns: Record<string, RegExp> = {
      'efficacy': /\b(efficacy|effective|effectiveness|outcome|result)\b/i,
      'safety': /\b(safety|adverse|side effect|risk|harm)\b/i,
      'mechanism': /\b(mechanism|pathway|process|action)\b/i,
      'diagnosis': /\b(diagnosis|detection|screening|identification)\b/i,
      'treatment': /\b(treatment|therapy|intervention|management)\b/i,
      'prevention': /\b(prevention|prophylaxis|protective)\b/i,
      'prognosis': /\b(prognosis|survival|outcome|prediction)\b/i,
      'methodology': /\b(method|approach|technique|protocol)\b/i,
    };

    // Analyze each source for themes
    for (const source of sources) {
      const text = `${source.title} ${source.abstract || ''}`.toLowerCase();

      for (const [themeName, pattern] of Object.entries(themePatterns)) {
        if (pattern.test(text)) {
          if (!themeMap.has(themeName)) {
            themeMap.set(themeName, { sources: [], keywords: [] });
          }
          themeMap.get(themeName)!.sources.push(source.id);
        }
      }
    }

    // Convert to theme objects
    const themes: SynthesisTheme[] = [];
    let themeIndex = 0;

    for (const [name, data] of themeMap.entries()) {
      if (data.sources.length >= 2) { // Only include themes with 2+ sources
        const strength = data.sources.length >= 5 ? 'strong' :
                        data.sources.length >= 3 ? 'moderate' : 'weak';

        themes.push({
          id: `theme-${themeIndex++}`,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          description: `Research related to ${name}`,
          sourceIds: data.sources,
          strength,
          consensus: 'mixed', // Would be determined by citation analysis
        });
      }
    }

    return themes.sort((a, b) => b.sourceIds.length - a.sourceIds.length);
  }

  /**
   * Create synthesis sections from themes and sources
   */
  private createSections(
    themes: SynthesisTheme[],
    sources: ResearchSource[],
    perspectives: Perspective[]
  ): SynthesisSection[] {
    const sections: SynthesisSection[] = [];

    // Introduction section
    sections.push({
      id: 'section-intro',
      title: 'Introduction',
      content: this.generateIntroContent(sources),
      evidence: [],
      sourceIds: sources.slice(0, 3).map(s => s.id),
      order: 0,
    });

    // Theme-based sections
    themes.slice(0, 5).forEach((theme, index) => {
      const themeSources = sources.filter(s => theme.sourceIds.includes(s.id));
      const evidence = this.extractEvidence(themeSources);

      sections.push({
        id: `section-${theme.id}`,
        title: theme.name,
        content: this.generateThemeContent(theme, themeSources),
        evidence,
        sourceIds: theme.sourceIds,
        order: index + 1,
      });
    });

    // Perspective sections if available
    if (perspectives.length > 0) {
      perspectives.slice(0, 3).forEach((perspective, index) => {
        sections.push({
          id: `section-perspective-${index}`,
          title: `${perspective.name} Perspective`,
          content: this.generatePerspectiveContent(perspective, sources),
          evidence: [],
          sourceIds: sources.slice(0, 5).map(s => s.id),
          order: themes.length + index + 1,
        });
      });
    }

    // Conclusion section
    sections.push({
      id: 'section-conclusion',
      title: 'Conclusions',
      content: this.generateConclusionContent(themes, sources),
      evidence: [],
      sourceIds: sources.map(s => s.id),
      order: sections.length,
    });

    return sections;
  }

  /**
   * Generate introduction content
   */
  private generateIntroContent(sources: ResearchSource[]): string {
    const yearRange = this.getYearRange(sources);
    return `This synthesis examines ${sources.length} sources published between ${yearRange.min} and ${yearRange.max}, ` +
           `providing a comprehensive overview of the current state of research in this area.`;
  }

  /**
   * Generate theme-specific content
   */
  private generateThemeContent(theme: SynthesisTheme, sources: ResearchSource[]): string {
    const count = sources.length;
    const recentSources = sources.filter(s => s.year >= new Date().getFullYear() - 3);

    let content = `${count} studies addressed ${theme.name.toLowerCase()}. `;

    if (recentSources.length > 0) {
      content += `Of these, ${recentSources.length} were published in the last three years. `;
    }

    if (theme.strength === 'strong') {
      content += `The evidence base for this theme is robust with consistent findings across multiple studies.`;
    } else if (theme.strength === 'moderate') {
      content += `The evidence for this theme is moderate, with some variation in findings.`;
    } else {
      content += `Limited evidence is available for this theme, suggesting a need for further research.`;
    }

    return content;
  }

  /**
   * Generate perspective-specific content
   */
  private generatePerspectiveContent(perspective: Perspective, sources: ResearchSource[]): string {
    return `From the ${perspective.name} perspective, the research reveals several key insights. ` +
           `${perspective.description}. The questions raised from this viewpoint include: ` +
           perspective.questions.slice(0, 2).join('; ') + '.';
  }

  /**
   * Generate conclusion content
   */
  private generateConclusionContent(themes: SynthesisTheme[], sources: ResearchSource[]): string {
    const strongThemes = themes.filter(t => t.strength === 'strong');

    let content = `In summary, this synthesis of ${sources.length} sources reveals `;

    if (strongThemes.length > 0) {
      content += `strong evidence for themes related to ${strongThemes.map(t => t.name.toLowerCase()).join(', ')}. `;
    } else {
      content += `emerging patterns across the research landscape. `;
    }

    content += `Further research is needed to address identified gaps and strengthen the evidence base.`;

    return content;
  }

  /**
   * Extract evidence items from sources
   */
  private extractEvidence(sources: ResearchSource[]): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];

    for (const source of sources) {
      const content = source.extractedContent;
      if (!content) continue;

      // Extract from key findings
      content.keyFindings?.forEach((finding, index) => {
        evidence.push({
          id: `evidence-${source.id}-${index}`,
          claim: finding,
          sourceIds: [source.id],
          type: 'finding',
          strength: source.influenceScore || 0.5,
          quote: finding,
        });
      });

      // Extract from data points
      content.dataPoints?.forEach((dp, index) => {
        evidence.push({
          id: `evidence-${source.id}-dp-${index}`,
          claim: `${dp.label}: ${dp.value}`,
          sourceIds: [source.id],
          type: 'statistic',
          strength: 0.7,
          quote: dp.context,
        });
      });
    }

    return evidence;
  }

  /**
   * Identify conflicting evidence across sources
   */
  private identifyConflicts(
    sources: ResearchSource[],
    classifications: Map<string, CitationType>
  ): ConflictingEvidence[] {
    const conflicts: ConflictingEvidence[] = [];

    // Find sources with opposing citation types
    const supporting = sources.filter(s =>
      classifications.get(s.id) === 'supporting'
    );
    const disputing = sources.filter(s =>
      classifications.get(s.id) === 'disputing'
    );

    if (supporting.length > 0 && disputing.length > 0) {
      conflicts.push({
        id: 'conflict-main',
        topic: 'Primary research question',
        positionA: {
          claim: 'Evidence supports the hypothesis',
          sourceIds: supporting.map(s => s.id),
        },
        positionB: {
          claim: 'Evidence contradicts the hypothesis',
          sourceIds: disputing.map(s => s.id),
        },
        resolution: this.suggestResolution(supporting, disputing),
      });
    }

    return conflicts;
  }

  /**
   * Suggest resolution for conflicting evidence
   */
  private suggestResolution(
    supporting: ResearchSource[],
    disputing: ResearchSource[]
  ): string | undefined {
    const avgSupportYear = supporting.reduce((sum, s) => sum + s.year, 0) / supporting.length;
    const avgDisputeYear = disputing.reduce((sum, s) => sum + s.year, 0) / disputing.length;

    if (Math.abs(avgSupportYear - avgDisputeYear) > 3) {
      return avgSupportYear > avgDisputeYear
        ? 'More recent research tends to support the hypothesis'
        : 'More recent research challenges earlier supportive findings';
    }

    if (supporting.length > disputing.length * 2) {
      return 'The majority of evidence supports the hypothesis, though dissenting views exist';
    }

    if (disputing.length > supporting.length * 2) {
      return 'The weight of evidence challenges the hypothesis';
    }

    return 'The evidence remains mixed and further research is needed';
  }

  /**
   * Identify key findings across sources
   */
  private identifyKeyFindings(
    sources: ResearchSource[],
    themes: SynthesisTheme[]
  ): string[] {
    const findings: string[] = [];

    // Theme-based findings
    for (const theme of themes.slice(0, 3)) {
      const count = theme.sourceIds.length;
      findings.push(
        `${theme.name} emerged as a key theme, addressed by ${count} studies`
      );
    }

    // Source-based findings
    const highImpact = sources
      .filter(s => (s.citationCount || 0) > 50)
      .slice(0, 3);

    if (highImpact.length > 0) {
      findings.push(
        `${highImpact.length} highly-cited studies provide foundational evidence`
      );
    }

    // Recency findings
    const recent = sources.filter(s => s.year >= new Date().getFullYear() - 2);
    if (recent.length > 0) {
      findings.push(
        `${recent.length} studies from the past two years show ongoing research activity`
      );
    }

    return findings;
  }

  /**
   * Identify research gaps
   */
  private identifyGaps(
    sources: ResearchSource[],
    themes: SynthesisTheme[]
  ): string[] {
    const gaps: string[] = [];

    // Weak themes suggest gaps
    const weakThemes = themes.filter(t => t.strength === 'weak');
    for (const theme of weakThemes) {
      gaps.push(`Limited research on ${theme.name.toLowerCase()}`);
    }

    // Check for methodology gaps
    const hasRCTs = sources.some(s =>
      s.abstract?.toLowerCase().includes('randomized') ||
      s.abstract?.toLowerCase().includes('randomised')
    );
    if (!hasRCTs) {
      gaps.push('Lack of randomized controlled trials');
    }

    // Check for long-term studies
    const hasLongTerm = sources.some(s =>
      s.abstract?.toLowerCase().includes('long-term') ||
      s.abstract?.toLowerCase().includes('longitudinal')
    );
    if (!hasLongTerm) {
      gaps.push('Absence of long-term follow-up studies');
    }

    // Check for diverse populations
    const hasMulticenter = sources.some(s =>
      s.abstract?.toLowerCase().includes('multicenter') ||
      s.abstract?.toLowerCase().includes('multi-center')
    );
    if (!hasMulticenter) {
      gaps.push('Need for multicenter studies across diverse populations');
    }

    return gaps.slice(0, 5);
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
   * Execute the synthesizer agent
   */
  async execute(context: AgentContext): Promise<AgentResult<SynthesizerResult>> {
    this.updateStatus('working', 'Beginning synthesis', 0);
    let totalTokensUsed = 0;

    try {
      const { topic } = context.session;
      const modelType = (context.session as { model?: string }).model || 'deepseek';

      // Get sources from researcher
      const researcherOutput = context.previousAgentOutputs.get('researcher') as
        { selectedSources: ResearchSource[] } | undefined;

      // Get citation classifications
      const citationOutput = context.previousAgentOutputs.get('citation_analyst') as
        { classifications: Array<{ sourceId: string; citationType: CitationType }> } | undefined;

      // Get perspectives
      const perspectiveOutput = context.previousAgentOutputs.get('perspective_analyst') as
        { perspectives: Perspective[] } | undefined;

      const sources = researcherOutput?.selectedSources || context.session.sources;
      const perspectives = perspectiveOutput?.perspectives || [];

      if (!sources || sources.length === 0) {
        throw new Error('No sources available for synthesis');
      }

      // Build citation type map
      const classificationMap = new Map<string, CitationType>();
      citationOutput?.classifications?.forEach(c => {
        classificationMap.set(c.sourceId, c.citationType);
      });

      this.addMessage('system', this.config.systemPrompt);
      this.addMessage('user', `Synthesize findings from ${sources.length} sources on: "${topic}"`);

      // Extract themes using LLM
      this.updateStatus('working', 'Extracting themes with LLM', 20);

      // Prepare source summaries for LLM
      const sourceSummaries = sources.slice(0, 20).map(s => ({
        id: s.id,
        title: s.title,
        year: s.year,
        abstract: s.abstract?.slice(0, 300) || '',
        citationCount: s.citationCount || 0,
      }));

      const themePrompt = `Analyze these ${sources.length} research sources on "${topic}" and identify key themes.

Sources:
${JSON.stringify(sourceSummaries, null, 2)}

Identify 3-7 major themes that emerge from this research. For each theme, provide:
1. A descriptive name
2. A brief description
3. Which source IDs relate to this theme
4. Theme strength (strong/moderate/weak based on evidence quantity)
5. Consensus level (high/mixed/low)

Return as JSON:
{
  "themes": [
    {
      "name": "Theme Name",
      "description": "Brief description",
      "sourceIds": ["id1", "id2"],
      "strength": "strong",
      "consensus": "high"
    }
  ],
  "keyFindings": ["Finding 1", "Finding 2"],
  "gaps": ["Gap 1", "Gap 2"]
}`;

      const { text: themeResponse, tokensUsed: themeTokens } = await this.callLLM(themePrompt, modelType);
      totalTokensUsed += themeTokens;

      // Parse LLM response for themes
      let llmThemes: Array<{
        name: string;
        description: string;
        sourceIds: string[];
        strength: 'strong' | 'moderate' | 'weak';
        consensus: 'high' | 'mixed' | 'low';
      }> = [];
      let llmKeyFindings: string[] = [];
      let llmGaps: string[] = [];

      try {
        const jsonMatch = themeResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          llmThemes = parsed.themes || [];
          llmKeyFindings = parsed.keyFindings || [];
          llmGaps = parsed.gaps || [];
        }
      } catch {
        console.warn('Failed to parse LLM theme response, using fallback');
      }

      // Use LLM themes or fallback to pattern extraction
      if (llmThemes.length > 0) {
        this.themes = llmThemes.map((t, idx) => ({
          id: `theme-${idx}`,
          name: t.name,
          description: t.description,
          sourceIds: t.sourceIds,
          strength: t.strength,
          consensus: t.consensus,
        }));
      } else {
        this.themes = this.extractThemes(sources);
      }

      this.addMessage('assistant', themeResponse);
      this.addMessage('assistant', `Identified ${this.themes.length} themes across sources`);

      // Create synthesis sections with LLM
      this.updateStatus('working', 'Generating synthesis content with LLM', 50);

      const synthesisPrompt = `Create a comprehensive research synthesis on "${topic}" based on these themes and sources.

Themes identified:
${JSON.stringify(this.themes, null, 2)}

Perspectives to consider:
${perspectives.map(p => `- ${p.name}: ${p.description}`).join('\n')}

Generate synthesis sections in JSON format:
{
  "sections": [
    {
      "title": "Introduction",
      "content": "Synthesized narrative text with proper academic style..."
    },
    {
      "title": "Theme Name 1",
      "content": "Detailed analysis of this theme..."
    }
  ],
  "evidence": [
    {
      "claim": "Key claim from synthesis",
      "confidence": "high",
      "notes": "Supporting rationale"
    }
  ]
}

Write in academic prose, cite findings by author/year where possible, and maintain scholarly objectivity.`;

      const { text: synthesisResponse, tokensUsed: synthesisTokens } = await this.callLLM(synthesisPrompt, modelType);
      totalTokensUsed += synthesisTokens;

      // Parse synthesis response
      let llmSections: Array<{ title: string; content: string }> = [];
      let llmEvidence: Array<{ claim: string; confidence: string; notes: string }> = [];

      try {
        const jsonMatch = synthesisResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          llmSections = parsed.sections || [];
          llmEvidence = parsed.evidence || [];
        }
      } catch {
        console.warn('Failed to parse LLM synthesis response, using fallback');
      }

      // Convert to proper section format
      if (llmSections.length > 0) {
        this.sections = llmSections.map((s, idx) => ({
          id: `section-${idx}`,
          title: s.title,
          content: s.content,
          evidence: [],
          sourceIds: sources.slice(0, 5).map(src => src.id),
          order: idx,
        }));
      } else {
        this.sections = this.createSections(this.themes, sources, perspectives);
      }

      this.addMessage('assistant', synthesisResponse);

      // Synthesize evidence
      this.updateStatus('working', 'Synthesizing evidence', 70);
      const evidence: SynthesizedEvidence[] = llmEvidence.length > 0
        ? llmEvidence.map((e, idx) => ({
            claim: e.claim,
            supportingSources: sources.slice(0, 3).map(s => s.id),
            opposingSources: [],
            strength: e.confidence === 'high' ? 0.9 : e.confidence === 'moderate' ? 0.6 : 0.3,
            confidence: (e.confidence as 'high' | 'moderate' | 'low') || 'moderate',
            notes: e.notes,
          }))
        : this.themes.map(theme => ({
            claim: `Research supports ${theme.name.toLowerCase()} as a key area`,
            supportingSources: theme.sourceIds,
            opposingSources: [],
            strength: theme.strength === 'strong' ? 0.9 : theme.strength === 'moderate' ? 0.6 : 0.3,
            confidence: theme.strength === 'strong' ? 'high' : theme.strength === 'moderate' ? 'moderate' : 'low',
            notes: theme.description,
          }));

      // Identify conflicts
      this.updateStatus('working', 'Identifying conflicts', 85);
      const conflicts = this.identifyConflicts(sources, classificationMap);

      // Use LLM-generated findings/gaps or fallback
      const keyFindings = llmKeyFindings.length > 0 ? llmKeyFindings : this.identifyKeyFindings(sources, this.themes);
      const gaps = llmGaps.length > 0 ? llmGaps : this.identifyGaps(sources, this.themes);

      this.updateStatus('complete', 'Synthesis complete', 100);

      this.addMessage('assistant',
        `Synthesis complete with ${this.sections.length} sections, ` +
        `${keyFindings.length} key findings, and ${gaps.length} identified gaps using ${modelType} model.`
      );

      const result: SynthesizerResult = {
        themes: this.themes,
        sections: this.sections,
        evidence,
        conflicts,
        keyFindings,
        gaps,
      };

      return {
        success: true,
        data: result,
        messages: this.messages,
        tokensUsed: totalTokensUsed,
      };
    } catch (error) {
      this.updateStatus('error', `Synthesis failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: this.messages,
        tokensUsed: totalTokensUsed,
      };
    }
  }

  /**
   * Get synthesis themes
   */
  getThemes(): SynthesisTheme[] {
    return [...this.themes];
  }

  /**
   * Get synthesis sections
   */
  getSections(): SynthesisSection[] {
    return [...this.sections];
  }
}
