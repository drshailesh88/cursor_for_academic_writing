'use client';

import { SlideContent, Theme } from '@/lib/presentations/types';

interface SectionDividerSlideProps {
  content: SlideContent;
  theme: Theme;
  editable?: boolean;
  onContentChange?: (content: SlideContent) => void;
}

export function SectionDividerSlide({
  content,
  theme,
  editable = false,
  onContentChange,
}: SectionDividerSlideProps) {
  const handleTitleChange = (value: string) => {
    if (onContentChange) {
      onContentChange({ ...content, title: value });
    }
  };

  const slideStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    padding: `${theme.spacing.slidePadding}px`,
    backgroundColor: theme.colors.primary,
    color: theme.colors.background,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  };

  const sectionNumberStyle: React.CSSProperties = {
    fontFamily: theme.fonts.heading,
    fontSize: '6rem',
    fontWeight: theme.styles.headingWeight,
    color: `${theme.colors.background}33`, // 20% opacity
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 0,
    lineHeight: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: theme.fonts.heading,
    fontSize: '4rem',
    fontWeight: theme.styles.headingWeight,
    color: theme.colors.background,
    textAlign: 'center',
    zIndex: 1,
    maxWidth: '80%',
    lineHeight: 1.2,
    textShadow: `0 2px 8px rgba(0, 0, 0, ${theme.styles.shadowIntensity})`,
  };

  const accentBarStyle: React.CSSProperties = {
    width: '300px',
    height: '6px',
    backgroundColor: theme.colors.accent,
    marginTop: '2rem',
    borderRadius: `${theme.styles.borderRadius}px`,
    zIndex: 1,
  };

  return (
    <div style={slideStyle}>
      {content.sectionNumber !== undefined && (
        <div style={sectionNumberStyle}>
          {String(content.sectionNumber).padStart(2, '0')}
        </div>
      )}

      <h1
        style={titleStyle}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => handleTitleChange(e.currentTarget.textContent || '')}
      >
        {content.title || 'Section Title'}
      </h1>

      <div style={accentBarStyle} />
    </div>
  );
}
