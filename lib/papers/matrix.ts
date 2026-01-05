// Research Matrix
// Structured data extraction and comparison across papers

import type { Paper, PaperContent, PaperSection } from '@/lib/firebase/schema';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { ChatModel } from './chat';

/**
 * Matrix column definition
 */
export interface MatrixColumn {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'list' | 'categorical';
  extractionPrompt?: string;
  options?: string[]; // For categorical columns
}

/**
 * Matrix template
 */
export interface MatrixTemplate {
  id: string;
  name: string;
  description: string;
  columns: MatrixColumn[];
  category?: string;
}

/**
 * Matrix cell value
 */
export type MatrixCellValue = string | number | boolean | string[] | null;

/**
 * Matrix row (one paper)
 */
export interface MatrixRow {
  paperId: string;
  paperTitle: string;
  authors: string;
  year?: number;
  values: Record<string, MatrixCellValue>;
  extractedAt: Date;
  confidence?: Record<string, number>; // Confidence scores per column
}

/**
 * Complete research matrix
 */
export interface ResearchMatrix {
  id: string;
  userId: string;
  name: string;
  description?: string;
  paperIds: string[];
  template: MatrixTemplate;
  rows: MatrixRow[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Predefined matrix templates
 */
export const MATRIX_TEMPLATES: MatrixTemplate[] = [
  {
    id: 'clinical-trial',
    name: 'Clinical Trial Matrix',
    description: 'Extract key data from clinical trials',
    category: 'clinical',
    columns: [
      {
        id: 'intervention',
        name: 'Intervention',
        description: 'Treatment or intervention being studied',
        type: 'text',
        extractionPrompt: 'What is the main intervention or treatment being studied?',
      },
      {
        id: 'population',
        name: 'Population',
        description: 'Study population and inclusion criteria',
        type: 'text',
        extractionPrompt: 'Describe the study population and key inclusion criteria.',
      },
      {
        id: 'sample_size',
        name: 'Sample Size',
        description: 'Number of participants',
        type: 'number',
        extractionPrompt: 'What is the total sample size (number of participants)?',
      },
      {
        id: 'design',
        name: 'Study Design',
        description: 'Type of study design',
        type: 'categorical',
        options: ['RCT', 'Non-randomized trial', 'Open-label', 'Double-blind', 'Single-blind'],
        extractionPrompt: 'What is the study design?',
      },
      {
        id: 'primary_outcome',
        name: 'Primary Outcome',
        description: 'Primary outcome measure',
        type: 'text',
        extractionPrompt: 'What is the primary outcome measure?',
      },
      {
        id: 'results',
        name: 'Main Results',
        description: 'Key findings for primary outcome',
        type: 'text',
        extractionPrompt: 'What are the main results for the primary outcome?',
      },
      {
        id: 'adverse_events',
        name: 'Adverse Events',
        description: 'Reported adverse events',
        type: 'text',
        extractionPrompt: 'What adverse events were reported?',
      },
    ],
  },
  {
    id: 'systematic-review',
    name: 'Systematic Review Matrix',
    description: 'Extract data from systematic reviews and meta-analyses',
    category: 'review',
    columns: [
      {
        id: 'research_question',
        name: 'Research Question',
        description: 'Main research question or objective',
        type: 'text',
        extractionPrompt: 'What is the main research question?',
      },
      {
        id: 'databases',
        name: 'Databases Searched',
        description: 'Bibliographic databases searched',
        type: 'list',
        extractionPrompt: 'Which databases were searched?',
      },
      {
        id: 'studies_included',
        name: 'Studies Included',
        description: 'Number of studies included',
        type: 'number',
        extractionPrompt: 'How many studies were included in the review?',
      },
      {
        id: 'quality_assessment',
        name: 'Quality Assessment',
        description: 'Method used for quality assessment',
        type: 'text',
        extractionPrompt: 'What method was used to assess study quality?',
      },
      {
        id: 'main_findings',
        name: 'Main Findings',
        description: 'Summary of main findings',
        type: 'text',
        extractionPrompt: 'What are the main findings or conclusions?',
      },
      {
        id: 'heterogeneity',
        name: 'Heterogeneity',
        description: 'Statistical heterogeneity (I²)',
        type: 'text',
        extractionPrompt: 'What is the reported heterogeneity (I² statistic)?',
      },
    ],
  },
  {
    id: 'diagnostic-accuracy',
    name: 'Diagnostic Accuracy Matrix',
    description: 'Extract diagnostic test accuracy data',
    category: 'diagnostic',
    columns: [
      {
        id: 'test',
        name: 'Diagnostic Test',
        description: 'Test being evaluated',
        type: 'text',
        extractionPrompt: 'What diagnostic test is being evaluated?',
      },
      {
        id: 'reference_standard',
        name: 'Reference Standard',
        description: 'Gold standard comparator',
        type: 'text',
        extractionPrompt: 'What is the reference standard (gold standard)?',
      },
      {
        id: 'sensitivity',
        name: 'Sensitivity',
        description: 'Test sensitivity (%)',
        type: 'text',
        extractionPrompt: 'What is the reported sensitivity?',
      },
      {
        id: 'specificity',
        name: 'Specificity',
        description: 'Test specificity (%)',
        type: 'text',
        extractionPrompt: 'What is the reported specificity?',
      },
      {
        id: 'ppv',
        name: 'PPV',
        description: 'Positive predictive value',
        type: 'text',
        extractionPrompt: 'What is the positive predictive value?',
      },
      {
        id: 'npv',
        name: 'NPV',
        description: 'Negative predictive value',
        type: 'text',
        extractionPrompt: 'What is the negative predictive value?',
      },
    ],
  },
  {
    id: 'observational-study',
    name: 'Observational Study Matrix',
    description: 'Extract data from cohort and case-control studies',
    category: 'observational',
    columns: [
      {
        id: 'study_type',
        name: 'Study Type',
        description: 'Cohort, case-control, or cross-sectional',
        type: 'categorical',
        options: ['Cohort', 'Case-control', 'Cross-sectional'],
        extractionPrompt: 'What type of observational study is this?',
      },
      {
        id: 'exposure',
        name: 'Exposure',
        description: 'Main exposure or risk factor',
        type: 'text',
        extractionPrompt: 'What is the main exposure or risk factor studied?',
      },
      {
        id: 'outcome',
        name: 'Outcome',
        description: 'Primary outcome',
        type: 'text',
        extractionPrompt: 'What is the primary outcome?',
      },
      {
        id: 'effect_measure',
        name: 'Effect Measure',
        description: 'Hazard ratio, odds ratio, etc.',
        type: 'text',
        extractionPrompt: 'What is the main effect measure (HR, OR, RR) and its value?',
      },
      {
        id: 'confounders',
        name: 'Confounders Adjusted',
        description: 'Confounding variables adjusted for',
        type: 'list',
        extractionPrompt: 'What confounding variables were adjusted for?',
      },
      {
        id: 'follow_up',
        name: 'Follow-up Duration',
        description: 'Length of follow-up',
        type: 'text',
        extractionPrompt: 'What was the follow-up duration?',
      },
    ],
  },
];

/**
 * Create a new research matrix
 */
export function createMatrix(
  userId: string,
  name: string,
  paperIds: string[],
  template: MatrixTemplate,
  description?: string
): ResearchMatrix {
  const now = new Date();

  return {
    id: `matrix-${Date.now()}`,
    userId,
    name,
    description,
    paperIds,
    template,
    rows: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Extract data for a single column using AI
 */
export async function extractColumnData(
  paper: Paper,
  content: PaperContent,
  column: MatrixColumn,
  model: ChatModel = 'gpt-4o-mini'
): Promise<{ value: MatrixCellValue; confidence: number }> {
  // Build context from relevant sections
  const relevantSections = getRelevantSections(content, column);
  const context = relevantSections.map((s) => `${s.title}:\n${s.content}`).join('\n\n');

  // Build extraction prompt
  const extractionPrompt = column.extractionPrompt || `Extract the ${column.name} from this paper.`;

  const systemPrompt = `You are a research assistant extracting structured data from academic papers.

Paper: "${paper.title}"
Authors: ${paper.authors.map((a) => a.name).join(', ')}
Year: ${paper.year || 'Unknown'}

Relevant sections from the paper:
${context}

Task: ${extractionPrompt}

Instructions:
- Extract the requested information accurately
- If the information is not found, respond with "Not reported" or "N/A"
- For numerical values, extract only the number
- For categorical values, choose from the provided options if applicable
- For lists, separate items with semicolons
- Be precise and concise`;

  try {
    const modelInstance = getAIModel(model);

    const result = await generateText({
      model: modelInstance,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Extract: ${column.name}`,
        },
      ],
      temperature: 0.1, // Low temperature for factual extraction
      maxTokens: 500,
    });

    const extractedText = result.text.trim();

    // Parse based on column type
    const value = parseColumnValue(extractedText, column);

    // Simple confidence heuristic
    const confidence = calculateConfidence(extractedText, column);

    return { value, confidence };
  } catch (error) {
    console.error('Column extraction failed:', error);
    return { value: null, confidence: 0 };
  }
}

/**
 * Extract data for all columns in a matrix row
 */
export async function extractMatrixRow(
  paper: Paper,
  content: PaperContent,
  template: MatrixTemplate,
  model: ChatModel = 'gpt-4o-mini'
): Promise<MatrixRow> {
  const values: Record<string, MatrixCellValue> = {};
  const confidence: Record<string, number> = {};

  // Extract each column
  for (const column of template.columns) {
    const { value, confidence: conf } = await extractColumnData(paper, content, column, model);
    values[column.id] = value;
    confidence[column.id] = conf;
  }

  return {
    paperId: paper.id,
    paperTitle: paper.title,
    authors: paper.authors.map((a) => a.name).join(', '),
    year: paper.year,
    values,
    confidence,
    extractedAt: new Date(),
  };
}

/**
 * Export matrix to CSV format
 */
export function exportMatrixToCSV(matrix: ResearchMatrix): string {
  // Build header row
  const headers = [
    'Paper ID',
    'Title',
    'Authors',
    'Year',
    ...matrix.template.columns.map((c) => c.name),
  ];

  // Build data rows
  const rows = matrix.rows.map((row) => [
    row.paperId,
    `"${row.paperTitle.replace(/"/g, '""')}"`, // Escape quotes
    `"${row.authors.replace(/"/g, '""')}"`,
    row.year?.toString() || '',
    ...matrix.template.columns.map((c) => {
      const value = row.values[c.id];
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return `"${value.join('; ').replace(/"/g, '""')}"`;
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return value.toString();
    }),
  ]);

  // Combine into CSV
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return csv;
}

/**
 * Export matrix to Excel-compatible format (TSV)
 */
export function exportMatrixToExcel(matrix: ResearchMatrix): string {
  // Build header row
  const headers = [
    'Paper ID',
    'Title',
    'Authors',
    'Year',
    ...matrix.template.columns.map((c) => c.name),
  ];

  // Build data rows
  const rows = matrix.rows.map((row) => [
    row.paperId,
    row.paperTitle,
    row.authors,
    row.year?.toString() || '',
    ...matrix.template.columns.map((c) => {
      const value = row.values[c.id];
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return value.join('; ');
      return value.toString();
    }),
  ]);

  // Combine into TSV (Tab-Separated Values)
  const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');

  return tsv;
}

/**
 * Export matrix to JSON format
 */
export function exportMatrixToJSON(matrix: ResearchMatrix): string {
  return JSON.stringify(matrix, null, 2);
}

/**
 * Export matrix to formatted Markdown table
 */
export function exportMatrixToMarkdown(matrix: ResearchMatrix): string {
  const headers = ['Title', 'Authors', 'Year', ...matrix.template.columns.map((c) => c.name)];

  const separator = headers.map(() => '---');

  const rows = matrix.rows.map((row) => [
    row.paperTitle,
    row.authors,
    row.year?.toString() || '',
    ...matrix.template.columns.map((c) => {
      const value = row.values[c.id];
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return value.join('; ');
      return value.toString();
    }),
  ]);

  const table = [
    `| ${headers.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');

  return `# ${matrix.name}\n\n${matrix.description || ''}\n\n${table}`;
}

// Helper functions

function getRelevantSections(content: PaperContent, column: MatrixColumn): PaperSection[] {
  // Return all major sections
  return content.sections.filter((s) =>
    ['abstract', 'methods', 'results', 'discussion'].includes(s.type)
  );
}

function parseColumnValue(text: string, column: MatrixColumn): MatrixCellValue {
  const normalized = text.trim();

  // Handle "not reported" cases
  if (
    /^(not reported|n\/?a|not available|not specified|unclear|unknown)$/i.test(normalized)
  ) {
    return null;
  }

  switch (column.type) {
    case 'number':
      // Extract first number from text
      const numMatch = normalized.match(/(\d+(?:\.\d+)?)/);
      return numMatch ? parseFloat(numMatch[1]) : null;

    case 'boolean':
      return /^(yes|true|positive)$/i.test(normalized);

    case 'list':
      // Split by semicolons, commas, or newlines
      return normalized
        .split(/[;,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

    case 'categorical':
      // Try to match with provided options
      if (column.options) {
        const match = column.options.find((opt) =>
          normalized.toLowerCase().includes(opt.toLowerCase())
        );
        return match || normalized;
      }
      return normalized;

    case 'text':
    default:
      return normalized;
  }
}

function calculateConfidence(extractedText: string, column: MatrixColumn): number {
  // Simple heuristic for confidence
  const normalized = extractedText.toLowerCase().trim();

  // Low confidence for "not reported"
  if (
    /^(not reported|n\/?a|not available|not specified|unclear|unknown)$/i.test(normalized)
  ) {
    return 0.3;
  }

  // High confidence for specific values
  if (column.type === 'number' && /^\d+(\.\d+)?$/.test(normalized)) {
    return 0.95;
  }

  // Medium-high confidence for categorical matches
  if (column.type === 'categorical' && column.options) {
    const hasMatch = column.options.some((opt) =>
      normalized.includes(opt.toLowerCase())
    );
    return hasMatch ? 0.9 : 0.6;
  }

  // Default confidence based on response length
  if (normalized.length > 10 && normalized.length < 500) {
    return 0.8;
  }

  return 0.7;
}

function getAIModel(modelId: ChatModel) {
  if (modelId.startsWith('gpt-')) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openai(modelId);
  } else if (modelId.startsWith('claude-')) {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic(modelId);
  }

  // Default to GPT-4o-mini
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openai('gpt-4o-mini');
}
