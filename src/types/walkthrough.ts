export interface WalkthroughFrame {
  id: string;
  imageData: string; // base64 or blob URL
  timestamp: number;
  position?: {
    x: number;
    y: number;
    z: number; // for future 3D positioning
  };
  orientation?: {
    pitch: number;
    yaw: number;
    roll: number;
  };
}

export interface WalkthroughSession {
  id: string;
  title: string;
  description: string;
  frames: WalkthroughFrame[];
  createdAt: number;
  updatedAt: number;
  isUploaded: boolean;
  uploadProgress?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata: {
    deviceInfo: string;
    totalFrames: number;
    duration: number; // in milliseconds
    totalSize: number; // in bytes
  };
}

export interface CaptureSession {
  id: string;
  frames: WalkthroughFrame[];
  startTime: number;
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
}

export interface UploadStatus {
  isUploading: boolean;
  progress: number;
  error?: string;
}