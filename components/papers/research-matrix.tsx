// Research Matrix Component
// Table view for comparing multiple papers with AI extraction

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Download,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  Edit2,
  Check,
  Loader2,
  Table as TableIcon,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatrixColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'percentage' | 'boolean' | 'rating' | 'calculated';
  extractionPrompt?: string;
  formula?: string;
  width: number;
}

interface MatrixCell {
  value: string | number | boolean;
  source?: {
    paragraphId: string;
    quote: string;
  };
  confidence: number;
  manualOverride: boolean;
}

interface MatrixRow {
  paperId: string;
  values: Record<string, MatrixCell>;
}

interface Paper {
  id: string;
  title: string;
  authors: string;
  year?: number;
}

interface ResearchMatrixProps {
  papers: Paper[];
  userId: string;
  onClose?: () => void;
}

type TemplateId = 'clinical_trial' | 'systematic_review' | 'diagnostic' | 'ml_study' | 'custom';

const TEMPLATES: Record<TemplateId, { name: string; columns: Omit<MatrixColumn, 'id'>[] }> = {
  clinical_trial: {
    name: 'Clinical Trial',
    columns: [
      { name: 'Design', type: 'text', extractionPrompt: 'What is the study design?', width: 120 },
      { name: 'Sample Size', type: 'number', extractionPrompt: 'What is the total sample size (N)?', width: 100 },
      { name: 'Intervention', type: 'text', extractionPrompt: 'What intervention was tested?', width: 150 },
      { name: 'Control', type: 'text', extractionPrompt: 'What was the control condition?', width: 150 },
      { name: 'Primary Outcome', type: 'text', extractionPrompt: 'What was the primary outcome?', width: 180 },
      { name: 'Follow-up (months)', type: 'number', extractionPrompt: 'What was the follow-up duration in months?', width: 120 },
    ],
  },
  systematic_review: {
    name: 'Systematic Review',
    columns: [
      { name: 'Databases', type: 'text', extractionPrompt: 'Which databases were searched?', width: 150 },
      { name: 'Date Range', type: 'text', extractionPrompt: 'What date range was searched?', width: 120 },
      { name: 'Studies Included', type: 'number', extractionPrompt: 'How many studies were included?', width: 120 },
      { name: 'Meta-analysis', type: 'boolean', extractionPrompt: 'Was a meta-analysis performed?', width: 100 },
      { name: 'Quality Assessment', type: 'text', extractionPrompt: 'What quality assessment tool was used?', width: 150 },
    ],
  },
  diagnostic: {
    name: 'Diagnostic Accuracy',
    columns: [
      { name: 'Sample Size', type: 'number', extractionPrompt: 'What is the sample size?', width: 100 },
      { name: 'Sensitivity (%)', type: 'percentage', extractionPrompt: 'What is the sensitivity?', width: 110 },
      { name: 'Specificity (%)', type: 'percentage', extractionPrompt: 'What is the specificity?', width: 110 },
      { name: 'AUC', type: 'number', extractionPrompt: 'What is the AUC/AUROC?', width: 90 },
      { name: 'Reference Standard', type: 'text', extractionPrompt: 'What was the reference standard?', width: 150 },
    ],
  },
  ml_study: {
    name: 'Machine Learning Study',
    columns: [
      { name: 'Architecture', type: 'text', extractionPrompt: 'What model architecture was used?', width: 150 },
      { name: 'Training Data', type: 'number', extractionPrompt: 'How many training samples?', width: 120 },
      { name: 'Validation Method', type: 'text', extractionPrompt: 'What validation method was used?', width: 140 },
      { name: 'Accuracy (%)', type: 'percentage', extractionPrompt: 'What is the reported accuracy?', width: 110 },
      { name: 'AUC', type: 'number', extractionPrompt: 'What is the AUC?', width: 90 },
    ],
  },
  custom: {
    name: 'Custom Matrix',
    columns: [],
  },
};

