'use client';

import { SlideContent, Theme } from '@/lib/presentations/types';

interface DataSlideProps {
  content: SlideContent;
  theme: Theme;
  editable?: boolean;
  onContentChange?: (content: SlideContent) => void;
}

export function DataSlide({
  content,
  theme,
  editable = false,
  onContentChange,
}: DataSlideProps) {
  const handleTitleChange = (value: string) => {
    if (onContentChange) {
      onContentChange({ ...content, title: value });
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

  const chartContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${theme.spacing.elementGap}px`,
    backgroundColor: theme.colors.surface,
    borderRadius: `${theme.styles.borderRadius}px`,
    marginBottom: `${theme.spacing.elementGap}px`,
  };

  const placeholderStyle: React.CSSProperties = {
    color: theme.colors.textMuted,
    fontSize: '1.5rem',
    fontFamily: theme.fonts.body,
    textAlign: 'center',
  };

  const sourceStyle: React.CSSProperties = {
    fontFamily: theme.fonts.body,
    fontSize: '0.9rem',
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'right',
  };

  return (
    <div style={slideStyle}>
      <h2
        style={titleStyle}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => handleTitleChange(e.currentTarget.textContent || '')}
      >
        {content.title || 'Data Visualization'}
      </h2>

      <div style={chartContainerStyle}>
        {content.chart ? (
          <div style={placeholderStyle}>
            {/* Chart component will be rendered here */}
            Chart: {content.chart.type}
            <br />
            <small style={{ fontSize: '1rem', display: 'block', marginTop: '1rem' }}>
              {content.chart.options.title || 'Untitled Chart'}
            </small>
          </div>
        ) : (
          <div style={placeholderStyle}>
            No chart data available
          </div>
        )}
      </div>

      {content.chart?.source && (
        <div style={sourceStyle}>
          Source: {content.chart.source}
        </div>
      )}
    </div>
  );
}
