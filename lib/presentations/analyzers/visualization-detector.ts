/**
 * Visualization Detection System
 * Detects opportunities to convert text content into visual elements
 * (charts, flowcharts, tables) for presentation slides
 */

import {
  VisualizationOpportunity,
  DataPoint,
  ChartType,
  ChartConfig,
  TableConfig,
  FlowchartConfig,
  DataPattern,
  ChartData,
} from '../types';

// Note: Import this once content-extractor is created
// import { extractDataPatterns } from '../extractors/content-extractor';

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detect all visualization opportunities in given content
 * @param content - Text content to analyze
 * @param dataPatterns - Pre-extracted data patterns from content
 * @returns Array of visualization opportunities ranked by confidence
 */
export async function detectVisualizations(
  content: string,
  dataPatterns: DataPattern[]
): Promise<VisualizationOpportunity[]> {
  const opportunities: VisualizationOpportunity[] = [];

  // Split content into paragraphs for better context
  const paragraphs = content
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  for (const paragraph of paragraphs) {
    const position = {
      start: content.indexOf(paragraph),
      end: content.indexOf(paragraph) + paragraph.length,
    };

    // Try each detection type
    const comparison = detectComparison(paragraph);
    const trend = detectTrend(paragraph);
    const proportions = detectProportions(paragraph);
    const process = detectProcess(paragraph);
    const tabular = detectTabularData(paragraph);

    // Add opportunities with their positions
    if (comparison) {
      opportunities.push({ ...comparison, position });
    }
    if (trend) {
      opportunities.push({ ...trend, position });
    }
    if (proportions) {
      opportunities.push({ ...proportions, position });
    }
    if (process) {
      opportunities.push({ ...process, position });
    }
    if (tabular) {
      opportunities.push({ ...tabular, position });
    }
  }

  // Use data patterns to enhance detection
  const chartType = suggestChartType(dataPatterns);
  if (chartType && opportunities.length === 0) {
    // If we have data patterns but no opportunities detected,
    // create a generic opportunity
    opportunities.push({
      sourceText: content.slice(0, 200),
      type: chartType,
      confidence: 0.6,
      extractedData: [],
      suggestedConfig: {},
      position: { start: 0, end: content.length },
    });
  }

  // Sort by confidence (highest first)
  return opportunities.sort((a, b) => b.confidence - a.confidence);
}

// ============================================================================
// COMPARISON DETECTION (Bar Charts)
// ============================================================================

/**
 * Detect text describing comparisons between groups/categories
 * Best visualized as bar charts or grouped bar charts
 */
export function detectComparison(text: string): VisualizationOpportunity | null {
  const comparisonKeywords = [
    'compared to',
    'versus',
    'vs\\.?',
    'higher than',
    'lower than',
    'greater than',
    'less than',
    'more than',
    'compared with',
    'in contrast to',
    'relative to',
  ];

  const groupKeywords = [
    'group a',
    'group b',
    'cohort',
    'arm',
    'treatment group',
    'control group',
    'intervention',
    'placebo',
  ];

  let confidence = 0;
  const lowerText = text.toLowerCase();

  // Check for comparison language
  for (const keyword of comparisonKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerText)) {
      confidence += 0.2;
      break;
    }
  }

  // Check for group mentions
  for (const keyword of groupKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerText)) {
      confidence += 0.15;
    }
  }

  // Check for multiple percentages (strong indicator)
  const percentageMatches = text.match(/\d+\.?\d*%/g);
  if (percentageMatches && percentageMatches.length >= 2) {
    confidence += 0.3;
  }

  // Check for numerical comparisons
  const numericalPattern = /\d+\.?\d*\s*(vs\.?|versus|compared to)\s*\d+\.?\d*/gi;
  if (numericalPattern.test(text)) {
    confidence += 0.25;
  }

  if (confidence < 0.4) {
    return null;
  }

  // Extract data points
  const dataPoints = extractDataPoints(text, 'bar');

  // Determine if stacked or grouped
  const hasCategories = /category|type|kind/gi.test(lowerText);
  const suggestedType: ChartType = hasCategories ? 'stacked-bar' : 'bar';

  return {
    sourceText: text,
    type: suggestedType,
    confidence: Math.min(confidence, 0.95),
    extractedData: dataPoints,
    suggestedConfig: {
      type: suggestedType,
      data: dataPointsToChartData(dataPoints),
      options: {
        title: extractPotentialTitle(text),
        showLegend: dataPoints.length > 3,
        showGrid: true,
      },
    } as Partial<ChartConfig>,
    position: { start: 0, end: 0 }, // Will be set by caller
  };
}

