// Quality Badge Component
// Displays paper quality assessment with grade and breakdown

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface QualityCriterion {
  name: string;
  score: number;
  maxScore: number;
  notes: string;
}

interface BiasRisk {
  type: string;
  level: 'low' | 'moderate' | 'high' | 'unclear';
  explanation: string;
}

interface QualityAssessment {
  overallGrade: 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  overallScore: number; // 0-100
  studyDesign: {
    type: string;
    evidenceLevel: 1 | 2 | 3 | 4 | 5 | 6;
    score: number;
  };
  criteria: QualityCriterion[];
  strengths: string[];
  limitations: string[];
  biasRisks: BiasRisk[];
}

interface QualityBadgeProps {
  assessment: QualityAssessment;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function QualityBadge({
  assessment,
  size = 'md',
  showTooltip = true,
  className = '',
}: QualityBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('A')) return 'bg-green-500 text-white';
    if (grade.startsWith('B')) return 'bg-blue-500 text-white';
    if (grade.startsWith('C')) return 'bg-yellow-500 text-white';
    if (grade.startsWith('D')) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getEvidenceLevelText = (level: number): string => {
    const levels = {
      1: 'Level I: Systematic Review/Meta-analysis',
      2: 'Level II: Randomized Controlled Trial',
      3: 'Level III: Controlled Study (non-randomized)',
      4: 'Level IV: Case-control/Cohort',
      5: 'Level V: Case Series/Report',
      6: 'Level VI: Expert Opinion',
    };
    return levels[level as keyof typeof levels] || 'Unknown';
  };

  const getBiasColor = (level: BiasRisk['level']): string => {
    switch (level) {
      case 'low':
        return 'text-green-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Badge */}
      <button
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => showTooltip && setShowDetails(false)}
        onClick={() => setShowDetails(!showDetails)}
        className={`
          ${sizeClasses[size]}
          ${getGradeColor(assessment.overallGrade)}
          rounded-lg font-bold flex items-center justify-center
          transition-all hover:scale-110 cursor-help
          shadow-sm
        `}
        title="Click for quality details"
      >
        {assessment.overallGrade}
      </button>

      {/* Tooltip Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
            onMouseEnter={() => setShowDetails(true)}
            onMouseLeave={() => setShowDetails(false)}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-muted border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Evidence Quality</h4>
                <div className={`
                  px-3 py-1 rounded-full font-bold text-sm
                  ${getGradeColor(assessment.overallGrade)}
                `}>
                  {assessment.overallGrade}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Score: {assessment.overallScore}/100</span>
                <span>"</span>
                <span>{assessment.studyDesign.type}</span>
              </div>
            </div>

            {/* Evidence Level */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">Evidence Level</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {getEvidenceLevelText(assessment.studyDesign.evidenceLevel)}
              </p>
            </div>

            {/* Quality Criteria */}
            <div className="px-4 py-3 border-b border-border">
              <h5 className="text-xs font-medium mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                Quality Criteria
              </h5>
              <div className="space-y-2">
                {assessment.criteria.slice(0, 4).map((criterion, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{criterion.name}</span>
                      <span className="font-medium">
                        {criterion.score}/{criterion.maxScore}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(criterion.score / criterion.maxScore) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            {assessment.strengths.length > 0 && (
              <div className="px-4 py-3 border-b border-border">
                <h5 className="text-xs font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Key Strengths
                </h5>
                <ul className="space-y-1">
                  {assessment.strengths.slice(0, 2).map((strength, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">"</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Limitations */}
            {assessment.limitations.length > 0 && (
              <div className="px-4 py-3 border-b border-border">
                <h5 className="text-xs font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Key Limitations
                </h5>
                <ul className="space-y-1">
                  {assessment.limitations.slice(0, 2).map((limitation, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">"</span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bias Risks */}
            {assessment.biasRisks.length > 0 && (
              <div className="px-4 py-3">
                <h5 className="text-xs font-medium mb-2">Risk of Bias</h5>
                <div className="space-y-1">
                  {assessment.biasRisks.slice(0, 3).map((risk, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{risk.type}</span>
                      <span className={`font-medium capitalize ${getBiasColor(risk.level)}`}>
                        {risk.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple grade-only version
export function QualityGrade({
  grade,
  size = 'sm',
}: {
  grade: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  const getGradeColor = (g: string): string => {
    if (g.startsWith('A')) return 'bg-green-500 text-white';
    if (g.startsWith('B')) return 'bg-blue-500 text-white';
    if (g.startsWith('C')) return 'bg-yellow-500 text-white';
    if (g.startsWith('D')) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${getGradeColor(grade)}
        rounded font-bold flex items-center justify-center
        shadow-sm
      `}
    >
      {grade}
    </div>
  );
}
