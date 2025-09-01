import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { WalkthroughSession } from '@/types/walkthrough';
import { useWalkthroughStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

interface WalkthroughViewerProps {
  sessionId: string;
  onClose: () => void;
}

export function WalkthroughViewer({ sessionId, onClose }: WalkthroughViewerProps) {
  const { getSession } = useWalkthroughStorage();
  const [session, setSession] = useState<WalkthroughSession | undefined>();
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-hide controls after 3 seconds
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullscreen) {
        setShowControls(false);
      }
    }, 3000);
  }, [isFullscreen]);

  // Mouse movement shows controls
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Handle drag navigation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX;
    const startFrameIndex = currentFrameIndex;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const sensitivity = 5; // pixels per frame
      const frameOffset = Math.floor(deltaX / sensitivity);
      const newIndex = Math.max(0, Math.min(session!.frames.length - 1, startFrameIndex + frameOffset));
      setCurrentFrameIndex(newIndex);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentFrameIndex, session]);

  const goToNextFrame = useCallback(() => {
    if (currentFrameIndex < session!.frames.length - 1) {
      setCurrentFrameIndex(prev => prev + 1);
    }
  }, [currentFrameIndex, session]);

  const goToPrevFrame = useCallback(() => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(prev => prev - 1);
    }
  }, [currentFrameIndex]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const resetToBeginning = useCallback(() => {
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevFrame();
          break;
        case 'ArrowRight':
          goToNextFrame();
          break;
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevFrame, goToNextFrame, togglePlayback, toggleFullscreen, isFullscreen, onClose]);

  useEffect(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  useEffect(() => {
    const sessionData = getSession(sessionId);
    setSession(sessionData);
  }, [sessionId, getSession]);

  useEffect(() => {
    if (!isPlaying || !session) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex(prev => {
        if (prev >= session.frames.length - 1) {
          setIsPlaying(false);
          return 0; // Reset to beginning
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, session, playbackSpeed]);

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );
  }

  const currentFrame = session.frames[currentFrameIndex];
  const progress = session.frames.length > 0 ? (currentFrameIndex / (session.frames.length - 1)) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 bg-black",
        isDragging && "cursor-grabbing"
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent transition-all duration-300",
        !showControls && isFullscreen && "opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{session.title}</h2>
            {session.description && (
              <p className="text-sm text-white/80">{session.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Street View Style */}
      <div className="h-full flex items-center justify-center">
        {currentFrame ? (
          <div className="relative w-full h-full">
            <img
              ref={imageRef}
              src={currentFrame.imageData}
              alt={`Frame ${currentFrameIndex + 1}`}
              className={cn(
                "w-full h-full object-cover cursor-grab select-none",
                isDragging && "cursor-grabbing"
              )}
              onMouseDown={handleMouseDown}
              draggable={false}
            />
            
            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevFrame}
              disabled={currentFrameIndex === 0}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 border-0 w-12 h-12 transition-all duration-300",
                !showControls && isFullscreen && "opacity-0 pointer-events-none"
              )}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextFrame}
              disabled={currentFrameIndex === session.frames.length - 1}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 border-0 w-12 h-12 transition-all duration-300",
                !showControls && isFullscreen && "opacity-0 pointer-events-none"
              )}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Frame Counter */}
            <div className={cn(
              "absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm transition-all duration-300",
              !showControls && isFullscreen && "opacity-0"
            )}>
              {currentFrameIndex + 1} / {session.frames.length}
            </div>
          </div>
        ) : (
          <div className="text-center text-white">
            <p>No frames available</p>
          </div>
        )}
      </div>

      {/* Bottom Controls - Street View Style */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300",
        !showControls && isFullscreen && "opacity-0 pointer-events-none"
      )}>
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white">
              <span>Frame {currentFrameIndex + 1} of {session.frames.length}</span>
              <span className="text-white/70">
                {new Date(currentFrame?.timestamp || 0).toLocaleTimeString()}
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              onClick={resetToBeginning}
              disabled={currentFrameIndex === 0}
              className="text-white hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              onClick={goToPrevFrame}
              disabled={currentFrameIndex === 0}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              onClick={togglePlayback}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-12 h-12 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              onClick={goToNextFrame}
              disabled={currentFrameIndex === session.frames.length - 1}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-black/50 text-white rounded px-2 py-1 text-sm border-white/20"
              >
                <option value={2000}>0.5x</option>
                <option value={1000}>1x</option>
                <option value={500}>2x</option>
                <option value={250}>4x</option>
              </select>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-white/50">
            Use arrow keys or drag to navigate • Space to play/pause • F for fullscreen • ESC to exit
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalkthroughViewer;