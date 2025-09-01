import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, X, CheckCircle, Circle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/useCamera';
import { useNetwork } from '@/hooks/useNetwork';
import { cn } from '@/lib/utils';

interface CameraInterfaceProps {
  onSessionComplete: (sessionId: string) => void;
  onClose: () => void;
}

const GUIDANCE_STEPS = [
  "Point your camera straight ahead to begin",
  "Slowly start moving your camera to the right", 
  "Keep moving steadily in a circle",
  "Continue moving at the same pace",
  "Great! You're halfway around",
  "Keep the steady movement going",
  "Almost complete - keep moving",
  "Perfect! Finishing up the capture",
  "Excellent! Processing your walkthrough",
  "Walkthrough capture complete!"
];

export function CameraInterface({ onSessionComplete, onClose }: CameraInterfaceProps) {
  const { isCapturing, currentSession, startCaptureSession, captureFrame, stopCaptureSession } = useCamera();
  const { isOnline } = useNetwork();
  const [isReady, setIsReady] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Start camera stream for preview
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsReady(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startCamera();

    return () => {
      // Cleanup camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartCapture = () => {
    startCaptureSession();
    setAutoCapturing(true);
    
    // Start automatic capture every 2 seconds
    captureIntervalRef.current = setInterval(async () => {
      if (currentSession && currentSession.currentStep < currentSession.totalSteps) {
        await handleAutoCaptureFrame();
      }
    }, 2000); // Capture every 2 seconds
  };

  const handleAutoCaptureFrame = async () => {
    const frame = await captureFrame();
    if (frame && currentSession && currentSession.currentStep >= currentSession.totalSteps) {
      // Session complete - stop auto capture
      setAutoCapturing(false);
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      const completedSession = stopCaptureSession();
      if (completedSession) {
        onSessionComplete(completedSession.id);
      }
    }
  };

  const handleCaptureFrame = async () => {
    // Manual capture option (keeping for compatibility)
    if (currentSession) {
      const frame = await captureFrame();
      if (frame && currentSession.currentStep >= currentSession.totalSteps) {
        setAutoCapturing(false);
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current);
        }
        const completedSession = stopCaptureSession();
        if (completedSession) {
          onSessionComplete(completedSession.id);
        }
      }
    }
  };

  const handleStop = () => {
    setAutoCapturing(false);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
    
    const completedSession = stopCaptureSession();
    if (completedSession && completedSession.frames.length > 0) {
      // If we have captured frames, go to description input
      onSessionComplete(completedSession.id);
    } else {
      // If no frames captured, just go back
      onClose();
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, []);

  const currentStep = currentSession?.currentStep || 0;
  const totalSteps = currentSession?.totalSteps || GUIDANCE_STEPS.length;
  const progress = (currentStep / totalSteps) * 100;
  const guidanceText = GUIDANCE_STEPS[Math.min(currentStep, GUIDANCE_STEPS.length - 1)];

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Camera Preview */}
      <div className="relative h-full w-full overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        
        {/* Camera Overlay */}
        <div className="absolute inset-0 camera-overlay">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  isOnline ? "bg-camera-ready" : "bg-destructive"
                )} />
                <span className="text-sm text-foreground/80">
                  {isOnline ? "Online" : "Offline"}
                </span>
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

          {/* Center Guide */}
          {isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="camera-guide w-64 h-64 rounded-2xl flex items-center justify-center">
                <div className="text-center text-foreground/60">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Center your shot</p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {!isCapturing ? (
              /* Start Capture */
              <div className="text-center space-y-4">
                <div className="glass-effect rounded-2xl p-6 mx-4">
                  <h2 className="text-xl font-semibold gradient-text mb-2">
                    Ready to Capture
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Just point your camera and start moving slowly in a circle. 
                    We'll automatically capture frames as you move!
                  </p>
                </div>
                
                <Button
                  onClick={handleStartCapture}
                  disabled={!isReady}
                  className="capture-button w-20 h-20 rounded-full border-4 border-primary-glow"
                >
                  <Camera className="h-8 w-8" />
                </Button>
              </div>
            ) : (
              /* Capturing Interface */
              <div className="space-y-4">
                {/* Progress */}
                <div className="glass-effect rounded-xl p-4 mx-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Step {currentStep + 1} of {totalSteps}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {currentSession?.frames.length || 0} frames
                    </span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <p className="text-sm text-center text-foreground/80">
                    {guidanceText}
                    {autoCapturing && (
                      <span className="block text-primary text-xs mt-1">
                        📷 Auto-capturing every 2 seconds...
                      </span>
                    )}
                  </p>
                </div>

                {/* Capture Controls */}
                <div className="flex items-center justify-center gap-8">
                  <Button
                    variant="outline"
                    onClick={handleStop}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {autoCapturing ? 'Stop Auto-Capture' : 'Stop'}
                  </Button>
                  
                  {!autoCapturing && (
                    <Button
                      onClick={handleCaptureFrame}
                      className="capture-button w-16 h-16 rounded-full"
                    >
                      <Circle className="h-6 w-6" />
                    </Button>
                  )}
                  
                  {autoCapturing && (
                    <div className="flex items-center gap-2 text-primary text-sm">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                      Recording...
                    </div>
                  )}
                  
                  <div className="w-12" /> {/* Spacer for centering */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraInterface;