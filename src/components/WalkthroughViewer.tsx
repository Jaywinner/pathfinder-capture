import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw } from 'lucide-react';
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
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms between frames

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

  const goToNextFrame = () => {
    if (currentFrameIndex < session.frames.length - 1) {
      setCurrentFrameIndex(prev => prev + 1);
    }
  };

  const goToPrevFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(prev => prev - 1);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetToBeginning = () => {
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{session.title}</h2>
            {session.description && (
              <p className="text-sm text-muted-foreground">{session.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-foreground hover:bg-muted/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full pt-20 pb-24 flex items-center justify-center">
        {currentFrame ? (
          <div className="relative max-w-full max-h-full">
            <img
              src={currentFrame.imageData}
              alt={`Frame ${currentFrameIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* Frame navigation arrows */}
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevFrame}
              disabled={currentFrameIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 glass-effect"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextFrame}
              disabled={currentFrameIndex === session.frames.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 glass-effect"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>No frames available</p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm">
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Frame {currentFrameIndex + 1} of {session.frames.length}</span>
              <span className="text-muted-foreground">
                {new Date(currentFrame?.timestamp || 0).toLocaleTimeString()}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={resetToBeginning}
              disabled={currentFrameIndex === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              onClick={goToPrevFrame}
              disabled={currentFrameIndex === 0}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              onClick={togglePlayback}
              className="capture-button w-12 h-12 rounded-full"
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
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-muted rounded px-2 py-1 text-sm"
              >
                <option value={2000}>0.5x</option>
                <option value={1000}>1x</option>
                <option value={500}>2x</option>
                <option value={250}>4x</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalkthroughViewer;