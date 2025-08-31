import { useState, useEffect } from 'react';
import { WalkthroughSession } from '@/types/walkthrough';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Hook specifically for walkthrough sessions
export function useWalkthroughStorage() {
  const [sessions, setSessions] = useLocalStorage<WalkthroughSession[]>('walkthrough_sessions', []);

  const addSession = (session: WalkthroughSession) => {
    setSessions(prev => [session, ...prev]);
  };

  const updateSession = (id: string, updates: Partial<WalkthroughSession>) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === id ? { ...session, ...updates, updatedAt: Date.now() } : session
      )
    );
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(session => session.id !== id));
  };

  const getSession = (id: string) => {
    return sessions.find(session => session.id === id);
  };

  return {
    sessions,
    addSession,
    updateSession,
    deleteSession,
    getSession
  };
}