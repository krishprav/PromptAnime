"use client";
import React from 'react';
import { Eye, Sparkles, Loader2, Check, AlertTriangle, Download, Save } from 'lucide-react';
import MultiFormatPreview from './MultiFormatPreview';
import ProCodeEditor from './ProCodeEditor';
import { AnimationEngineId, GeneratedAnimationsState, ANIMATION_ENGINES_CONFIG } from '../lib/config';
import { triggerDownload } from '../lib/utils';

interface OutputSectionProps {
  selectedEngines: AnimationEngineId[];
  generatedAnimations: GeneratedAnimationsState;
  activeTab: AnimationEngineId | string;
  onTabChange: (tabId: AnimationEngineId | string) => void;
  onCodeChange: (engineId: AnimationEngineId | string, newCode: string) => void;
  onAIRefineCode: (engineId: AnimationEngineId | string, codeToRefine: string, language: string) => Promise<void>;
  onAIAssist: (code: string, lang: string) => Promise<Array<{title: string; description: string}>>;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isGenerating: boolean; // Global generating state
  onSaveToCloud: () => void;
  isAuthReady: boolean;
  appStateLoading: boolean; // From useFirestoreAppState
}

const OutputSection: React.FC<OutputSectionProps> = (props) => {
  const {
    selectedEngines, generatedAnimations, activeTab, onTabChange, onCodeChange,
    onAIRefineCode, onAIAssist, isPlaying, onTogglePlay, isGenerating,
    onSaveToCloud, isAuthReady, appStateLoading
  } = props;

  const currentAnimation = activeTab ? generatedAnimations[activeTab] : null;

  const handleDownloadCode = () => {
    if (currentAnimation?.code && activeTab) {
      const filename = `animation_${activeTab}`;
      let mimeType = 'application/octet-stream'; let extension = 'txt';
      if (activeTab === 'manim') { extension = 'py'; mimeType = 'text/x-python'; }
      else if (activeTab === 'gsap') { extension = 'html'; mimeType = 'text/html'; }
      else if (activeTab === 'lottie') { extension = 'json'; mimeType = 'application/json'; }
      else { extension = 'js'; mimeType = 'application/javascript'; }
      triggerDownload(`${filename}.${extension}`, currentAnimation.code, mimeType);
    }
  };
  
  const isCurrentEngineGenerating = isGenerating && currentAnimation?.status === 'pending';

  return (
    <section className="lg:col-span-2 bg-white rounded-xl shadow-xl p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
        <Eye className="w-6 h-6 mr-2 text-green-500" />
        Animation Output & Editor
      </h2>
      <div className="bg-gray-100 rounded-lg p-2 flex flex-wrap justify-between items-center mb-4 border">
        <div className="flex space-x-1 overflow-x-auto py-1 custom-scrollbar">
          {selectedEngines.length === 0 && <span className="text-gray-500 px-3 py-1.5 text-sm">Select an engine</span>}
          {selectedEngines.map((engineId) => {
            const engine = ANIMATION_ENGINES_CONFIG[engineId];
            const animStatus = generatedAnimations[engineId]?.status;
            return (
              <button
                key={engineId}
                onClick={() => onTabChange(engineId)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 font-medium rounded-md transition-all text-xs whitespace-nowrap
                  ${activeTab === engineId ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              >
                {React.cloneElement(engine.icon, {className: "w-4 h-4"})}
                <span>{engine.name}</span>
                {animStatus === 'success' && <Check className="w-3 h-3 text-green-300" />}
                {animStatus === 'error' && <AlertTriangle className="w-3 h-3 text-red-300" />}
                {animStatus === 'pending' && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
              </button>
            );
          })}
        </div>
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button onClick={onSaveToCloud} disabled={!isAuthReady || appStateLoading} title="Save current state to cloud"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /><span>Save</span>
          </button>
        </div>
      </div>

      {!currentAnimation && !isGenerating && selectedEngines.length > 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-600">Click &quot;Generate Animation&quot; to begin!</p>
          <p className="text-sm text-gray-500">Your creation will appear here.</p>
        </div>
      )}
      {isGenerating && (!currentAnimation || currentAnimation?.status === 'pending') && (
         <div className="text-center p-8 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
           <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
           <p className="text-lg font-semibold text-blue-600">AI is Crafting Your Animation...</p>
           <p className="text-sm text-blue-500">Patience, great things take time.</p>
         </div>
      )}

      {currentAnimation && activeTab && (
        <div className="space-y-6">
          <MultiFormatPreview
            engine={activeTab}
            code={currentAnimation.code}
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
          />
          <div>
            <ProCodeEditor
              code={currentAnimation.code || ''}
              onChange={(newCode) => onCodeChange(activeTab, newCode)}
              language={activeTab as string}
              isLoading={isCurrentEngineGenerating}
              onAIAssist={onAIAssist}
              onAIRefineCode={(codeToRefine, lang) => onAIRefineCode(activeTab, codeToRefine, lang)}
              analysis={currentAnimation.analysis}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadCode}
                disabled={!currentAnimation?.code}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Download className="w-4 h-4" /><span>Download Code</span>
              </button>
              <button
                onClick={() => currentAnimation.code && onAIRefineCode(activeTab, currentAnimation.code, activeTab as string)}
                disabled={isGenerating || !currentAnimation?.code} // Disable if global generating or no code
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium
                  ${isGenerating || !currentAnimation?.code ? 'bg-purple-300 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                <Sparkles className="w-4 h-4" /><span>AI Refine Code</span>
              </button>
            </div>
            {currentAnimation.status === 'error' && currentAnimation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
                <strong className="font-semibold">Generation Error:</strong> {currentAnimation.error}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
export default OutputSection;