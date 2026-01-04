'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Presentation, Slide, Theme } from '@/lib/presentations/types';
import { getTheme } from '@/lib/presentations/themes';
import { getSlideComponent } from './slide-templates';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Monitor,
  Maximize2,
} from 'lucide-react';

interface PresenterViewProps {
  presentation: Presentation;
  startSlide?: number;
  onExit: () => void;
}

/**
 * PresentationTimer - Standalone timer component with play/pause/reset
 */
function PresentationTimer() {
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setElapsedSeconds(0);
    setIsRunning(true);
  };

  return (
    <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-lg">
      <Clock className="h-5 w-5 text-white/70" />
      <span className="text-2xl font-mono text-white font-semibold min-w-[80px]">
        {formatTime(elapsedSeconds)}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title={isRunning ? 'Pause' : 'Play'}
        >
          {isRunning ? (
            <Pause className="h-4 w-4 text-white" />
          ) : (
            <Play className="h-4 w-4 text-white" />
          )}
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}

/**
 * SlidePreview - Renders a small preview of a slide
 */
interface SlidePreviewProps {
  slide: Slide;
  theme: Theme;
  label: string;
}

function SlidePreview({ slide, theme, label }: SlidePreviewProps) {
  const SlideComponent = getSlideComponent(slide.type);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-white/60 uppercase tracking-wide font-semibold">
        {label}
      </div>
      <div
        className="relative rounded-lg overflow-hidden shadow-2xl border border-white/10"
        style={{
          width: '320px',
          height: '180px',
          backgroundColor: theme.colors.background,
        }}
      >
        <div
          className="w-full h-full"
          style={{
            transform: 'scale(0.333)',
            transformOrigin: 'top left',
            width: '960px',
            height: '540px',
          }}
        >
          <SlideComponent content={slide.content} theme={theme} editable={false} />
        </div>
      </div>
    </div>
  );
}

/**
 * PresenterView - Full-screen presenter mode with speaker notes, timer, and navigation
 */
export function PresenterView({
  presentation,
  startSlide = 0,
  onExit,
}: PresenterViewProps) {
  const [currentSlide, setCurrentSlide] = useState(startSlide);
  const slideAreaRef = useRef<HTMLDivElement>(null);
  const theme = getTheme(presentation.theme);

  const currentSlideData = presentation.slides[currentSlide];
  const nextSlideData = presentation.slides[currentSlide + 1];
  const hasPrevious = currentSlide > 0;
  const hasNext = currentSlide < presentation.slides.length - 1;

  // Navigation functions
  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [hasNext]);

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [hasPrevious]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < presentation.slides.length) {
        setCurrentSlide(index);
      }
    },
    [presentation.slides.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(presentation.slides.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, goToNext, goToPrevious, goToSlide, onExit, presentation.slides.length]);

  // Full-screen handling
  useEffect(() => {
    // Enter full-screen on mount
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn('Could not enter fullscreen:', err);
      }
    };

    enterFullscreen();

    // Exit full-screen on unmount
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn('Could not exit fullscreen:', err);
        });
      }
    };
  }, []);

  // Click to advance on slide area
  const handleSlideClick = useCallback(() => {
    goToNext();
  }, [goToNext]);

  const SlideComponent = getSlideComponent(currentSlideData.type);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="font-medium">Exit Presenter View</span>
        </button>

        <div className="text-white/90 text-lg font-medium">
          Slide {currentSlide + 1} of {presentation.slides.length}
        </div>

        <PresentationTimer />
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 p-6 pt-2 overflow-hidden">
        {/* Left Side - Current Slide + Speaker Notes */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Current Slide */}
          <div
            ref={slideAreaRef}
            onClick={handleSlideClick}
            className="flex-1 flex items-center justify-center cursor-pointer group"
          >
            <div
              className="relative rounded-lg overflow-hidden shadow-2xl transition-transform group-hover:scale-[1.02]"
              style={{
                width: '960px',
                height: '540px',
                maxWidth: '100%',
                maxHeight: '100%',
                backgroundColor: theme.colors.background,
              }}
            >
              <SlideComponent
                content={currentSlideData.content}
                theme={theme}
                editable={false}
              />
            </div>
          </div>

          {/* Speaker Notes */}
          <div className="bg-black/40 rounded-lg p-4 backdrop-blur-sm border border-white/10 max-h-[200px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="h-4 w-4 text-white/70" />
              <span className="text-xs text-white/70 uppercase tracking-wide font-semibold">
                Speaker Notes
              </span>
            </div>
            {currentSlideData.speakerNotes ? (
              <div className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">
                {currentSlideData.speakerNotes}
              </div>
            ) : (
              <div className="text-white/40 text-sm italic">
                No speaker notes for this slide
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Next Slide Preview + Timer Controls */}
        <div className="flex flex-col gap-4 w-[340px]">
          {/* Next Slide Preview */}
          {nextSlideData ? (
            <SlidePreview slide={nextSlideData} theme={theme} label="Next Slide" />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-white/60 uppercase tracking-wide font-semibold">
                Next Slide
              </div>
              <div className="w-[320px] h-[180px] rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
                <span className="text-white/40 text-sm">End of presentation</span>
              </div>
            </div>
          )}

          {/* Slide Thumbnails Grid (Optional, for quick navigation) */}
          <div className="bg-black/40 rounded-lg p-3 backdrop-blur-sm border border-white/10 flex-1 overflow-y-auto">
            <div className="text-xs text-white/60 uppercase tracking-wide font-semibold mb-3">
              All Slides
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presentation.slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(index)}
                  className={`relative rounded border overflow-hidden transition-all ${
                    index === currentSlide
                      ? 'border-blue-500 ring-2 ring-blue-500/50'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  title={`Go to slide ${index + 1}`}
                >
                  <div
                    className="aspect-video w-full"
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <div
                      className="text-[6px] p-1 overflow-hidden"
                      style={{ color: theme.colors.text }}
                    >
                      {slide.content.title || `Slide ${index + 1}`}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <footer className="flex items-center justify-between px-6 py-4 bg-gradient-to-t from-black/60 to-transparent">
        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          disabled={!hasPrevious}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="font-medium">Previous</span>
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5">
          {presentation.slides.map((_, index) => {
            const isCurrent = index === currentSlide;
            const isPast = index < currentSlide;

            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  isCurrent
                    ? 'w-8 bg-blue-500'
                    : isPast
                    ? 'w-2 bg-white/60'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                title={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={goToNext}
          disabled={!hasNext}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="font-medium">Next</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </footer>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-20 right-6 bg-black/60 text-white/60 text-xs px-3 py-2 rounded-lg backdrop-blur-sm border border-white/10">
        <div className="font-semibold text-white/80 mb-1">Keyboard Shortcuts</div>
        <div className="space-y-0.5">
          <div>← → Space: Navigate slides</div>
          <div>Esc: Exit presenter view</div>
          <div>Home/End: First/Last slide</div>
        </div>
      </div>
    </div>
  );
}
