'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  MinusCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

type ConfidenceLevel = 'high' | 'moderate' | 'low' | 'very_low';

interface StudyBreakdown {
  studyType: string;
  supporting: number;
  neutral: number;
  contradicting: number;
  total: number;
}

interface ConsensusMeterProps {
  question: string;
  distribution: {
    supporting: number;
    neutral: number;
    contradicting: number;
  };
  breakdown: StudyBreakdown[];
  confidence: ConfidenceLevel;
  confidenceReason?: string;
  totalStudies: number;
  onViewStudies?: (type: 'supporting' | 'neutral' | 'contradicting') => void;
  className?: string;
}

const confidenceConfig: Record<ConfidenceLevel, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle2;
  description: string;
}> = {
  high: {
    label: 'High Confidence',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950',
    icon: CheckCircle2,
    description: 'Strong, consistent evidence from high-quality studies',
  },
  moderate: {
    label: 'Moderate Confidence',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    icon: TrendingUp,
    description: 'Some evidence, but with limitations or inconsistencies',
  },
  low: {
    label: 'Low Confidence',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-950',
    icon: AlertCircle,
    description: 'Limited or conflicting evidence',
  },
  very_low: {
    label: 'Very Low Confidence',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950',
    icon: XCircle,
    description: 'Insufficient or highly inconsistent evidence',
  },
};

export function ConsensusMeter({
  question,
  distribution,
  breakdown,
  confidence,
  confidenceReason,
  totalStudies,
  onViewStudies,
  className,
}: ConsensusMeterProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const total = distribution.supporting + distribution.neutral + distribution.contradicting;
  const supportingPct = total > 0 ? (distribution.supporting / total) * 100 : 0;
  const neutralPct = total > 0 ? (distribution.neutral / total) * 100 : 0;
  const contradictingPct = total > 0 ? (distribution.contradicting / total) * 100 : 0;

  const confidenceDetails = confidenceConfig[confidence];
  const ConfidenceIcon = confidenceDetails.icon;

  return (
    <div className={cn('space-y-6 p-6 bg-card rounded-lg border border-border', className)}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Research Consensus</h3>
        <p className="text-sm text-muted-foreground">
          {question}
        </p>
      </div>

      {/* Consensus Meter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-medium mb-2">
          <span className="text-muted-foreground">Evidence Distribution</span>
          <span className="text-muted-foreground">Based on {totalStudies} studies</span>
        </div>

        {/* Visual Bar */}
        <div className="h-12 bg-muted rounded-lg overflow-hidden flex">
          {/* Supporting */}
          {supportingPct > 0 && (
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-semibold transition-all hover:opacity-90 cursor-pointer"
              style={{ width: `${supportingPct}%` }}
              onClick={() => onViewStudies?.('supporting')}
              title={`${Math.round(supportingPct)}% Supporting`}
            >
              {supportingPct > 15 && `${Math.round(supportingPct)}%`}
            </div>
          )}

          {/* Neutral */}
          {neutralPct > 0 && (
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold transition-all hover:opacity-90 cursor-pointer"
              style={{ width: `${neutralPct}%` }}
              onClick={() => onViewStudies?.('neutral')}
              title={`${Math.round(neutralPct)}% Neutral`}
            >
              {neutralPct > 15 && `${Math.round(neutralPct)}%`}
            </div>
          )}

          {/* Contradicting */}
          {contradictingPct > 0 && (
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-semibold transition-all hover:opacity-90 cursor-pointer"
              style={{ width: `${contradictingPct}%` }}
              onClick={() => onViewStudies?.('contradicting')}
              title={`${Math.round(contradictingPct)}% Contradicting`}
            >
              {contradictingPct > 15 && `${Math.round(contradictingPct)}%`}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-muted-foreground">Supporting</span>
            <span className="font-semibold">{Math.round(supportingPct)}%</span>
            <span className="text-xs text-muted-foreground">
              ({distribution.supporting})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MinusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-muted-foreground">Neutral</span>
            <span className="font-semibold">{Math.round(neutralPct)}%</span>
            <span className="text-xs text-muted-foreground">
              ({distribution.neutral})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-muted-foreground">Contradicting</span>
            <span className="font-semibold">{Math.round(contradictingPct)}%</span>
            <span className="text-xs text-muted-foreground">
              ({distribution.contradicting})
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Badge */}
      <div className={cn('p-4 rounded-lg', confidenceDetails.bgColor)}>
        <div className="flex items-start gap-3">
          <ConfidenceIcon className={cn('w-5 h-5 mt-0.5', confidenceDetails.color)} />
          <div className="flex-1">
            <div className={cn('font-semibold mb-1', confidenceDetails.color)}>
              {confidenceDetails.label}
            </div>
            <p className="text-sm text-muted-foreground">
              {confidenceReason || confidenceDetails.description}
            </p>
          </div>
        </div>
      </div>

      {/* Study Breakdown */}
      <div className="space-y-2">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Evidence Breakdown</span>
          </div>
          {showBreakdown ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showBreakdown && (
          <div className="space-y-2 pl-2">
            {breakdown.map((item, index) => {
              const itemTotal = item.supporting + item.neutral + item.contradicting;
              const supportingPct = itemTotal > 0 ? (item.supporting / itemTotal) * 100 : 0;
              const neutralPct = itemTotal > 0 ? (item.neutral / itemTotal) * 100 : 0;
              const contradictingPct = itemTotal > 0 ? (item.contradicting / itemTotal) * 100 : 0;

              return (
                <div
                  key={index}
                  className="p-3 bg-muted/30 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.studyType}</span>
                    <span className="text-xs text-muted-foreground">
                      {itemTotal} {itemTotal === 1 ? 'study' : 'studies'}
                    </span>
                  </div>

                  {/* Mini bar */}
                  <div className="h-2 bg-background rounded-full overflow-hidden flex">
                    {supportingPct > 0 && (
                      <div
                        className="bg-green-500"
                        style={{ width: `${supportingPct}%` }}
                        title={`${item.supporting} supporting`}
                      />
                    )}
                    {neutralPct > 0 && (
                      <div
                        className="bg-blue-500"
                        style={{ width: `${neutralPct}%` }}
                        title={`${item.neutral} neutral`}
                      />
                    )}
                    {contradictingPct > 0 && (
                      <div
                        className="bg-red-500"
                        style={{ width: `${contradictingPct}%` }}
                        title={`${item.contradicting} contradicting`}
                      />
                    )}
                  </div>

                  {/* Counts */}
                  <div className="flex items-center gap-4 text-xs">
                    {item.supporting > 0 && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{item.supporting}</span>
                      </div>
                    )}
                    {item.neutral > 0 && (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <MinusCircle className="w-3 h-3" />
                        <span>{item.neutral}</span>
                      </div>
                    )}
                    {item.contradicting > 0 && (
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <XCircle className="w-3 h-3" />
                        <span>{item.contradicting}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewStudies?.('supporting')}
          className="flex-1"
        >
          View Supporting Studies
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewStudies?.('contradicting')}
          className="flex-1"
        >
          View Contradicting Studies
        </Button>
      </div>
    </div>
  );
}
