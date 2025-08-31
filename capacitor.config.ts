import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4d2b5475c3b547f8a3278cf247580b36',
  appName: 'pathfinder-capture',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://4d2b5475-c3b5-47f8-a327-8cf247580b36.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      permissions: ['writeExternalStorage', 'readExternalStorage']
    }
  }
};

export default config;