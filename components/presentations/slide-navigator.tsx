'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, Copy, GripVertical, FileText, BarChart3, Image, Quote, List, Split, Clock, FileQuestion } from 'lucide-react';
import { Slide, Theme } from '@/lib/presentations/types';
import { cn } from '@/lib/utils/cn';

interface SlideNavigatorProps {
  slides: Slide[];
  selectedIndex: number;
  theme: Theme;
  onSelect: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
}

export function SlideNavigator({
  slides,
  selectedIndex,
  theme,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
  onDuplicate
}: SlideNavigatorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onReorder(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, onReorder]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedIndex < slides.length - 1) {
          onSelect(selectedIndex + 1);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedIndex > 0) {
          onSelect(selectedIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, slides.length, onSelect]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Slides</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{slides.length} slide{slides.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Slide List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-500 dark:text-gray-400">
            No slides yet
          </div>
        ) : (
          slides.map((slide, index) => (
            <SlideThumbnail
              key={slide.id}
              slide={slide}
              index={index}
              isSelected={index === selectedIndex}
              isDragging={index === draggedIndex}
              isDragOver={index === dragOverIndex}
              theme={theme}
              onSelect={() => onSelect(index)}
              onDelete={() => onDelete(index)}
              onDuplicate={() => onDuplicate(index)}
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={() => setDragOverIndex(index)}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>

      {/* Add Slide Button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Slide
        </button>
      </div>
    </div>
  );
}

interface SlideThumbnailProps {
  slide: Slide;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  theme: Theme;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
}

function SlideThumbnail({
  slide,
  index,
  isSelected,
  isDragging,
  isDragOver,
  theme,
  onSelect,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDragEnd
}: SlideThumbnailProps) {
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Lazy load slide thumbnails using intersection observer
  useEffect(() => {
    if (!thumbnailRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px', // Load slides 50px before they come into view
        threshold: 0.01,
      }
    );

    observer.observe(thumbnailRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver();
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't select if clicking on action buttons
    if ((e.target as HTMLElement).closest('button[data-action]')) {
      return;
    }
    onSelect();
  };

  return (
    <div
      ref={thumbnailRef}
      draggable
      onClick={handleClick}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={handleDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        "relative group rounded-lg border-2 p-2 cursor-pointer transition-all",
        isSelected
          ? "border-purple-500 ring-2 ring-purple-200 dark:ring-purple-900 shadow-md"
          : "border-transparent hover:border-gray-300 dark:hover:border-gray-600",
        isDragging && "opacity-50 cursor-grabbing",
        isDragOver && !isDragging && "border-purple-300 dark:border-purple-700 border-dashed"
      )}
    >
      {/* Slide Number Badge */}
      <div className="absolute top-1 left-1 z-10 px-1.5 py-0.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded">
        {index + 1}
      </div>

      {/* Drag Handle */}
      <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
        <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </div>

      {/* Thumbnail Preview */}
      <div
        className="aspect-video rounded overflow-hidden border border-gray-200 dark:border-gray-700"
        style={{ backgroundColor: slide.backgroundColor || theme.colors.background }}
      >
        {isVisible ? (
          <MiniSlidePreview slide={slide} theme={theme} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Context Menu (on hover) */}
      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          data-action="duplicate"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Duplicate slide"
        >
          <Copy className="w-3 h-3 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          data-action="delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete slide"
        >
          <Trash2 className="w-3 h-3 text-red-500 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}

interface MiniSlidePreviewProps {
  slide: Slide;
  theme: Theme;
}

function MiniSlidePreview({ slide, theme }: MiniSlidePreviewProps) {
  const slideTypeIcons = {
    'title': FileText,
    'content': List,
    'data-visualization': BarChart3,
    'comparison': Split,
    'process': List,
    'image': Image,
    'quote': Quote,
    'timeline': Clock,
    'section-divider': FileText,
    'references': FileText,
    'qa': FileQuestion,
    'two-column': Split
  };

  const Icon = slideTypeIcons[slide.type] || FileText;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
      style={{ color: theme.colors.text }}
    >
      {/* Slide Type Icon */}
      <Icon className="w-6 h-6 mb-1 opacity-40" />

      {/* Title Preview */}
      {slide.content.title && (
        <div
          className="text-[8px] font-semibold line-clamp-2 leading-tight"
          style={{
            fontFamily: theme.fonts.heading,
            color: theme.colors.text
          }}
        >
          {slide.content.title}
        </div>
      )}

      {/* Subtitle Preview */}
      {slide.content.subtitle && (
        <div
          className="text-[6px] line-clamp-1 mt-0.5 opacity-70"
          style={{
            fontFamily: theme.fonts.body,
            color: theme.colors.textMuted
          }}
        >
          {slide.content.subtitle}
        </div>
      )}

      {/* Content Indicator */}
      {!slide.content.title && !slide.content.subtitle && (
        <div className="text-[7px] opacity-50 capitalize">
          {slide.type.replace('-', ' ')}
        </div>
      )}
    </div>
  );
}
