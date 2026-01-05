'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Presentation, Slide, ThemeId } from '@/lib/presentations/types';
import { getTheme, THEMES } from '@/lib/presentations/themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Save,
  Download,
  Play,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Palette,
  Sparkles,
  Expand,
  Minimize,
  LayoutGrid,
  MessageSquare,
  X,
  MoreVertical,
  Eye,
  EyeOff,
} from 'lucide-react';

interface PresentationModeProps {
  presentation: Presentation;
  onUpdate: (presentation: Presentation) => void;
  onExit: () => void;
  onSave: () => Promise<void>;
  onExport: (format: 'pptx' | 'pdf') => Promise<void>;
}

export function PresentationMode({
  presentation,
  onUpdate,
  onExit,
  onSave,
  onExport,
}: PresentationModeProps) {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(true);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [slideToDelete, setSlideToDelete] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);

  const theme = getTheme(presentation.theme);
  const currentSlide = presentation.slides[selectedSlideIndex];

  // Handle slide content update
  const handleSlideUpdate = useCallback(
    (updatedSlide: Slide) => {
      const updatedSlides = [...presentation.slides];
      updatedSlides[selectedSlideIndex] = updatedSlide;
      onUpdate({ ...presentation, slides: updatedSlides });
    },
    [presentation, selectedSlideIndex, onUpdate]
  );

  // Handle slide reordering
  const handleSlideReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      const updatedSlides = [...presentation.slides];
      const [movedSlide] = updatedSlides.splice(fromIndex, 1);
      updatedSlides.splice(toIndex, 0, movedSlide);

      // Update selected index if necessary
      let newSelectedIndex = selectedSlideIndex;
      if (selectedSlideIndex === fromIndex) {
        newSelectedIndex = toIndex;
      } else if (fromIndex < selectedSlideIndex && toIndex >= selectedSlideIndex) {
        newSelectedIndex--;
      } else if (fromIndex > selectedSlideIndex && toIndex <= selectedSlideIndex) {
        newSelectedIndex++;
      }

      setSelectedSlideIndex(newSelectedIndex);
      onUpdate({ ...presentation, slides: updatedSlides });
    },
    [presentation, selectedSlideIndex, onUpdate]
  );

  // Add new slide after current
  const handleAddSlide = useCallback(() => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      title: 'New Slide',
      content: '',
      layout: 'title-content',
      notes: '',
      duration: 60,
    };

    const updatedSlides = [...presentation.slides];
    updatedSlides.splice(selectedSlideIndex + 1, 0, newSlide);

    onUpdate({ ...presentation, slides: updatedSlides });
    setSelectedSlideIndex(selectedSlideIndex + 1);
  }, [presentation, selectedSlideIndex, onUpdate]);

  // Delete slide
  const handleDeleteSlide = useCallback(
    (index: number) => {
      if (presentation.slides.length === 1) {
        alert('Cannot delete the last slide');
        return;
      }

      const updatedSlides = presentation.slides.filter((_, i) => i !== index);
      const newSelectedIndex = Math.min(selectedSlideIndex, updatedSlides.length - 1);

      onUpdate({ ...presentation, slides: updatedSlides });
      setSelectedSlideIndex(newSelectedIndex);
      setSlideToDelete(null);
    },
    [presentation, selectedSlideIndex, onUpdate]
  );

  // Duplicate slide
  const handleDuplicateSlide = useCallback(
    (index: number) => {
      const slideToDuplicate = presentation.slides[index];
      const duplicatedSlide: Slide = {
        ...slideToDuplicate,
        id: `slide-${Date.now()}`,
        title: `${slideToDuplicate.title} (Copy)`,
      };

      const updatedSlides = [...presentation.slides];
      updatedSlides.splice(index + 1, 0, duplicatedSlide);

      onUpdate({ ...presentation, slides: updatedSlides });
      setSelectedSlideIndex(index + 1);
    },
    [presentation, onUpdate]
  );

  // Update presentation title
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      onUpdate({ ...presentation, title: newTitle });
    },
    [presentation, onUpdate]
  );

  // Update theme
  const handleThemeChange = useCallback(
    (newTheme: ThemeId) => {
      onUpdate({ ...presentation, theme: newTheme });
    },
    [presentation, onUpdate]
  );

  // Save presentation
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave();
      // Auto-dismiss success (no visible message needed for save)
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Failed to save presentation. Please try again.'
      );
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  // Export presentation
  const handleExport = useCallback(
    async (format: 'pptx' | 'pdf') => {
      setIsExporting(true);
      setExportError(null);
      setExportProgress(0);

      try {
        // Simulate export progress
        const progressInterval = setInterval(() => {
          setExportProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 200);

        await onExport(format);

        clearInterval(progressInterval);
        setExportProgress(100);

        // Reset progress after completion
        setTimeout(() => setExportProgress(0), 1000);
      } catch (error) {
        console.error('Export failed:', error);
        setExportError(
          error instanceof Error
            ? error.message
            : `Failed to export presentation as ${format.toUpperCase()}. Please try again.`
        );
        setExportProgress(0);
        // Auto-dismiss error after 5 seconds
        setTimeout(() => setExportError(null), 5000);
      } finally {
        setIsExporting(false);
      }
    },
    [onExport]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape - exit preview mode
      if (e.key === 'Escape' && isPreviewMode) {
        setIsPreviewMode(false);
        return;
      }

      // Don't trigger shortcuts if user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlideIndex((prev) => Math.min(presentation.slides.length - 1, prev + 1));
      }

      // Delete - remove current slide
      if (e.key === 'Delete' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setSlideToDelete(selectedSlideIndex);
      }

      // Cmd/Ctrl + D - duplicate slide
      if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleDuplicateSlide(selectedSlideIndex);
      }

      // Cmd/Ctrl + S - save
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }

      // F5 or Cmd/Ctrl + Enter - preview mode
      if (e.key === 'F5' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
        e.preventDefault();
        setIsPreviewMode(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation.slides.length, selectedSlideIndex, isPreviewMode, handleDuplicateSlide, handleSave]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Error/Status Notifications */}
      {saveError && (
        <div className="fixed top-4 right-4 z-50 toast-slide-in">
          <div className="bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 max-w-md">
            <div className="flex items-start gap-3">
              <X className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                  Save Failed
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
              </div>
              <button
                onClick={() => setSaveError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {exportError && (
        <div className="fixed top-4 right-4 z-50 toast-slide-in">
          <div className="bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 max-w-md">
            <div className="flex items-start gap-3">
              <X className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                  Export Failed
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">{exportError}</p>
              </div>
              <button
                onClick={() => setExportError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isExporting && exportProgress > 0 && exportProgress < 100 && (
        <div className="fixed top-4 right-4 z-50 toast-slide-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-4 w-80">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Exporting presentation...
              </h4>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {exportProgress}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 dark:bg-purple-500 progress-bar-fill"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <TopBar
        title={presentation.title}
        theme={presentation.theme}
        isSaving={isSaving}
        isExporting={isExporting}
        onTitleChange={handleTitleChange}
        onThemeChange={handleThemeChange}
        onExit={onExit}
        onPreview={() => setIsPreviewMode(true)}
        onSave={handleSave}
        onExport={handleExport}
      />

      {/* Main Content - 3 panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Slide Navigator (collapsible on mobile) */}
        <aside className="w-64 md:w-64 sm:w-20 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col hidden sm:flex">
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:block">Slides</h2>
            <Button size="sm" variant="ghost" onClick={handleAddSlide} title="Add slide">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {presentation.slides.map((slide, index) => (
              <SlideThumb
                key={slide.id}
                slide={slide}
                index={index}
                isSelected={index === selectedSlideIndex}
                theme={theme}
                onSelect={() => setSelectedSlideIndex(index)}
                onDelete={() => setSlideToDelete(index)}
                onDuplicate={() => handleDuplicateSlide(index)}
                onDragStart={() => setDraggedSlideIndex(index)}
                onDragEnd={() => setDraggedSlideIndex(null)}
                onDrop={(toIndex) => {
                  if (draggedSlideIndex !== null) {
                    handleSlideReorder(draggedSlideIndex, toIndex);
                  }
                }}
                isDragging={draggedSlideIndex === index}
              />
            ))}
          </div>

          <div className="p-2 border-t border-gray-200 dark:border-gray-800">
            <Button variant="outline" size="sm" className="w-full" onClick={handleAddSlide}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </div>
        </aside>

        {/* Center - Slide Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-5xl mx-auto">
              <SlideCanvas
                slide={currentSlide}
                theme={theme}
                onUpdate={handleSlideUpdate}
              />
            </div>
          </div>

          {/* Speaker Notes */}
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Speaker Notes
            </label>
            <Textarea
              value={currentSlide.notes || ''}
              onChange={(e) =>
                handleSlideUpdate({ ...currentSlide, notes: e.target.value })
              }
              placeholder="Add notes for this slide..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </main>

        {/* Right Panel - AI Assist (hidden on mobile) */}
        {showAIAssist && (
          <aside className="w-72 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-col hidden lg:flex">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Assist</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAIAssist(false)}
                title="Hide AI Assist"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate Slide
              </Button>

              <Button variant="outline" size="sm" className="w-full justify-start">
                <Expand className="h-4 w-4 mr-2" />
                Expand Content
              </Button>

              <Button variant="outline" size="sm" className="w-full justify-start">
                <Minimize className="h-4 w-4 mr-2" />
                Simplify Content
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Change Layout
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => handleSlideUpdate({ ...currentSlide, layout: 'title' })}>
                    Title Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSlideUpdate({ ...currentSlide, layout: 'title-content' })}>
                    Title & Content
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSlideUpdate({ ...currentSlide, layout: 'two-column' })}>
                    Two Columns
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSlideUpdate({ ...currentSlide, layout: 'full-content' })}>
                    Full Content
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    AI Chat
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Chat about this slide to get suggestions and improvements
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Bar */}
      <BottomBar
        currentSlideIndex={selectedSlideIndex}
        totalSlides={presentation.slides.length}
        estimatedDuration={presentation.slides.reduce((sum, slide) => sum + (slide.duration || 60), 0)}
        showAIAssist={showAIAssist}
        onPrevious={() => setSelectedSlideIndex(Math.max(0, selectedSlideIndex - 1))}
        onNext={() => setSelectedSlideIndex(Math.min(presentation.slides.length - 1, selectedSlideIndex + 1))}
        onSlideSelect={setSelectedSlideIndex}
        onToggleAIAssist={() => setShowAIAssist(!showAIAssist)}
      />

      {/* Preview Mode Modal */}
      {isPreviewMode && (
        <PreviewOverlay
          slides={presentation.slides}
          theme={theme}
          currentIndex={selectedSlideIndex}
          onClose={() => setIsPreviewMode(false)}
          onSlideChange={setSelectedSlideIndex}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={slideToDelete !== null} onOpenChange={() => setSlideToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slide?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this slide? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => slideToDelete !== null && handleDeleteSlide(slideToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Top Bar Component
interface TopBarProps {
  title: string;
  theme: ThemeId;
  isSaving: boolean;
  isExporting: boolean;
  onTitleChange: (title: string) => void;
  onThemeChange: (theme: ThemeId) => void;
  onExit: () => void;
  onPreview: () => void;
  onSave: () => void;
  onExport: (format: 'pptx' | 'pdf') => void;
}

function TopBar({
  title,
  theme,
  isSaving,
  isExporting,
  onTitleChange,
  onThemeChange,
  onExit,
  onPreview,
  onSave,
  onExport,
}: TopBarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      onTitleChange(editedTitle.trim());
    } else {
      setEditedTitle(title);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="border-l border-gray-200 dark:border-gray-800 pl-3">
          {isEditingTitle ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setEditedTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="h-8 w-64"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              {title}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Palette className="h-4 w-4 mr-2" />
              Theme
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(THEMES).map(([id, themeData]) => (
              <DropdownMenuItem
                key={id}
                onClick={() => onThemeChange(id as ThemeId)}
                className={theme === id ? 'bg-purple-50 dark:bg-purple-950' : ''}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: themeData.colors.primary }}
                  />
                  <span>{themeData.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={onPreview}>
          <Play className="h-4 w-4 mr-2" />
          Preview
        </Button>

        <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('pptx')}>
              Export as PowerPoint (.pptx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')}>
              Export as PDF (.pdf)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Bottom Bar Component
interface BottomBarProps {
  currentSlideIndex: number;
  totalSlides: number;
  estimatedDuration: number;
  showAIAssist: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSlideSelect: (index: number) => void;
  onToggleAIAssist: () => void;
}

function BottomBar({
  currentSlideIndex,
  totalSlides,
  estimatedDuration,
  showAIAssist,
  onPrevious,
  onNext,
  onSlideSelect,
  onToggleAIAssist,
}: BottomBarProps) {
  const minutes = Math.floor(estimatedDuration / 60);
  const seconds = estimatedDuration % 60;

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={currentSlideIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
          Slide {currentSlideIndex + 1} of {totalSlides}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={currentSlideIndex === totalSlides - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onSlideSelect(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlideIndex
                ? 'w-6 bg-purple-600 dark:bg-purple-500'
                : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
            }`}
            title={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Duration: {minutes}:{seconds.toString().padStart(2, '0')}
        </span>

        <Button variant="ghost" size="sm" onClick={onToggleAIAssist}>
          {showAIAssist ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide AI
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show AI
            </>
          )}
        </Button>
      </div>
    </footer>
  );
}

// Slide Thumbnail Component
interface SlideThumbProps {
  slide: Slide;
  index: number;
  isSelected: boolean;
  theme: any;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: (toIndex: number) => void;
  isDragging: boolean;
}

function SlideThumb({
  slide,
  index,
  isSelected,
  theme,
  onSelect,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging,
}: SlideThumbProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
      className={`group relative rounded-lg border-2 transition-all cursor-pointer slide-thumbnail ${
        isSelected
          ? 'border-purple-600 dark:border-purple-500 shadow-md'
          : 'border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-600'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={onSelect}
    >
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      <div className="absolute top-1 left-1 bg-gray-900/70 text-white text-xs px-1.5 py-0.5 rounded">
        {index + 1}
      </div>

      <div
        className="aspect-[16/9] rounded-md p-3 text-xs overflow-hidden"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
        }}
      >
        <div className="font-semibold truncate" style={{ color: theme.colors.primary }}>
          {slide.title}
        </div>
        <div className="mt-1 text-[10px] line-clamp-3 opacity-70">
          {slide.content}
        </div>
      </div>

      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 bg-gray-900/70 hover:bg-gray-900/90"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Slide Canvas Component
interface SlideCanvasProps {
  slide: Slide;
  theme: any;
  onUpdate: (slide: Slide) => void;
}

function SlideCanvas({ slide, theme, onUpdate }: SlideCanvasProps) {
  return (
    <div
      className="rounded-lg shadow-xl overflow-hidden aspect-[16/9] slide-canvas"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      <div className="h-full flex flex-col p-6 sm:p-8 md:p-12">
        {/* Title */}
        <Input
          value={slide.title}
          onChange={(e) => onUpdate({ ...slide, title: e.target.value })}
          placeholder="Slide title..."
          className="text-2xl sm:text-3xl md:text-4xl font-bold border-none bg-transparent shadow-none focus-visible:ring-0 px-0"
          style={{ color: theme.colors.primary }}
        />

        {/* Content */}
        <div className="flex-1 mt-4 sm:mt-6 md:mt-8">
          <Textarea
            value={slide.content}
            onChange={(e) => onUpdate({ ...slide, content: e.target.value })}
            placeholder="Slide content..."
            className="h-full text-base sm:text-lg md:text-xl border-none bg-transparent shadow-none focus-visible:ring-0 px-0 resize-none"
            style={{ color: theme.colors.text }}
          />
        </div>
      </div>
    </div>
  );
}

// Preview Overlay Component
interface PreviewOverlayProps {
  slides: Slide[];
  theme: any;
  currentIndex: number;
  onClose: () => void;
  onSlideChange: (index: number) => void;
}

function PreviewOverlay({
  slides,
  theme,
  currentIndex,
  onClose,
  onSlideChange,
}: PreviewOverlayProps) {
  const currentSlide = slides[currentIndex];
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        onSlideChange(Math.max(0, currentIndex - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        onSlideChange(Math.min(slides.length - 1, currentIndex + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, onClose, onSlideChange]);

  // Touch gesture support for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe right - previous slide
          onSlideChange(Math.max(0, currentIndex - 1));
        } else {
          // Swipe left - next slide
          onSlideChange(Math.min(slides.length - 1, currentIndex + 1));
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [currentIndex, slides.length, onSlideChange]
  );

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center modal-backdrop"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 button-press safe-area-top"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Previous Button */}
      {currentIndex > 0 && (
        <button
          onClick={() => onSlideChange(currentIndex - 1)}
          className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 button-press hidden sm:flex"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Next Button */}
      {currentIndex < slides.length - 1 && (
        <button
          onClick={() => onSlideChange(currentIndex + 1)}
          className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 button-press hidden sm:flex"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Slide Content */}
      <div className="w-[95vw] sm:w-[90vw] h-[85vh] sm:h-[90vh] max-w-7xl">
        <div
          className="w-full h-full rounded-lg shadow-2xl flex flex-col p-6 sm:p-12 md:p-16 slide-scale-in"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
          }}
        >
          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-12"
            style={{ color: theme.colors.primary }}
          >
            {currentSlide.title}
          </h1>
          <div
            className="text-lg sm:text-2xl md:text-3xl leading-relaxed whitespace-pre-wrap overflow-auto"
            style={{ color: theme.colors.text }}
          >
            {currentSlide.content}
          </div>
        </div>
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-2 rounded-full">
        <span className="text-white text-sm">
          {currentIndex + 1} / {slides.length}
        </span>
      </div>
    </div>
  );
}