export function ResearchMatrix({ papers, userId, onClose }: ResearchMatrixProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('clinical_trial');
  const [columns, setColumns] = useState<MatrixColumn[]>([]);
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);

  // Initialize columns when template changes
  const initializeTemplate = (templateId: TemplateId) => {
    const template = TEMPLATES[templateId];
    const newColumns: MatrixColumn[] = template.columns.map((col, i) => ({
      ...col,
      id: `col_${i}_${Date.now()}`,
    }));

    setColumns(newColumns);
    setRows(
      papers.map((paper) => ({
        paperId: paper.id,
        values: {},
      }))
    );
    setSelectedTemplate(templateId);
    setShowTemplateSelector(false);
  };

  // Add new column
  const addColumn = () => {
    if (!newColumnName.trim()) return;

    const newColumn: MatrixColumn = {
      id: `col_${Date.now()}`,
      name: newColumnName,
      type: 'text',
      width: 150,
    };

    setColumns([...columns, newColumn]);
    setNewColumnName('');
  };

  // Remove column
  const removeColumn = (columnId: string) => {
    setColumns(columns.filter((col) => col.id !== columnId));
    setRows(
      rows.map((row) => {
        const newValues = { ...row.values };
        delete newValues[columnId];
        return { ...row, values: newValues };
      })
    );
  };

  // Extract data from all papers
  const extractData = async () => {
    setIsExtracting(true);

    try {
      const response = await fetch('/api/papers/extract-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          paperIds: papers.map((p) => p.id),
          columns: columns.map((col) => ({
            id: col.id,
            name: col.name,
            extractionPrompt: col.extractionPrompt,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Extraction failed');
      }

      const data = await response.json();
      setRows(data.rows);
    } catch (error) {
      console.error('Matrix extraction error:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Paper', 'Authors', 'Year', ...columns.map((col) => col.name)];
    const csvRows = [headers.join(',')];

    rows.forEach((row) => {
      const paper = papers.find((p) => p.id === row.paperId);
      if (!paper) return;

      const values = [
        `"${paper.title}"`,
        `"${paper.authors}"`,
        paper.year || '',
        ...columns.map((col) => {
          const cell = row.values[col.id];
          if (!cell) return '';
          return typeof cell.value === 'string' ? `"${cell.value}"` : cell.value;
        }),
      ];

      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-matrix-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const summaries = useMemo(() => {
    return columns.map((col) => {
      if (col.type === 'number' || col.type === 'percentage') {
        const values = rows
          .map((row) => row.values[col.id]?.value)
          .filter((v): v is number => typeof v === 'number');

        if (values.length === 0) return null;

        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return { mean, min, max, count: values.length };
      }
      return null;
    });
  }, [columns, rows]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute inset-4 bg-background rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <TableIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Research Matrix</h2>
              <p className="text-sm text-muted-foreground">
                {papers.length} paper{papers.length !== 1 ? 's' : ''} " {columns.length} column{columns.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTemplate}
              onChange={(e) => initializeTemplate(e.target.value as TemplateId)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
            >
              <option value="clinical_trial">Clinical Trial</option>
              <option value="systematic_review">Systematic Review</option>
              <option value="diagnostic">Diagnostic Accuracy</option>
              <option value="ml_study">Machine Learning</option>
              <option value="custom">Custom Matrix</option>
            </select>

            <Button
              onClick={extractData}
              disabled={isExtracting || columns.length === 0}
              variant="default"
              size="sm"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Extract
                </>
              )}
            </Button>

            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Column Manager */}
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addColumn()}
              placeholder="Add column..."
              className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
            />
            <Button onClick={addColumn} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Add Column
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          {columns.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <TableIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">No columns defined</h3>
              <p className="text-sm text-muted-foreground">
                Select a template or add custom columns to start
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="sticky left-0 z-10 bg-muted px-4 py-3 text-left text-xs font-semibold min-w-[200px]">
                      Paper
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col.id}
                        className="px-4 py-3 text-left text-xs font-semibold"
                        style={{ minWidth: col.width }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{col.name}</span>
                          <button
                            onClick={() => removeColumn(col.id)}
                            className="opacity-0 hover:opacity-100 p-1 hover:bg-background rounded transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const paper = papers.find((p) => p.id === row.paperId);
                    if (!paper) return null;

                    return (
                      <tr key={row.paperId} className="border-b border-border hover:bg-muted/50">
                        <td className="sticky left-0 z-10 bg-background px-4 py-3">
                          <div>
                            <p className="text-sm font-medium line-clamp-2">{paper.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {paper.authors.split(',')[0]} et al.{paper.year && `, ${paper.year}`}
                            </p>
                          </div>
                        </td>
                        {columns.map((col) => {
                          const cell = row.values[col.id];
                          return (
                            <td key={col.id} className="px-4 py-3">
                              {cell ? (
                                <div className="text-sm">
                                  <span>{String(cell.value)}</span>
                                  {cell.source && (
                                    <div className="mt-1 text-xs text-muted-foreground italic">
                                      "{cell.source.quote.slice(0, 60)}..."
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground"></span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Summary Row */}
                  {rows.length > 1 && (
                    <tr className="bg-muted/50 border-t-2 border-border font-semibold">
                      <td className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-sm">
                        Summary
                      </td>
                      {columns.map((col, i) => (
                        <td key={col.id} className="px-4 py-3 text-sm">
                          {summaries[i] && (
                            <div className="text-xs">
                              <div>Mean: {summaries[i]!.mean.toFixed(2)}</div>
                              <div className="text-muted-foreground">
                                Range: {summaries[i]!.min} - {summaries[i]!.max}
                              </div>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          <span className="font-medium">Tips:</span>{' '}
          Click "AI Extract" to automatically fill cells " Export to CSV for further analysis " Add custom columns as needed
        </div>
      </motion.div>
    </div>
  );
}
