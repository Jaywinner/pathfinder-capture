import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // Get initial network status
    const getStatus = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      } catch (error) {
        console.error('Error getting network status:', error);
        // Fallback to browser API
        setIsOnline(navigator.onLine);
      }
    };

    getStatus();

    // Listen for network changes
    let networkListener: any;
    const setupListener = async () => {
      try {
        networkListener = await Network.addListener('networkStatusChange', status => {
          setIsOnline(status.connected);
          setConnectionType(status.connectionType);
        });
      } catch (error) {
        console.error('Error setting up network listener:', error);
      }
    };

    setupListener();

    // Fallback listeners for browser
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}