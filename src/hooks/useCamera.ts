import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { WalkthroughFrame, CaptureSession } from '@/types/walkthrough';
import { toast } from '@/hooks/use-toast';

export function useCamera() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentSession, setCurrentSession] = useState<CaptureSession | null>(null);

  const startCaptureSession = useCallback(() => {
    const session: CaptureSession = {
      id: `session_${Date.now()}`,
      frames: [],
      startTime: Date.now(),
      isActive: true,
      currentStep: 0,
      totalSteps: 10 // Default guidance steps
    };
    setCurrentSession(session);
    setIsCapturing(true);
    toast({
      title: "Capture Started",
      description: "Follow the on-screen guidance to capture your walkthrough"
    });
    return session;
  }, []);

  const captureFrame = useCallback(async (): Promise<WalkthroughFrame | null> => {
    if (!currentSession) return null;
    
    try {
      // Haptic feedback
      await Haptics.impact({ style: ImpactStyle.Medium });
      
      // Capture image
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1920,
        height: 1080
      });

      const frame: WalkthroughFrame = {
        id: `frame_${Date.now()}_${currentSession.frames.length}`,
        imageData: image.dataUrl!,
        timestamp: Date.now(),
        // TODO: Add device orientation and position data
      };

      // Update session
      const updatedSession = {
        ...currentSession,
        frames: [...currentSession.frames, frame],
        currentStep: currentSession.currentStep + 1
      };
      
      setCurrentSession(updatedSession);
      
      return frame;
    } catch (error) {
      console.error('Error capturing frame:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture frame. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [currentSession]);

  const stopCaptureSession = useCallback(() => {
    if (currentSession) {
      setCurrentSession(prev => prev ? { ...prev, isActive: false } : null);
    }
    setIsCapturing(false);
    return currentSession;
  }, [currentSession]);

  const resetSession = useCallback(() => {
    setCurrentSession(null);
    setIsCapturing(false);
  }, []);

  return {
    isCapturing,
    currentSession,
    startCaptureSession,
    captureFrame,
    stopCaptureSession,
    resetSession
  };
}