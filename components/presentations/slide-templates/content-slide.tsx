'use client';

import { SlideContent, Theme, BulletPoint } from '@/lib/presentations/types';

interface ContentSlideProps {
  content: SlideContent;
  theme: Theme;
  editable?: boolean;
  onContentChange?: (content: SlideContent) => void;
}

export function ContentSlide({
  content,
  theme,
  editable = false,
  onContentChange,
}: ContentSlideProps) {
  const handleTitleChange = (value: string) => {
    if (onContentChange) {
      onContentChange({ ...content, title: value });
    }
  };

  const handleBulletChange = (index: number, value: string) => {
    if (onContentChange && content.bullets) {
      const updatedBullets = [...content.bullets];
      updatedBullets[index] = { ...updatedBullets[index], text: value };
      onContentChange({ ...content, bullets: updatedBullets });
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

  const contentAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.spacing.elementGap}px`,
    paddingTop: `${theme.spacing.elementGap}px`,
  };

  const getBulletStyle = (level: 0 | 1 | 2): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontFamily: theme.fonts.body,
      fontSize: level === 0 ? '1.5rem' : level === 1 ? '1.3rem' : '1.1rem',
      color: theme.colors.text,
      lineHeight: 1.6,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      marginLeft: `${level * theme.spacing.bulletIndent}px`,
      marginBottom: '0.5rem',
    };
    return baseStyle;
  };

  const bulletMarkerStyle = (level: 0 | 1 | 2): React.CSSProperties => ({
    color: theme.colors.accent,
    fontSize: level === 0 ? '1.5rem' : '1.2rem',
    marginTop: '0.2rem',
    flexShrink: 0,
  });

  const getBulletMarker = (level: 0 | 1 | 2, icon?: string): string => {
    if (icon) return icon;
    return level === 0 ? '●' : level === 1 ? '○' : '▪';
  };

  return (
    <div style={slideStyle}>
      <h2
        style={titleStyle}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => handleTitleChange(e.currentTarget.textContent || '')}
      >
        {content.title || 'Slide Title'}
      </h2>

      <div style={contentAreaStyle}>
        {content.bullets && content.bullets.length > 0 ? (
          content.bullets.map((bullet: BulletPoint, index: number) => (
            <div key={index} style={getBulletStyle(bullet.level)}>
              <span style={bulletMarkerStyle(bullet.level)}>
                {getBulletMarker(bullet.level, bullet.icon)}
              </span>
              <span
                contentEditable={editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  handleBulletChange(index, e.currentTarget.textContent || '')
                }
              >
                {bullet.text}
              </span>
            </div>
          ))
        ) : (
          <div style={{ color: theme.colors.textMuted, fontStyle: 'italic' }}>
            No content available
          </div>
        )}
      </div>
    </div>
  );
}
