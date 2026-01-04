'use client';

import React from 'react';
import { SlideContent, Theme, FlowchartConfig } from '@/lib/presentations/types';
// Note: Flowchart component will be implemented in Phase 7B (Task 26)
// import { Flowchart } from '@/lib/presentations/visualizations/flowchart-renderer';

interface ProcessSlideProps {
  content: SlideContent;
  theme: Theme;
  editable?: boolean;
  onContentChange?: (content: SlideContent) => void;
}

/**
 * Process Slide Template
 * Displays flowcharts and process diagrams
 */
export function ProcessSlide({
  content,
  theme,
  editable = false,
  onContentChange,
}: ProcessSlideProps) {
  const { title, flowchart } = content;

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
    fontFamily: theme.fonts.body,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: theme.fonts.heading,
    fontSize: '2rem',
    fontWeight: theme.styles.headingWeight,
    color: theme.colors.text,
    borderBottom: `3px solid ${theme.colors.primary}`,
    paddingBottom: '8px',
    marginBottom: `${theme.spacing.elementGap}px`,
  };

  const flowchartContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={slideStyle}>
      {/* Title */}
      <h2
        style={titleStyle}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => handleTitleChange(e.currentTarget.textContent || '')}
      >
        {title || 'Process Overview'}
      </h2>

      {/* Flowchart Area */}
      <div style={flowchartContainerStyle}>
        {flowchart ? (
          // TODO: Replace with actual Flowchart component when implemented (Phase 7B)
          // <Flowchart config={flowchart} theme={theme} width={800} height={380} />
          <FlowchartPlaceholder flowchart={flowchart} theme={theme} />
        ) : (
          <EmptyFlowchartPlaceholder theme={theme} />
        )}
      </div>
    </div>
  );
}

/**
 * Temporary placeholder showing flowchart data until renderer is implemented
 */
function FlowchartPlaceholder({
  flowchart,
  theme,
}: {
  flowchart: FlowchartConfig;
  theme: Theme;
}) {
  const placeholderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '32px',
    borderRadius: `${theme.styles.borderRadius}px`,
    border: `2px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    maxWidth: '800px',
    width: '100%',
  };

  const nodeListStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    width: '100%',
    maxWidth: '600px',
  };

  const nodeStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: `${theme.styles.borderRadius}px`,
    backgroundColor: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    fontSize: '0.85rem',
    textAlign: 'center',
  };

  const infoStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: theme.colors.textMuted,
  };

  return (
    <div style={placeholderStyle}>
      <svg
        className="w-12 h-12"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors.primary}
        strokeWidth="2"
      >
        <rect x="3" y="3" width="6" height="4" rx="1" />
        <rect x="9" y="10" width="6" height="4" rx="1" />
        <rect x="15" y="17" width="6" height="4" rx="1" />
        <path d="M6 7v3M12 14v3M12 7v3" strokeLinecap="round" />
      </svg>

      <div style={infoStyle}>
        <strong>Flowchart Preview</strong>
        <br />
        Layout: {flowchart.layout} | Nodes: {flowchart.nodes.length} | Edges:{' '}
        {flowchart.edges.length}
      </div>

      {flowchart.nodes.length > 0 && (
        <div style={nodeListStyle}>
          {flowchart.nodes.slice(0, 6).map((node) => (
            <div
              key={node.id}
              style={{
                ...nodeStyle,
                borderColor: node.metadata?.color || theme.colors.border,
              }}
            >
              <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>
                {node.type}
              </div>
              {node.label}
            </div>
          ))}
          {flowchart.nodes.length > 6 && (
            <div style={{ ...nodeStyle, opacity: 0.5 }}>
              +{flowchart.nodes.length - 6} more
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: '0.75rem', color: theme.colors.textMuted, fontStyle: 'italic' }}>
        Full flowchart rendering coming in Phase 7B
      </div>
    </div>
  );
}

/**
 * Placeholder shown when no flowchart data is available
 */
function EmptyFlowchartPlaceholder({ theme }: { theme: Theme }) {
  const placeholderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '48px',
    borderRadius: `${theme.styles.borderRadius}px`,
    border: `2px dashed ${theme.colors.border}`,
    color: theme.colors.textMuted,
  };

  return (
    <div style={placeholderStyle}>
      <svg
        className="w-16 h-16 opacity-50"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="6" height="4" rx="1" />
        <rect x="9" y="10" width="6" height="4" rx="1" />
        <rect x="15" y="17" width="6" height="4" rx="1" />
        <path d="M6 7v3M12 14v3M12 7v3" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: '1rem' }}>No flowchart data available</p>
      <p style={{ fontSize: '0.875rem', opacity: 0.75 }}>
        Process diagrams will appear here
      </p>
    </div>
  );
}
