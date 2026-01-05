'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  FileDown,
  Code,
  Copy,
  Check,
  AlertTriangle,
  Award,
  Calendar,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    coverage: number;
    citationQuality: number;
    balancedPerspectives: number;
    sourceReliability: number;
    recency: number;
  };
}

interface ResearchResultsProps {
  synthesis: string;
  qualityScore: QualityScore;
  sourcesCount: number;
  dateRange?: { start: number; end: number };
  onInsertToDocument?: () => void;
  onExportPDF?: () => void;
  onExportBibTeX?: () => void;
  onExportRIS?: () => void;
  onCopySynthesis?: () => void;
  className?: string;
}

function getQualityBadge(score: number) {
  if (score >= 90) {
    return {
      label: 'Excellent',
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-950',
      icon: Award,
    };
  } else if (score >= 80) {
    return {
      label: 'Very Good',
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
      icon: Award,
    };
  } else if (score >= 70) {
    return {
      label: 'Good',
      color: 'text-cyan-700 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-950',
      icon: FileText,
    };
  } else if (score >= 60) {
    return {
      label: 'Fair',
      color: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
      icon: AlertTriangle,
    };
  } else {
    return {
      label: 'Needs Improvement',
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-950',
      icon: AlertTriangle,
    };
  }
}

export function ResearchResults({
  synthesis,
  qualityScore,
  sourcesCount,
  dateRange,
  onInsertToDocument,
  onExportPDF,
  onExportBibTeX,
  onExportRIS,
  onCopySynthesis,
  className,
}: ResearchResultsProps) {
  const [copied, setCopied] = useState(false);
  const [showQualityBreakdown, setShowQualityBreakdown] = useState(false);

  const qualityBadge = getQualityBadge(qualityScore.overall);
  const QualityIcon = qualityBadge.icon;

  const handleCopy = () => {
    onCopySynthesis?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qualityItems = [
    { label: 'Coverage', value: qualityScore.breakdown.coverage },
    { label: 'Citation Quality', value: qualityScore.breakdown.citationQuality },
    { label: 'Balanced Perspectives', value: qualityScore.breakdown.balancedPerspectives },
    { label: 'Source Reliability', value: qualityScore.breakdown.sourceReliability },
    { label: 'Recency', value: qualityScore.breakdown.recency },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Quality Badge */}
      <div className="flex items-start justify-between gap-4 p-6 bg-card rounded-lg border border-border">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Research Synthesis</h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>{sourcesCount} sources</span>
            </div>
            {dateRange && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  {dateRange.start} - {dateRange.end}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quality Score */}
        <div className={cn('px-4 py-3 rounded-lg', qualityBadge.bgColor)}>
          <div className="flex items-center gap-2 mb-1">
            <QualityIcon className={cn('w-5 h-5', qualityBadge.color)} />
            <span className={cn('font-semibold', qualityBadge.color)}>
              {qualityBadge.label}
            </span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{qualityScore.overall}</div>
            <div className="text-xs text-muted-foreground">Quality Score</div>
          </div>
        </div>
      </div>

      {/* Quality Breakdown */}
      <div className="p-6 bg-card rounded-lg border border-border">
        <button
          onClick={() => setShowQualityBreakdown(!showQualityBreakdown)}
          className="flex items-center justify-between w-full"
        >
          <span className="text-sm font-semibold">Quality Breakdown</span>
          {showQualityBreakdown ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showQualityBreakdown && (
          <div className="mt-4 space-y-3">
            {qualityItems.map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      item.value >= 80
                        ? 'bg-green-500'
                        : item.value >= 60
                        ? 'bg-blue-500'
                        : item.value >= 40
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                    )}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Synthesis Content */}
      <div className="p-6 bg-card rounded-lg border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Synthesized Report</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Synthesis text with academic styling */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {synthesis || 'No synthesis available yet. Start a research session to generate a synthesis.'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Primary Actions */}
        <Button
          onClick={onInsertToDocument}
          className="h-12 gap-2 font-medium"
          size="lg"
        >
          <FileText className="w-5 h-5" />
          Insert into Document
        </Button>

        <Button
          onClick={onExportPDF}
          variant="outline"
          className="h-12 gap-2 font-medium"
          size="lg"
        >
          <FileDown className="w-5 h-5" />
          Export PDF
        </Button>

        {/* Export Citations */}
        <Button
          onClick={onExportBibTeX}
          variant="outline"
          className="gap-2"
        >
          <Code className="w-4 h-4" />
          Export BibTeX
        </Button>

        <Button
          onClick={onExportRIS}
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export RIS
        </Button>
      </div>

      {/* Export Info */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 text-xs text-muted-foreground">
            <p className="mb-1">
              <strong>Insert to Document:</strong> Adds the synthesis to your current document with inline citations
            </p>
            <p className="mb-1">
              <strong>Export PDF:</strong> Generate a formatted PDF report with all sources
            </p>
            <p>
              <strong>Export Citations:</strong> Download citation data in BibTeX or RIS format for reference managers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
