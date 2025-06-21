// app/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';

import { useLocalStorageAppState } from './lib/hooks/useLocalStorageAppState';
import { generateAIAnimation, refineAICode, getAIAssistSuggestions } from './lib/aiService';
import {
  AnimationEngineId,
  AppState,
  SubjectCategoryId,
  GeneratedAnimationsState,
  ANIMATION_ENGINES_CONFIG
} from './lib/config';
import { useAIEngineRecommender } from './lib/hooks/useAIEngineRecommender';

import Header from './components/Header';
import ConceptInputSection from './components/ConceptInputSection';
import OutputSection from './components/OutputSection';
import LoadingSpinner from './components/LoadingSpinner'; 
import ErrorMessage from './components/ErrorMessage';

export default function PromptAnimatorProPage() {
  const {
    appState,
    setAppState,
    isLoading: isAppStateLoading,
    error: storageError,
    saveAppState: saveStateToStorage
  } = useLocalStorageAppState();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // const isAuthReady = true; 

  useEffect(() => {
    if (!isAppStateLoading) {
      console.log("App state loaded from localStorage or defaults.");
    }
  }, [isAppStateLoading]);

  const { concept, selectedSubject, selectedEngines, generatedAnimations, activeTab, learningLevel, duration } = appState;

  const updateState = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setAppState(prev => ({ ...prev, [key]: value }));
  }, [setAppState]);

  const handleGenerateAnimation = async () => {
    if (!concept || selectedEngines.length === 0) {
      setGlobalError('Please enter a concept and select at least one animation engine.');
      return;
    }
    setGlobalError(null);
    setIsGenerating(true);

    const updatedAnimations: GeneratedAnimationsState = { ...generatedAnimations };
    selectedEngines.forEach(engineId => {
      updatedAnimations[engineId] = {
        code: '', status: 'pending', engine: engineId,
        generatedAt: new Date().toISOString(), analysis: 'Generating...'
      };
    });
    updateState('generatedAnimations', updatedAnimations);
    if (selectedEngines.length > 0 && (!activeTab || !selectedEngines.includes(activeTab as AnimationEngineId))) {
      updateState('activeTab', selectedEngines[0]);
    }

    for (const engineId of selectedEngines) {
      const engineConfig = ANIMATION_ENGINES_CONFIG[engineId];
      try {
        const { code, analysis } = await generateAIAnimation(concept, engineId, learningLevel, duration);
        setAppState(prev => ({
          ...prev,
          generatedAnimations: {
            ...prev.generatedAnimations,
            [engineId]: { code, analysis, status: 'success', generatedAt: new Date().toISOString(), engine: engineId }
          }
        }));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setAppState(prev => ({
          ...prev,
          generatedAnimations: {
            ...prev.generatedAnimations,
            [engineId]: { code: '', status: 'error', error: errorMessage, generatedAt: new Date().toISOString(), engine: engineId, analysis: `Error: ${errorMessage}` }
          }
        }));
        console.error(`Error generating animation for ${engineConfig?.name || engineId}:`, error);
        setGlobalError(`Error for ${engineConfig?.name || engineId}: ${errorMessage}`);
      }
    }
    setIsGenerating(false);
  };

  const handleCodeChange = (engineId: AnimationEngineId | string, newCode: string) => {
    const currentEngineAnimation = generatedAnimations[engineId] || { code: '', status: 'pending', engine: engineId, generatedAt: new Date().toISOString() };
    updateState('generatedAnimations', {
      ...generatedAnimations,
      [engineId]: { ...currentEngineAnimation, code: newCode, modifiedAt: new Date().toISOString(), status: 'success' }
    });
  };

  const handleAIRefineCode = async (engineId: AnimationEngineId | string, codeToRefine: string, language: string) => {
    if (!codeToRefine || !engineId) {
      setGlobalError('No code to refine or no active tab.');
      return;
    }
    setGlobalError(null);
    setIsGenerating(true);
    const engineConfig = ANIMATION_ENGINES_CONFIG[engineId as AnimationEngineId];
    try {
      const { code: refinedCode, analysis } = await refineAICode(codeToRefine, language);
      const currentEngineAnimation = generatedAnimations[engineId] || { code: '', status: 'pending', engine: engineId, generatedAt: new Date().toISOString() };
      updateState('generatedAnimations', {
        ...generatedAnimations,
        [engineId]: {
          ...currentEngineAnimation, code: refinedCode, analysis, status: 'success',
          modifiedAt: new Date().toISOString(),
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error refining code:", error);
      setGlobalError(`Failed to refine code for ${engineConfig?.name || engineId}: ${errorMessage}`);
      const currentEngineAnimation = generatedAnimations[engineId] || { code: '', status: 'pending', engine: engineId, generatedAt: new Date().toISOString() };
      updateState('generatedAnimations', {
        ...generatedAnimations,
        [engineId]: { ...currentEngineAnimation, status: 'error', error: errorMessage, modifiedAt: new Date().toISOString(), analysis: `Refinement Error: ${errorMessage}` }
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAIAssist = async (code: string, lang: string): Promise<Array<{title: string; description: string}>> => {
      return getAIAssistSuggestions(code, lang);
  };

  const toggleEngineSelection = (engineId: AnimationEngineId) => {
    const newSelectedEngines = selectedEngines.includes(engineId)
      ? selectedEngines.filter(id => id !== engineId)
      : [...selectedEngines, engineId];
    updateState('selectedEngines', newSelectedEngines);

    if (newSelectedEngines.length > 0 && (!activeTab || !newSelectedEngines.includes(activeTab as AnimationEngineId))) {
      updateState('activeTab', newSelectedEngines[0]);
    } else if (newSelectedEngines.length === 0) {
      updateState('activeTab', '');
    }
  };
  
  const handleSaveState = async () => { 
    saveStateToStorage(); 
    setGlobalError("Current state saved to your browser's local storage!");
    setTimeout(() => setGlobalError(null), 3000);
  };

  const handleUpgradeToPro = () => {
    setGlobalError('This is a local version. Pro features are simulated or not applicable.');
    setTimeout(() => setGlobalError(null), 3000);
  };
  
  const recommendedEnginesFromHook = useAIEngineRecommender(concept, selectedSubject);
  useEffect(() => {
    if (isAppStateLoading) return;

    const recommendedIds = recommendedEnginesFromHook
        .filter(e => e.isRecommended)
        .map(e => e.id);

    if (recommendedIds.length > 0) {
      const newSelected = recommendedIds.slice(0, Math.min(1, recommendedIds.length)); 
      if (appState.selectedEngines.length === 0 && JSON.stringify(newSelected) !== JSON.stringify(appState.selectedEngines)) {
          updateState('selectedEngines', newSelected);
          if (newSelected.length > 0) {
              updateState('activeTab', newSelected[0]);
          }
      }
    }
  }, [concept, selectedSubject, recommendedEnginesFromHook, isAppStateLoading, appState.selectedEngines, updateState]);


  if (isAppStateLoading) { 
    return ( // <<< THIS IS LINE 191 (approximately)
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex flex-col items-center justify-center p-6 text-gray-700">
        <LoadingSpinner size={16} text={"Loading Animator..."} />
      </div>
    );
  }
  
  const displayError = globalError || storageError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 font-sans p-4 md:p-6">
      <Header userId={null} onUpgrade={handleUpgradeToPro} /> {/* userId is null */}
      <ErrorMessage message={displayError} onClear={() => { setGlobalError(null); /* setStorageError to null if hook allows */ }} />
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <ConceptInputSection
          concept={concept}
          onConceptChange={(value) => updateState('concept', value)}
          selectedSubject={selectedSubject}
          onSubjectSelect={(value) => updateState('selectedSubject', value as SubjectCategoryId)}
          selectedEngines={selectedEngines}
          onEngineSelect={toggleEngineSelection}
          learningLevel={learningLevel}
          onLearningLevelChange={(value) => updateState('learningLevel', value)}
          duration={duration}
          onDurationChange={(value) => updateState('duration', value)}
          onGenerate={handleGenerateAnimation}
          isGenerating={isGenerating}
          isAuthReady={true} 
        />
        <OutputSection
          selectedEngines={selectedEngines}
          generatedAnimations={generatedAnimations}
          activeTab={activeTab}
          onTabChange={(tabId) => updateState('activeTab', tabId)}
          onCodeChange={handleCodeChange}
          onAIRefineCode={handleAIRefineCode}
          onAIAssist={handleAIAssist}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          isGenerating={isGenerating}
          onSaveToCloud={handleSaveState} 
          isAuthReady={true}
          appStateLoading={isAppStateLoading}
        />
      </main>
      <footer className="mt-10 md:mt-12 text-center text-gray-600 text-xs">
        <p>&copy; {new Date().getFullYear()} PromptAnimator Pro. AI-powered animations.</p>
        <p>Data is saved in your browser&apos;s local storage.</p>
      </footer>
    </div>
  );
}