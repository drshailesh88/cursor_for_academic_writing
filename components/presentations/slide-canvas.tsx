'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Slide, SlideContent, Theme } from '@/lib/presentations/types';
import { getSlideComponent } from './slide-templates';

interface SlideCanvasProps {
  slide: Slide;
  theme: Theme;
  editable?: boolean;
  onSlideChange: (slide: Slide) => void;
  showSpeakerNotes?: boolean;
}

interface SpeakerNotesEditorProps {
  notes: string;
  onChange: (notes: string) => void;
  editable: boolean;
}

function SpeakerNotesEditor({ notes, onChange, editable }: SpeakerNotesEditorProps) {
  return (
    <div className="h-32 border-t bg-white dark:bg-gray-800">
      <div className="p-2 border-b">
        <span className="text-xs font-medium text-gray-500">Speaker Notes</span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        readOnly={!editable}
        placeholder="Click to add speaker notes..."
        className="w-full h-20 p-3 text-sm resize-none bg-transparent focus:outline-none"
      />
    </div>
  );
}

export function SlideCanvas({
  slide,
  theme,
  editable = true,
  onSlideChange,
  showSpeakerNotes = true
}: SlideCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Auto-scale slide to fit container
  useEffect(() => {
    if (canvasRef.current) {
      const container = canvasRef.current.parentElement;
      if (container) {
        const containerWidth = container.clientWidth - 64; // padding
        const slideWidth = 960; // base slide width
        const scale = Math.min(containerWidth / slideWidth, 1);
        setZoomLevel(scale);
      }
    }
  }, []);

  const handleContentChange = useCallback((content: SlideContent) => {
    onSlideChange({ ...slide, content });
  }, [slide, onSlideChange]);

  const handleNotesChange = useCallback((notes: string) => {
    onSlideChange({ ...slide, speakerNotes: notes });
  }, [slide, onSlideChange]);

  const SlideComponent = getSlideComponent(slide.type);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-900 overflow-auto">
        <div
          ref={canvasRef}
          className="relative shadow-2xl rounded-lg overflow-hidden"
          style={{
            width: '960px',
            height: '540px',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Slide Content */}
          <div
            className="w-full h-full"
            style={{
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
            }}
          >
            <SlideComponent
              content={slide.content}
              theme={theme}
              editable={editable}
              onContentChange={handleContentChange}
            />
          </div>
        </div>
      </div>

      {/* Speaker Notes */}
      {showSpeakerNotes && (
        <SpeakerNotesEditor
          notes={slide.speakerNotes}
          onChange={handleNotesChange}
          editable={editable}
        />
      )}
    </div>
  );
}