// ============================================================================
// TREND DETECTION (Line Charts)
// ============================================================================

/**
 * Detect text describing changes over time
 * Best visualized as line charts or area charts
 */
export function detectTrend(text: string): VisualizationOpportunity | null {
  const timeKeywords = [
    'over time',
    'from \\d{4} to \\d{4}',
    'between \\d{4} and \\d{4}',
    'during',
    'throughout',
    'across years',
    'longitudinal',
    'follow-up',
    'baseline to',
    'at week \\d+',
    'at month \\d+',
    'year \\d+',
  ];

  const trendKeywords = [
    'increased',
    'decreased',
    'grew',
    'declined',
    'rose',
    'fell',
    'improved',
    'worsened',
    'progressed',
    'regressed',
    'escalated',
    'dropped',
    'trend',
    'trajectory',
  ];

  let confidence = 0;
  const lowerText = text.toLowerCase();

  // Check for time-related language
  for (const keyword of timeKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerText)) {
      confidence += 0.3;
      break;
    }
  }

  // Check for trend language
  for (const keyword of trendKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerText)) {
      confidence += 0.2;
      break;
    }
  }

  // Check for sequential time mentions (2020, 2021, 2022)
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g);
  if (yearMatches && yearMatches.length >= 2) {
    confidence += 0.25;
  }

  // Check for time series data (week 1, week 2, etc.)
  const timeSeriesPattern = /(week|month|day|year)\s*\d+/gi;
  const timeSeriesMatches = text.match(timeSeriesPattern);
  if (timeSeriesMatches && timeSeriesMatches.length >= 2) {
    confidence += 0.25;
  }

  if (confidence < 0.4) {
    return null;
  }

  const dataPoints = extractDataPoints(text, 'line');
  const hasMultipleSeries = /group|cohort|arm/gi.test(lowerText);

  return {
    sourceText: text,
    type: hasMultipleSeries ? 'multi-line' : 'line',
    confidence: Math.min(confidence, 0.95),
    extractedData: dataPoints,
    suggestedConfig: {
      type: hasMultipleSeries ? 'multi-line' : 'line',
      data: dataPointsToChartData(dataPoints),
      options: {
        title: extractPotentialTitle(text),
        showLegend: hasMultipleSeries,
        showGrid: true,
      },
    } as Partial<ChartConfig>,
    position: { start: 0, end: 0 },
  };
}

// ============================================================================
// PROPORTION DETECTION (Pie/Donut Charts)
// ============================================================================

/**
 * Detect text describing parts of a whole or distributions
 * Best visualized as pie or donut charts
 */
export function detectProportions(text: string): VisualizationOpportunity | null {
  const distributionKeywords = [
    'comprised of',
    'consisted of',
    'made up of',
    'breakdown',
    'composition',
    'distribution',
    'proportion',
    'percentage breakdown',
    'accounted for',
    'represented',
  ];

  const partsOfWholePatterns = [
    /(\d+\.?\d*)%\s+were/gi,
    /(\d+\.?\d*)%\s+had/gi,
    /(\d+\.?\d*)%\s+showed/gi,
    /(\d+\.?\d*)%\s+reported/gi,
  ];

  let confidence = 0;
  const lowerText = text.toLowerCase();

  // Check for distribution language
  for (const keyword of distributionKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerText)) {
      confidence += 0.25;
      break;
    }
  }

  // Check for parts-of-whole patterns
  let partsCount = 0;
  for (const pattern of partsOfWholePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      partsCount += matches.length;
    }
  }
  if (partsCount >= 2) {
    confidence += 0.3;
  }

  // Extract percentages and check if they sum to ~100
  const percentages = extractPercentages(text);
  if (percentages.length >= 2) {
    const sum = percentages.reduce((a, b) => a + b, 0);
    if (sum >= 90 && sum <= 110) {
      confidence += 0.4;
    } else if (percentages.length >= 3) {
      confidence += 0.2;
    }
  }

  if (confidence < 0.4) {
    return null;
  }

  const dataPoints = extractDataPoints(text, 'pie');

  return {
    sourceText: text,
    type: 'donut', // Donut charts are generally more modern
    confidence: Math.min(confidence, 0.95),
    extractedData: dataPoints,
    suggestedConfig: {
      type: 'donut',
      data: dataPointsToChartData(dataPoints),
      options: {
        title: extractPotentialTitle(text),
        showLegend: true,
        legendPosition: 'right',
      },
    } as Partial<ChartConfig>,
    position: { start: 0, end: 0 },
  };
}

