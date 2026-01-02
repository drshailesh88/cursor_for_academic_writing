'use client';

import { useState, useCallback } from 'react';
import { DISCIPLINE_PROMPTS, type DisciplineId, getAllDisciplines } from '@/lib/prompts/disciplines';

interface DisciplineSelectorProps {
  selected: DisciplineId;
  onSelect: (discipline: DisciplineId) => void;
  compact?: boolean;
}

/**
 * Discipline Selector Component
 *
 * Allows users to select their scientific discipline.
 * The selected discipline affects:
 * - AI writing style and conventions
 * - Database search priorities
 * - Citation format defaults
 * - Template suggestions
 */
export function DisciplineSelector({
  selected,
  onSelect,
  compact = false,
}: DisciplineSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const disciplines = getAllDisciplines();
  const currentDiscipline = DISCIPLINE_PROMPTS[selected];

  const handleSelect = useCallback(
    (id: DisciplineId) => {
      onSelect(id);
      setIsOpen(false);
    },
    [onSelect]
  );

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors"
          title={`Discipline: ${currentDiscipline.name}`}
        >
          <span className="text-base">{currentDiscipline.icon}</span>
          <span className="hidden sm:inline text-muted-foreground">
            {currentDiscipline.name}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-1 z-50 w-72 max-h-96 overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                  Select your discipline
                </div>
                {disciplines.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect(d.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                      d.id === selected
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-xl">{d.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {d.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {d.databases.join(', ')}
                      </div>
                    </div>
                    {d.id === selected && (
                      <svg
                        className="w-4 h-4 text-primary flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full grid view
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Your Discipline</h3>
      <p className="text-sm text-muted-foreground">
        Choose your scientific field to optimize AI assistance, database searches, and writing conventions.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {disciplines.map((d) => (
          <button
            key={d.id}
            onClick={() => handleSelect(d.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
              d.id === selected
                ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                : 'border-border hover:border-primary/50 hover:bg-muted'
            }`}
          >
            <span className="text-3xl">{d.icon}</span>
            <span className="text-sm font-medium text-center leading-tight">
              {d.name}
            </span>
            {d.id === selected && (
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: d.color }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Selected discipline info */}
      <div
        className="mt-4 p-4 rounded-lg border"
        style={{ borderColor: currentDiscipline.color + '40' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{currentDiscipline.icon}</span>
          <div>
            <h4 className="font-semibold">{currentDiscipline.name}</h4>
            <p className="text-xs text-muted-foreground">
              Default citation style: {currentDiscipline.defaultCitationStyle}
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Databases:</span>{' '}
          {currentDiscipline.databases.join(', ')}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          <span className="font-medium">Example journals:</span>{' '}
          {currentDiscipline.journalExamples.slice(0, 3).join(', ')}
        </div>
      </div>
    </div>
  );
}

/**
 * Discipline Badge - Small inline display of current discipline
 */
export function DisciplineBadge({
  discipline,
  onClick,
}: {
  discipline: DisciplineId;
  onClick?: () => void;
}) {
  const config = DISCIPLINE_PROMPTS[discipline];

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full border transition-colors hover:bg-muted"
      style={{
        borderColor: config.color + '60',
        backgroundColor: config.color + '10',
      }}
      title={`Current discipline: ${config.name}`}
    >
      <span>{config.icon}</span>
      <span className="font-medium">{config.name}</span>
    </button>
  );
}

/**
 * Hook to manage discipline state with localStorage persistence
 */
export function useDiscipline(initialDiscipline: DisciplineId = 'life-sciences') {
  const [discipline, setDiscipline] = useState<DisciplineId>(() => {
    if (typeof window === 'undefined') return initialDiscipline;

    const saved = localStorage.getItem('academic-discipline');
    if (saved && saved in DISCIPLINE_PROMPTS) {
      return saved as DisciplineId;
    }
    return initialDiscipline;
  });

  const updateDiscipline = useCallback((newDiscipline: DisciplineId) => {
    setDiscipline(newDiscipline);
    if (typeof window !== 'undefined') {
      localStorage.setItem('academic-discipline', newDiscipline);
    }
  }, []);

  return {
    discipline,
    setDiscipline: updateDiscipline,
    config: DISCIPLINE_PROMPTS[discipline],
  };
}

export default DisciplineSelector;
