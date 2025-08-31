import React from 'react';
import { Play, Upload, Trash2, Clock, MapPin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalkthroughSession } from '@/types/walkthrough';
import { useWalkthroughStorage } from '@/hooks/useLocalStorage';
import { useNetwork } from '@/hooks/useNetwork';
import { cn } from '@/lib/utils';

interface WalkthroughGalleryProps {
  onViewSession: (sessionId: string) => void;
  onUploadSession: (sessionId: string) => void;
}

export function WalkthroughGallery({ onViewSession, onUploadSession }: WalkthroughGalleryProps) {
  const { sessions, deleteSession } = useWalkthroughStorage();
  const { isOnline } = useNetwork();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
          <Play className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Walkthroughs Yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Start capturing your first walkthrough to see it here. Your sessions will be saved locally.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Walkthroughs</h2>
        <Badge variant={isOnline ? "default" : "secondary"}>
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className="glass-effect">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">
                    {session.title || 'Untitled Walkthrough'}
                  </CardTitle>
                  {session.description && (
                    <p className="text-sm text-muted-foreground">
                      {session.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {session.isUploaded && (
                    <Badge variant="outline" className="text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Preview thumbnails */}
              {session.frames.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {session.frames.slice(0, 4).map((frame, index) => (
                    <div 
                      key={frame.id} 
                      className="relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-muted"
                    >
                      <img 
                        src={frame.imageData} 
                        alt={`Frame ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {session.frames.length > 4 && (
                    <div className="flex-shrink-0 w-16 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        +{session.frames.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(session.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {session.metadata.totalFrames} frames
                </div>
                <div>
                  {formatFileSize(session.metadata.totalSize)}
                </div>
                <div>
                  {formatDuration(session.metadata.duration)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onViewSession(session.id)}
                  className="flex-1"
                  variant="outline"
                >
                  <Play className="h-4 w-4 mr-2" />
                  View
                </Button>
                
                {!session.isUploaded && isOnline && (
                  <Button
                    onClick={() => onUploadSession(session.id)}
                    variant="default"
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                )}

                <Button
                  onClick={() => deleteSession(session.id)}
                  variant="outline"
                  size="icon"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default WalkthroughGallery;