// ============================================================================
// PROCESS DETECTION (Flowcharts)
// ============================================================================

/**
 * Detect text describing processes, workflows, or decision flows
 * Best visualized as flowcharts (especially PRISMA diagrams for research)
 */
export function detectProcess(text: string): VisualizationOpportunity | null {
  const processKeywords = [
    'first',
    'second',
    'third',
    'then',
    'next',
    'finally',
    'subsequently',
    'step',
    'phase',
    'stage',
    'procedure',
    'protocol',
  ];

  const decisionKeywords = [
    'if',
    'when',
    'otherwise',
    'alternatively',
    'in case',
    'depending on',
    'based on',
  ];

  const prismaKeywords = [
    'identified',
    'screened',
    'excluded',
    'included',
    'eligible',
    'assessment',
    'records',
    'duplicates removed',
    'full-text',
  ];

  let confidence = 0;
  const lowerText = text.toLowerCase();

  // Check for process language
  let processMatches = 0;
  for (const keyword of processKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(lowerText)) {
      processMatches++;
    }
  }
  if (processMatches >= 2) {
    confidence += 0.3;
  }

  // Check for decision language
  for (const keyword of decisionKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(lowerText)) {
      confidence += 0.15;
      break;
    }
  }

  // Check for PRISMA-style language (very high confidence)
  let prismaMatches = 0;
  for (const keyword of prismaKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerText)) {
      prismaMatches++;
    }
  }
  if (prismaMatches >= 3) {
    confidence += 0.5;
  } else if (prismaMatches >= 1) {
    confidence += 0.2;
  }

  // Check for numbered steps
  const numberedSteps = text.match(/\b\d+\.\s+[A-Z]/g);
  if (numberedSteps && numberedSteps.length >= 2) {
    confidence += 0.25;
  }

  if (confidence < 0.4) {
    return null;
  }

  // Extract steps and create basic flowchart structure
  const steps = extractProcessSteps(text);

  return {
    sourceText: text,
    type: 'flowchart',
    confidence: Math.min(confidence, 0.95),
    extractedData: [],
    suggestedConfig: {
      nodes: steps.map((step, idx) => ({
        id: `node-${idx}`,
        type: step.isDecision ? 'decision' : 'process',
        label: step.text,
        position: { x: 0, y: idx * 100 },
      })),
      edges: steps.slice(0, -1).map((_, idx) => ({
        id: `edge-${idx}`,
        source: `node-${idx}`,
        target: `node-${idx + 1}`,
      })),
      layout: 'TB',
    } as Partial<FlowchartConfig>,
    position: { start: 0, end: 0 },
  };
}

// ============================================================================
// TABLE DETECTION
// ============================================================================

/**
 * Detect text containing tabular data or comparison matrices
 * Best visualized as comparison tables
 */
export function detectTabularData(text: string): VisualizationOpportunity | null {
  const tableKeywords = [
    'characteristics',
    'demographics',
    'baseline',
    'comparison of',
    'summary of',
    'outcomes',
    'results by',
    'stratified by',
  ];

  let confidence = 0;
  const lowerText = text.toLowerCase();

  // Check for table-indicative language
  for (const keyword of tableKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerText)) {
      confidence += 0.2;
      break;
    }
  }

  // Check for multiple attributes with values
  const attributePattern = /([A-Za-z\s]+):\s*(\d+\.?\d*)/g;
  const attributeMatches = text.match(attributePattern);
  if (attributeMatches && attributeMatches.length >= 3) {
    confidence += 0.3;
  }

  // Check for comparison across groups
  const groupComparison = /(group|cohort|arm)\s+[A-Z]/gi;
  const groupMatches = text.match(groupComparison);
  if (groupMatches && groupMatches.length >= 2) {
    confidence += 0.25;
  }

  // Check for mean ± SD pattern (very common in academic tables)
  const meanSdPattern = /\d+\.?\d*\s*±\s*\d+\.?\d*/g;
  const meanSdMatches = text.match(meanSdPattern);
  if (meanSdMatches && meanSdMatches.length >= 2) {
    confidence += 0.35;
  }

  if (confidence < 0.4) {
    return null;
  }

  const tableData = extractTableData(text);

  return {
    sourceText: text,
    type: 'table',
    confidence: Math.min(confidence, 0.95),
    extractedData: [],
    suggestedConfig: tableData,
    position: { start: 0, end: 0 },
  };
}

