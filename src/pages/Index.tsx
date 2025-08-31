import React, { useState } from 'react';
import { Camera, Image, Upload, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetwork } from '@/hooks/useNetwork';
import { useWalkthroughStorage } from '@/hooks/useLocalStorage';
import { WalkthroughSession } from '@/types/walkthrough';
import CameraInterface from '@/components/CameraInterface';
import WalkthroughGallery from '@/components/WalkthroughGallery';
import WalkthroughViewer from '@/components/WalkthroughViewer';
import DescriptionInput from '@/components/DescriptionInput';
import { toast } from '@/hooks/use-toast';

type AppView = 'home' | 'camera' | 'gallery' | 'viewer' | 'description';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [pendingSessionId, setPendingSessionId] = useState<string>('');
  const { isOnline } = useNetwork();
  const { sessions, addSession, updateSession, getSession } = useWalkthroughStorage();

  const handleCameraSessionComplete = (sessionId: string) => {
    setPendingSessionId(sessionId);
    setCurrentView('description');
  };

  const handleDescriptionSave = (title: string, description: string) => {
    if (!pendingSessionId) return;

    // Create the walkthrough session from the pending data
    // In a real implementation, this would come from the camera hook's session data
    const mockSession: WalkthroughSession = {
      id: pendingSessionId,
      title,
      description,
      frames: [], // This would be populated from the actual capture session
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isUploaded: false,
      metadata: {
        deviceInfo: navigator.userAgent,
        totalFrames: 0, // Would be actual count
        duration: 0, // Would be actual duration
        totalSize: 0 // Would be actual size
      }
    };

    addSession(mockSession);
    toast({
      title: "Walkthrough Saved",
      description: `"${title}" has been saved locally.`
    });

    setPendingSessionId('');
    setCurrentView('gallery');
  };

  const handleDescriptionCancel = () => {
    setPendingSessionId('');
    setCurrentView('home');
  };

  const handleViewSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setCurrentView('viewer');
  };

  const handleUploadSession = async (sessionId: string) => {
    const session = getSession(sessionId);
    if (!session) return;

    // Mock upload process
    toast({
      title: "Upload Started",
      description: "Your walkthrough is being uploaded..."
    });

    // Simulate upload delay
    setTimeout(() => {
      updateSession(sessionId, { isUploaded: true });
      toast({
        title: "Upload Complete",
        description: "Your walkthrough has been uploaded successfully!"
      });
    }, 2000);
  };

  // Render different views
  if (currentView === 'camera') {
    return (
      <CameraInterface
        onSessionComplete={handleCameraSessionComplete}
        onClose={() => setCurrentView('home')}
      />
    );
  }

  if (currentView === 'description') {
    return (
      <DescriptionInput
        onSave={handleDescriptionSave}
        onCancel={handleDescriptionCancel}
        frameCount={10} // Mock frame count
      />
    );
  }

  if (currentView === 'viewer' && selectedSessionId) {
    return (
      <WalkthroughViewer
        sessionId={selectedSessionId}
        onClose={() => setCurrentView('gallery')}
      />
    );
  }

  if (currentView === 'gallery') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="p-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('home')}
              className="mb-2"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <WalkthroughGallery
          onViewSession={handleViewSession}
          onUploadSession={handleUploadSession}
        />
      </div>
    );
  }

  // Home view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 text-center border-b border-border">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-primary" />
          ) : (
            <WifiOff className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Pathfinder Capture
        </h1>
        <p className="text-muted-foreground">
          Capture and map your environment with guided walkthroughs
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Primary Action - Start Capture */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full capture-button flex items-center justify-center">
              <Camera className="h-10 w-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Start New Capture</h2>
              <p className="text-sm text-muted-foreground">
                Begin a guided walkthrough of your environment
              </p>
            </div>
            
            <Button
              onClick={() => setCurrentView('camera')}
              className="w-full capture-button py-6 text-lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Start Capture
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="grid gap-3">
            <Button
              onClick={() => setCurrentView('gallery')}
              variant="outline"
              className="w-full glass-effect"
            >
              <Image className="h-4 w-4 mr-2" />
              View Gallery ({sessions.length})
            </Button>

            {sessions.some(s => !s.isUploaded) && isOnline && (
              <Button
                onClick={() => {
                  const unuploadedSessions = sessions.filter(s => !s.isUploaded);
                  unuploadedSessions.forEach(session => handleUploadSession(session.id));
                }}
                variant="secondary"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload All ({sessions.filter(s => !s.isUploaded).length})
              </Button>
            )}
          </div>

          {/* Status Info */}
          <div className="glass-effect rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stored Locally</span>
              <span className="font-medium">{sessions.length} sessions</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection</span>
              <span className={`font-medium ${isOnline ? 'text-primary' : 'text-muted-foreground'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending Upload</span>
              <span className="font-medium">
                {sessions.filter(s => !s.isUploaded).length} sessions
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
