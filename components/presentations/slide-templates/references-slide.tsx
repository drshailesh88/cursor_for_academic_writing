'use client';

import { SlideContent, Theme, CitationReference } from '@/lib/presentations/types';

interface ReferencesSlideProps {
  content: SlideContent;
  theme: Theme;
  editable?: boolean;
  onContentChange?: (content: SlideContent) => void;
}

export function ReferencesSlide({
  content,
  theme,
  editable = false,
  onContentChange,
}: ReferencesSlideProps) {
  const handleTitleChange = (value: string) => {
    if (onContentChange) {
      onContentChange({ ...content, title: value });
    }
  };

  const handleCitationChange = (index: number, value: string) => {
    if (onContentChange && content.citations) {
      const updated = [...content.citations];
      updated[index] = { ...updated[index], formatted: value };
      onContentChange({ ...content, citations: updated });
    }
  };

  const slideStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    padding: `${theme.spacing.slidePadding}px`,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    display: 'flex',
    flexDirection: 'column',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: theme.fonts.heading,
    fontSize: '2.5rem',
    fontWeight: theme.styles.headingWeight,
    color: theme.colors.primary,
    marginBottom: `${theme.spacing.elementGap}px`,
    borderBottom: `3px solid ${theme.colors.accent}`,
    paddingBottom: '0.5rem',
  };

  const citationsContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.spacing.elementGap}px`,
    paddingTop: `${theme.spacing.elementGap}px`,
    overflowY: 'auto',
  };

  const citationStyle: React.CSSProperties = {
    fontFamily: theme.fonts.body,
    fontSize: '1rem',
    color: theme.colors.text,
    lineHeight: 1.5,
    paddingLeft: '2rem',
    textIndent: '-2rem',
    marginBottom: '0.75rem',
  };

  const numberStyle: React.CSSProperties = {
    color: theme.colors.accent,
    fontWeight: 600,
    marginRight: '0.5rem',
  };

  return (
    <div style={slideStyle}>
      <h2
        style={titleStyle}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => handleTitleChange(e.currentTarget.textContent || '')}
      >
        {content.title || 'References'}
      </h2>

      <div style={citationsContainerStyle}>
        {content.citations && content.citations.length > 0 ? (
          content.citations.map((citation: CitationReference, index: number) => (
            <div key={citation.id} style={citationStyle}>
              <span style={numberStyle}>{index + 1}.</span>
              <span
                contentEditable={editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  handleCitationChange(index, e.currentTarget.textContent || '')
                }
              >
                {citation.formatted}
              </span>
            </div>
          ))
        ) : (
          <div style={{ color: theme.colors.textMuted, fontStyle: 'italic' }}>
            No references available
          </div>
        )}
      </div>
    </div>
  );
}
