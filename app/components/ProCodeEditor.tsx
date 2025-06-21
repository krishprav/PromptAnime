"use client";
import React, { useState, useRef } from 'react';
import { Code, Sparkles, Loader2, XCircle, Info, Lightbulb } from 'lucide-react';
import { ANIMATION_ENGINES_CONFIG, AnimationEngineId } from '../lib/config';

interface ProCodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language: string; // engineId
  isLoading: boolean; // For AI generation/refinement
  onAIAssist: (code: string, lang: string) => Promise<Array<{title: string; description: string}>>;
  onAIRefineCode?: (code: string, lang: string) => Promise<void>; // Should update code via onChange
  analysis?: string;
}

const ProCodeEditor: React.FC<ProCodeEditorProps> = ({ code, onChange, language, isLoading, onAIAssist, analysis }) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<Array<{title: string; description: string}>>([]);
  // const [isRefining, setIsRefining] = useState(false); // Separate from main isLoading for refine button
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleAIAssistClick = async () => {
    if (showAIPanel) {
      setShowAIPanel(false);
      return;
    }
    setShowAIPanel(true);
    setIsSuggesting(true);
    try {
      const suggestions = await onAIAssist(code, language);
      setAISuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      setAISuggestions([{ title: "Error", description: "Could not fetch AI suggestions." }]);
    } finally {
      setIsSuggesting(false);
    }
  };

  // const handleRefineClick = async () => {
  //   if (code) {
  //     setIsRefining(true);
  //     try {
  //       await onAIRefineCode(code, language); // This should trigger onChange from parent
  //     } catch (error) {
  //       // Error should be handled by parent and displayed as globalError
  //       console.error("Refinement error in ProCodeEditor:", error);
  //     } finally {
  //       setIsRefining(false);
  //     }
  //   }
  // };

  const currentEngineConfig = ANIMATION_ENGINES_CONFIG[language as AnimationEngineId];

  return (
    <div className="border rounded-xl overflow-hidden shadow-lg bg-white">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Code className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-700">{currentEngineConfig?.name || language.toUpperCase()} Editor</span>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && ( // isLoading is for initial generation
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-blue-600">
                AI Generating...
              </span>
            </div>
          )}
          <button
            onClick={handleAIAssistClick}
            disabled={isSuggesting || isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm disabled:opacity-50"
          >
            {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>AI Assist</span>
          </button>
        </div>
      </div>

      <div className="relative flex flex-col md:flex-row">
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-96 md:h-[500px] p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-gray-100"
          placeholder={`// AI will generate optimized ${language} code here...\n// Edit and customize as needed`}
          style={{ fontFamily: '"Fira Code", "JetBrains Mono", Consolas, Monaco, "Courier New", monospace' }}
          spellCheck="false"
        />
        {showAIPanel && (
          <div className="md:w-1/3 w-full h-96 md:h-[500px] bg-gray-50 border-l border-gray-200 shadow-lg p-4 overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">AI Suggestions</h4>
              <button onClick={() => setShowAIPanel(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {isSuggesting ? (
              <div className="text-center py-8"><Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-500"/> <p className="text-sm text-gray-500 mt-2">Fetching suggestions...</p></div>
            ) : aiSuggestions.length > 0 ? (
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-sm font-semibold text-purple-700 mb-1">{suggestion.title}</div>
                    <div className="text-xs text-gray-600">{suggestion.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm mt-8">
                <Info className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                No suggestions available.
              </div>
            )}
          </div>
        )}
      </div>
      {analysis && (
        <div className="p-4 border-t bg-gray-50">
          <h5 className="font-semibold text-sm text-gray-700 mb-1 flex items-center"><Lightbulb className="w-4 h-4 mr-2 text-yellow-500"/>AI Analysis:</h5>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{analysis}</p>
        </div>
      )}
    </div>
  );
};
export default ProCodeEditor;
