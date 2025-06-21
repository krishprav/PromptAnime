import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, getAppId } from '../firebase'; // Assuming auth and user come from a context or props
import { doc, setDoc, onSnapshot, DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { AppState, AppSettings } from '../config';

const defaultSettings: AppSettings = {
  voiceover: false, subtitles: true, interactivity: 'medium',
  colorScheme: 'vibrant', exportFormat: 'mp4', quality: 'high'
};

export const useFirestoreAppState = (userId: string | null, isAuthReady: boolean) => {
  const [appState, setAppState] = useState<AppState>({
    concept: '',
    selectedSubject: '',
    selectedEngines: [],
    generatedAnimations: {},
    activeTab: '',
    learningLevel: 'intermediate',
    duration: 30,
    settings: defaultSettings,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const appId = getAppId();

  const getAppStateDocRef = useCallback(() => {
    if (db && userId && appId) {
      return doc(db, "artifacts", appId, "users", userId, "promptAnimatorState", "main");
    }
    return null;
  }, [userId, appId]);

  // Load state from Firestore
  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(!isAuthReady); // Still loading if auth isn't ready
      return;
    }
    
    setIsLoading(true);
    const docRef = getAppStateDocRef();
    if (!docRef) {
      setIsLoading(false);
      console.warn("Firestore document reference is not available for loading state.");
      // Set to default state if no docRef, implying new user or issue
      setAppState({
        concept: '', selectedSubject: '', selectedEngines: [],
        generatedAnimations: {}, activeTab: '', learningLevel: 'intermediate',
        duration: 30, settings: defaultSettings
      });
      return;
    }

    const unsubscribe = onSnapshot(docRef, (docSnap: DocumentSnapshot<DocumentData>) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppState;
        console.log("Firestore: Loaded app state:", data);
        setAppState({
          concept: data.concept || '',
          selectedSubject: data.selectedSubject || '',
          selectedEngines: Array.isArray(data.selectedEngines) ? data.selectedEngines : [],
          generatedAnimations: data.generatedAnimations || {},
          activeTab: data.activeTab || (Array.isArray(data.selectedEngines) && data.selectedEngines.length > 0 ? data.selectedEngines[0] : ''),
          learningLevel: data.learningLevel || 'intermediate',
          duration: data.duration || 30,
          settings: data.settings || defaultSettings,
        });
      } else {
        console.log("Firestore: No app state document found, using defaults and will save initial state.");
        // Initial save will be triggered by the save effect if state changes from default
         setAppState({ // Ensure defaults are set
            concept: '', selectedSubject: '', selectedEngines: [],
            generatedAnimations: {}, activeTab: '', learningLevel: 'intermediate',
            duration: 30, settings: defaultSettings
        });
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firestore: Error listening to app state:", err);
      setError("Error loading app state from cloud.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, getAppStateDocRef]);

  // Save state to Firestore (debounced)
  const saveAppState = useCallback(async (currentState: AppState) => {
    if (!isAuthReady || !userId || isLoading) return; // Don't save if still loading or not ready

    const docRef = getAppStateDocRef();
    if (!docRef) {
      console.warn("Firestore document reference is not available for saving state.");
      return;
    }

    console.log("Firestore: Saving app state:", currentState);
    try {
      await setDoc(docRef, currentState, { merge: true });
      setError(null); // Clear previous save errors
    } catch (err: unknown) {
      console.error("Firestore: Error saving app state:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error saving app state: ${errorMessage}`);
    }
  }, [isAuthReady, userId, isLoading, getAppStateDocRef]);
  
  const debouncedSaveAppState = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (stateToSave: AppState) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveAppState(stateToSave);
      }, 1500); // Save 1.5 seconds after the last change
    };
  }, [saveAppState]);

  // Effect to trigger save when appState changes
   useEffect(() => {
    if (!isLoading && isAuthReady && userId) { // Only save if not loading and authenticated
        debouncedSaveAppState(appState);
    }
  }, [appState, isLoading, isAuthReady, userId, debouncedSaveAppState]);


  return { appState, setAppState, isLoading, error, saveAppState: () => saveAppState(appState) /* for explicit save */ };
};