// ============================================================================
// CHART TYPE SUGGESTION
// ============================================================================

/**
 * Suggest the best chart type based on extracted data patterns
 */
export function suggestChartType(patterns: DataPattern[]): ChartType | null {
  if (patterns.length === 0) {
    return null;
  }

  const patternTypes = patterns.map((p) => p.type);
  const hasComparison = patternTypes.includes('comparison');
  const hasTrend = patternTypes.includes('trend');
  const hasPercentage = patternTypes.includes('percentage');

  // Count percentages to determine if it's a distribution
  const percentageCount = patterns.filter((p) => p.type === 'percentage').length;

  if (hasTrend) {
    return 'line';
  }

  if (percentageCount >= 3 && hasPercentageSum(patterns, 90, 110)) {
    return 'pie';
  }

  if (hasComparison || percentageCount >= 2) {
    return 'bar';
  }

  // Default to bar chart for numerical data
  if (patterns.some((p) => p.type === 'sampleSize' || p.type === 'effectSize')) {
    return 'bar';
  }

  return null;
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

/**
 * Extract numerical data points from text for visualization
 */
export function extractDataPoints(text: string, type: ChartType): DataPoint[] {
  const dataPoints: DataPoint[] = [];

  if (type === 'bar' || type === 'horizontal-bar' || type === 'stacked-bar') {
    // Extract percentage-based comparisons
    const percentagePattern = /([^.!?:]+?)\s*[:–-]?\s*(\d+\.?\d*)\s*%/gi;
    let match;
    while ((match = percentagePattern.exec(text)) !== null) {
      const label = match[1].trim().slice(-50); // Last 50 chars as label
      const value = parseFloat(match[2]);
      if (!isNaN(value)) {
        dataPoints.push({
          label: cleanLabel(label),
          value,
          unit: '%',
        });
      }
    }

    // Extract numerical comparisons
    const numberPattern = /([A-Za-z\s]+?)[:–-]?\s*(\d+\.?\d*)\s*([a-zA-Z%]*)/g;
    while ((match = numberPattern.exec(text)) !== null && dataPoints.length < 5) {
      const label = match[1].trim();
      const value = parseFloat(match[2]);
      const unit = match[3];
      if (!isNaN(value) && label.length > 2 && label.length < 50) {
        dataPoints.push({
          label: cleanLabel(label),
          value,
          unit: unit || undefined,
        });
      }
    }
  } else if (type === 'line' || type === 'multi-line') {
    // Extract time-series data
    const yearPattern = /(\d{4})[:\s–-]+(\d+\.?\d*)/g;
    let match;
    while ((match = yearPattern.exec(text)) !== null) {
      dataPoints.push({
        label: match[1],
        value: parseFloat(match[2]),
      });
    }

    // Extract week/month data
    const timeSeriesPattern = /(week|month|day)\s*(\d+)[:\s–-]+(\d+\.?\d*)/gi;
    while ((match = timeSeriesPattern.exec(text)) !== null) {
      dataPoints.push({
        label: `${match[1]} ${match[2]}`,
        value: parseFloat(match[3]),
      });
    }
  } else if (type === 'pie' || type === 'donut') {
    // Extract distribution data (must sum to ~100%)
    const distributionPattern = /(\d+\.?\d*)\s*%\s+([^,.;]+)/gi;
    let match;
    while ((match = distributionPattern.exec(text)) !== null) {
      dataPoints.push({
        label: cleanLabel(match[2]),
        value: parseFloat(match[1]),
        unit: '%',
      });
    }
  }

  return dataPoints.slice(0, 10); // Limit to 10 data points
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract percentages from text
 */
function extractPercentages(text: string): number[] {
  const percentages: number[] = [];
  const pattern = /(\d+\.?\d*)\s*%/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      percentages.push(value);
    }
  }

  return percentages;
}

