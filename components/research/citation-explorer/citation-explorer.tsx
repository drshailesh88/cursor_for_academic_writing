// Citation Explorer Modal
// Main component for exploring citation networks

'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, Loader2, AlertCircle } from 'lucide-react';
import { useCitationExplorer } from './citation-explorer-context';
import { GraphVisualization } from './graph-visualization';
import { NodeDetailPanel } from './node-detail-panel';
import { GraphControls, GraphStatsDisplay, ClusterLegend } from './graph-controls';

export function CitationExplorer() {
  const {
    isOpen,
    isLoading,
    error,
    graph,
    selectedNode,
    colorScheme,
    setColorScheme,
    layout,
    setLayout,
    closeExplorer,
    selectNode,
    hoverNode,
    expandNode,
    pinNode,
    addToResearch,
  } = useCitationExplorer();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Account for detail panel width if node is selected
        const panelWidth = selectedNode ? 320 : 0;
        setDimensions({
          width: rect.width - panelWidth,
          height: rect.height,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [selectedNode]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedNode) {
          selectNode(null);
        } else {
          closeExplorer();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedNode, selectNode, closeExplorer]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-4 bg-background rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Network className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Citation Network</h2>
                {graph && (
                  <p className="text-sm text-muted-foreground">
                    Exploring from: {graph.seed.paper.title.slice(0, 50)}...
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={closeExplorer}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div ref={containerRef} className="flex-1 relative flex">
            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Building citation network...
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center max-w-md">
                  <AlertCircle className="w-12 h-12 text-destructive" />
                  <h3 className="font-semibold">Failed to load citation network</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <button
                    onClick={closeExplorer}
                    className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Graph visualization */}
            {graph && !error && (
              <>
                <div className="flex-1 relative">
                  <GraphVisualization
                    graph={graph}
                    selectedNode={selectedNode}
                    colorScheme={colorScheme}
                    onNodeClick={selectNode}
                    onNodeHover={hoverNode}
                    onNodeDoubleClick={(node) => expandNode(node.id)}
                    width={dimensions.width}
                    height={dimensions.height}
                  />

                  {/* Stats overlay */}
                  <GraphStatsDisplay stats={graph.stats} />

                  {/* Cluster legend */}
                  {colorScheme === 'cluster' && (
                    <ClusterLegend clusters={graph.clusters} />
                  )}

                  {/* Controls */}
                  <GraphControls
                    colorScheme={colorScheme}
                    onColorSchemeChange={setColorScheme}
                    layout={layout}
                    onLayoutChange={setLayout}
                    onZoomIn={() => {}}
                    onZoomOut={() => {}}
                    onFitView={() => {}}
                  />
                </div>

                {/* Detail panel */}
                <AnimatePresence>
                  {selectedNode && (
                    <NodeDetailPanel
                      node={selectedNode}
                      onClose={() => selectNode(null)}
                      onExpand={() => expandNode(selectedNode.id)}
                      onPin={() => pinNode(selectedNode.id)}
                      onAddToResearch={() => addToResearch(selectedNode)}
                    />
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Empty state */}
            {!graph && !isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Network className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a paper to explore its citation network
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer with help */}
          <div className="px-6 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            <span className="font-medium">Tips:</span>{' '}
            Click a node to view details • Double-click to expand connections • Drag nodes to reposition • Scroll to zoom
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
