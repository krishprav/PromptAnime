// app/lib/hooks/useLocalStorageAppState.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, AppSettings } from '../config';

const LOCAL_STORAGE_KEY = 'promptAnimatorAppState_v2'; 

const defaultSettings: AppSettings = {
  voiceover: false, subtitles: true, interactivity: 'medium',
  colorScheme: 'vibrant', exportFormat: 'mp4', quality: 'high'
};

const getDefaultAppState = (): AppState => ({
  concept: '',
  selectedSubject: '',
  selectedEngines: [],
  generatedAnimations: {},
  activeTab: '',
  learningLevel: 'intermediate',
  duration: 30,
  settings: defaultSettings,
});

export const useLocalStorageAppState = () => {
  const [appState, setAppState] = useState<AppState>(getDefaultAppState); 

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedState = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedState) {
          const parsedState = JSON.parse(storedState) as AppState;
          setAppState(prevState => ({ ...getDefaultAppState(), ...prevState, ...parsedState }));
        }
      } catch (e) {
        console.error("Error loading state from localStorage:", e);
        setError("Failed to load saved state from your browser.");
      } finally {
        setIsLoading(false);
      }
    } else {
        setIsLoading(false); 
    }
  }, []);


  const saveAppStateToLocalStorage = useCallback((currentState: AppState) => {
    if (typeof window === 'undefined') return;
    try {
      const serializedState = JSON.stringify(currentState);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
      setError(null); 
    } catch (err: unknown) {
      console.error("LocalStorage: Error saving app state:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error saving app state to localStorage: ${errorMessage}`);
    }
  }, []);
  
  const debouncedSaveAppState = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (stateToSave: AppState) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveAppStateToLocalStorage(stateToSave);
      }, 1000); 
    };
  }, [saveAppStateToLocalStorage]);

  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') { 
      debouncedSaveAppState(appState);
    }
  }, [appState, isLoading, debouncedSaveAppState]);

  return { 
    appState, 
    setAppState,
    isLoading, 
    error,
    saveAppState: () => saveAppStateToLocalStorage(appState) 
  };
};