/**
 * Check if percentages sum to a target range
 */
function hasPercentageSum(patterns: DataPattern[], min: number, max: number): boolean {
  const percentages = patterns
    .filter((p) => p.type === 'percentage')
    .map((p) => {
      const match = p.value.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    });

  const sum = percentages.reduce((a, b) => a + b, 0);
  return sum >= min && sum <= max;
}

/**
 * Extract process steps from text
 */
function extractProcessSteps(text: string): Array<{ text: string; isDecision: boolean }> {
  const steps: Array<{ text: string; isDecision: boolean }> = [];

  // Try numbered steps first
  const numberedPattern = /\d+\.\s+([^.!?]+[.!?])/g;
  let match;

  while ((match = numberedPattern.exec(text)) !== null) {
    const stepText = match[1].trim();
    const isDecision = /\bif\b|\bwhen\b|\botherwise\b/i.test(stepText);
    steps.push({
      text: stepText.length > 100 ? stepText.slice(0, 100) + '...' : stepText,
      isDecision,
    });
  }

  // If no numbered steps, try sequential keywords
  if (steps.length === 0) {
    const sentences = text.match(/[^.!?]+[.!?]/g) || [];
    const sequentialKeywords = /\b(first|second|third|then|next|finally|subsequently)\b/i;

    for (const sentence of sentences) {
      if (sequentialKeywords.test(sentence)) {
        const isDecision = /\bif\b|\bwhen\b|\botherwise\b/i.test(sentence);
        steps.push({
          text: sentence.trim().slice(0, 100),
          isDecision,
        });
      }
    }
  }

  return steps.slice(0, 8); // Limit to 8 steps
}

/**
 * Extract table data from text
 */
function extractTableData(text: string): Partial<TableConfig> {
  const rows: Array<{ cells: Array<{ content: string }> }> = [];

  // Try to extract attribute-value pairs
  const attributePattern = /([A-Za-z\s]+?):\s*([^\n,;]+)/g;
  let match;

  const attributes: Array<{ name: string; value: string }> = [];
  while ((match = attributePattern.exec(text)) !== null) {
    attributes.push({
      name: match[1].trim(),
      value: match[2].trim(),
    });
  }

  if (attributes.length >= 2) {
    // Create header row
    rows.push({
      cells: [
        { content: 'Characteristic' },
        { content: 'Value' },
      ],
    });

    // Create data rows
    for (const attr of attributes.slice(0, 8)) {
      rows.push({
        cells: [
          { content: attr.name },
          { content: attr.value },
        ],
      });
    }
  }

  return {
    rows: rows as any,
    striped: true,
    bordered: true,
  };
}

/**
 * Extract a potential title from text (first sentence or phrase)
 */
function extractPotentialTitle(text: string): string {
  const firstSentence = text.match(/^[^.!?]+/);
  if (firstSentence) {
    const title = firstSentence[0].trim();
    return title.length > 60 ? title.slice(0, 60) + '...' : title;
  }
  return '';
}

/**
 * Clean and format a label for charts
 */
function cleanLabel(label: string): string {
  return label
    .trim()
    .replace(/^[:\s–-]+/, '') // Remove leading punctuation
    .replace(/[:\s–-]+$/, '') // Remove trailing punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 40); // Limit length
}

/**
 * Convert data points to Chart.js format
 */
function dataPointsToChartData(dataPoints: DataPoint[]): ChartData {
  return {
    labels: dataPoints.map((dp) => dp.label),
    datasets: [
      {
        label: 'Data',
        data: dataPoints.map((dp) => dp.value),
        backgroundColor: [
          '#8b5cf6', // Purple
          '#06b6d4', // Cyan
          '#f59e0b', // Amber
          '#10b981', // Emerald
          '#ef4444', // Red
          '#6366f1', // Indigo
          '#ec4899', // Pink
        ],
      },
    ],
  };
}
