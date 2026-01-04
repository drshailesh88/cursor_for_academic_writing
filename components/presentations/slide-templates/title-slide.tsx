'use client';

import { SlideContent, Theme } from '@/lib/presentations/types';

interface TitleSlideProps {
  content: SlideContent;
  theme: Theme;
  editable?: boolean;
  onContentChange?: (content: SlideContent) => void;
}

export function TitleSlide({
  content,
  theme,
  editable = false,
  onContentChange,
}: TitleSlideProps) {
  const handleChange = (field: keyof SlideContent, value: string) => {
    if (onContentChange) {
      onContentChange({ ...content, [field]: value });
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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: theme.fonts.heading,
    fontSize: '3.5rem',
    fontWeight: theme.styles.headingWeight,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: '1rem',
    lineHeight: 1.2,
    maxWidth: '90%',
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: theme.fonts.body,
    fontSize: '1.75rem',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: '3rem',
    maxWidth: '80%',
  };

  const accentLineStyle: React.CSSProperties = {
    width: '200px',
    height: '4px',
    backgroundColor: theme.colors.accent,
    margin: '2rem 0',
    borderRadius: `${theme.styles.borderRadius}px`,
  };

  const authorStyle: React.CSSProperties = {
    fontFamily: theme.fonts.body,
    fontSize: '1.5rem',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: '2rem',
  };

  const institutionStyle: React.CSSProperties = {
    fontFamily: theme.fonts.body,
    fontSize: '1.25rem',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: '0.5rem',
  };

  const dateStyle: React.CSSProperties = {
    fontFamily: theme.fonts.body,
    fontSize: '1rem',
    color: theme.colors.textMuted,
    position: 'absolute',
    bottom: `${theme.spacing.slidePadding}px`,
    right: `${theme.spacing.slidePadding}px`,
  };

  return (
    <div style={slideStyle}>
      <h1
        style={titleStyle}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => handleChange('title', e.currentTarget.textContent || '')}
      >
        {content.title || 'Presentation Title'}
      </h1>

      {content.subtitle && (
        <h2
          style={subtitleStyle}
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => handleChange('subtitle', e.currentTarget.textContent || '')}
        >
          {content.subtitle}
        </h2>
      )}

      <div style={accentLineStyle} />

      {content.author && (
        <div
          style={authorStyle}
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => handleChange('author', e.currentTarget.textContent || '')}
        >
          {content.author}
        </div>
      )}

      {content.institution && (
        <div
          style={institutionStyle}
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => handleChange('institution', e.currentTarget.textContent || '')}
        >
          {content.institution}
        </div>
      )}

      {content.date && (
        <div
          style={dateStyle}
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => handleChange('date', e.currentTarget.textContent || '')}
        >
          {content.date}
        </div>
      )}
    </div>
  );
}
