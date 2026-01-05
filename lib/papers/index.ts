// Paper Processing Library
// Exports all paper-related functionality

// Core types and processor
export * from './types';
export * from './pdf-processor';

// Processing modules (re-export specific items to avoid conflicts)
export {
  processPaper,
  processPapers,
  extractText,
  identifySections,
  indexParagraphs,
  extractFigures,
  extractTables,
  parseReferences,
  extractAuthors,
  extractAbstract,
  extractKeywords,
  extractEquations,
  assessExtractionQuality,
} from './processing';

export {
  extractMetadata,
  enrichFromCrossRef,
  enrichFromPubMed,
  enrichMetadata,
  disambiguateAuthors,
  getCitationCount,
  type ExtractedMetadata,
  type EnrichedMetadata,
} from './metadata';

export {
  chatWithPaper,
  chatWithPapers,
  generateCitations,
  findRelevantParagraphs,
  streamChatWithPaper,
  extractCitationsFromText,
  summarizeConversation,
  type ChatModel,
  type ChatMessage,
  type ChatResponse,
  type ChatOptions,
} from './chat';

export {
  assessQuality,
  detectStudyDesign,
  extractSampleSize,
  assessBiasRisk,
  compareQuality,
  type StudyDesign,
  type QualityGrade,
  type BiasRisk,
  type QualityAssessment,
  type QualityComponents,
  type BiasType,
  type StudyPopulation,
} from './quality';

export {
  createMatrix,
  extractColumnData,
  extractMatrixRow,
  exportMatrixToCSV,
  exportMatrixToExcel,
  exportMatrixToJSON,
  exportMatrixToMarkdown,
  MATRIX_TEMPLATES,
  type MatrixColumn,
  type MatrixTemplate,
  type MatrixCellValue,
  type MatrixRow,
  type ResearchMatrix,
} from './matrix';
