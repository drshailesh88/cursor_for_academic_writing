'use client';

import { SlideContent, Theme, BulletPoint } from '@/lib/presentations/types';

interface TwoColumnSlideProps {
  content: SlideContent;
  theme: Theme;
  editable?: boolean;
  onContentChange?: (content: SlideContent) => void;
}

export function TwoColumnSlide({
  content,
  theme,
  editable = false,
  onContentChange,
}: TwoColumnSlideProps) {
  const handleTitleChange = (value: string) => {
    if (onContentChange) {
      onContentChange({ ...content, title: value });
    }
  };

  const handleLeftBulletChange = (index: number, value: string) => {
    if (onContentChange && content.leftContent) {
      const updated = [...content.leftContent];
      updated[index] = { ...updated[index], text: value };
      onContentChange({ ...content, leftContent: updated });
    }
  };

  const handleRightBulletChange = (index: number, value: string) => {
    if (onContentChange && content.rightContent) {
      const updated = [...content.rightContent];
      updated[index] = { ...updated[index], text: value };
      onContentChange({ ...content, rightContent: updated });
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

  const columnsContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    gap: `${theme.spacing.elementGap * 2}px`,
    paddingTop: `${theme.spacing.elementGap}px`,
  };

  const columnStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.spacing.elementGap}px`,
  };

  const getBulletStyle = (level: 0 | 1 | 2): React.CSSProperties => ({
    fontFamily: theme.fonts.body,
    fontSize: level === 0 ? '1.4rem' : level === 1 ? '1.2rem' : '1rem',
    color: theme.colors.text,
    lineHeight: 1.6,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginLeft: `${level * theme.spacing.bulletIndent}px`,
    marginBottom: '0.4rem',
  });

  const bulletMarkerStyle: React.CSSProperties = {
    color: theme.colors.accent,
    fontSize: '1.2rem',
    marginTop: '0.2rem',
    flexShrink: 0,
  };

  const getBulletMarker = (level: 0 | 1 | 2, icon?: string): string => {
    if (icon) return icon;
    return level === 0 ? '●' : level === 1 ? '○' : '▪';
  };

  const renderColumn = (
    bullets: BulletPoint[] | undefined,
    onChange: (index: number, value: string) => void
  ) => {
    if (!bullets || bullets.length === 0) {
      return (
        <div style={{ color: theme.colors.textMuted, fontStyle: 'italic' }}>
          No content
        </div>
      );
    }

    return bullets.map((bullet: BulletPoint, index: number) => (
      <div key={index} style={getBulletStyle(bullet.level)}>
        <span style={bulletMarkerStyle}>
          {getBulletMarker(bullet.level, bullet.icon)}
        </span>
        <span
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => onChange(index, e.currentTarget.textContent || '')}
        >
          {bullet.text}
        </span>
      </div>
    ));
  };

  return (
    <div style={slideStyle}>
      <h2
        style={titleStyle}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => handleTitleChange(e.currentTarget.textContent || '')}
      >
        {content.title || 'Two Column Layout'}
      </h2>

      <div style={columnsContainerStyle}>
        <div style={columnStyle}>
          {renderColumn(content.leftContent, handleLeftBulletChange)}
        </div>
        <div style={columnStyle}>
          {renderColumn(content.rightContent, handleRightBulletChange)}
        </div>
      </div>
    </div>
  );
}
