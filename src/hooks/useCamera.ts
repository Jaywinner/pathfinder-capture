import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { WalkthroughFrame, CaptureSession } from '@/types/walkthrough';
import { toast } from '@/hooks/use-toast';

// Check if we're running in a Capacitor environment
const isCapacitorAvailable = () => {
  return typeof window !== 'undefined' && (window as any).Capacitor;
};

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
      // Haptic feedback (only if Capacitor is available)
      if (isCapacitorAvailable()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
      
      let imageData: string;
      
      if (isCapacitorAvailable()) {
        // Capture image using Capacitor Camera
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          width: 1920,
          height: 1080
        });
        imageData = image.dataUrl!;
      } else {
        // Browser fallback - generate a placeholder image
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d')!;
        
        // Create a gradient background
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Add some text
        ctx.fillStyle = '#00bcd4';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Frame ${currentSession.frames.length + 1}`, 400, 280);
        ctx.fillStyle = '#64748b';
        ctx.font = '16px Arial';
        ctx.fillText(`Captured: ${new Date().toLocaleTimeString()}`, 400, 320);
        
        imageData = canvas.toDataURL();
      }

      const frame: WalkthroughFrame = {
        id: `frame_${Date.now()}_${currentSession.frames.length}`,
        imageData,
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
      const completedSession = { ...currentSession, isActive: false };
      setCurrentSession(completedSession);
      
      // Store session data temporarily for the description phase
      localStorage.setItem(`session_${completedSession.id}`, JSON.stringify(completedSession.frames));
      
      setIsCapturing(false);
      return completedSession;
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