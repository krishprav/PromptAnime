"use client";
import React, { useState } from 'react';
import { Lightbulb, Settings, Sparkles, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import SubjectSelector from './SubjectSelector';
import SmartEngineSelector from './SmartEngineSelector';
import { AnimationEngineId, SubjectCategoryId } from '../lib/config';

interface ConceptInputSectionProps {
  concept: string;
  onConceptChange: (value: string) => void;
  selectedSubject: string;
  onSubjectSelect: (subject: SubjectCategoryId) => void;
  selectedEngines: AnimationEngineId[];
  onEngineSelect: (engineId: AnimationEngineId) => void;
  learningLevel: string;
  onLearningLevelChange: (value: string) => void;
  duration: number;
  onDurationChange: (value: number) => void;
  // settings: AppSettings; // If more advanced settings are needed
  // onSettingChange: (key: keyof AppSettings, value: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isAuthReady: boolean;
}

const conceptExamples = [
  { category: 'Mathematics', concepts: ['How calculus reveals the beauty of change and motion', 'The elegant proof of the Pythagorean theorem'] },
  { category: 'Physics', concepts: ['Journey through a black hole: spacetime visualization', 'Quantum entanglement: spooky action at a distance'] },
  { category: 'Computer Science', concepts: ['How a blockchain works: a visual explanation', 'The architecture of a neural network'] },
  { category: 'Algorithms & Data Structures', concepts: ['Visualize Bubble Sort algorithm', 'Interactive Binary Search Tree operations']},
];


const ConceptInputSection: React.FC<ConceptInputSectionProps> = (props) => {
  const {
    concept, onConceptChange, selectedSubject, onSubjectSelect, selectedEngines, onEngineSelect,
    learningLevel, onLearningLevelChange, duration, onDurationChange,
    onGenerate, isGenerating, isAuthReady
  } = props;
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  return (
    <section className="lg:col-span-1 bg-white rounded-xl shadow-xl p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
        <Lightbulb className="w-6 h-6 mr-2 text-yellow-500" />
        Animation Concept
      </h2>
      <div>
        <label htmlFor="concept-input" className="block text-sm font-medium text-gray-700 mb-1.5">
          Describe the educational concept to visualize:
        </label>
        <textarea
          id="concept-input"
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 min-h-[100px] text-sm"
          placeholder="e.g., 'Pythagorean theorem visual proof for high school'"
          value={concept}
          onChange={(e) => onConceptChange(e.target.value)}
        />
      </div>

      <SubjectSelector selectedSubject={selectedSubject} onSubjectSelect={onSubjectSelect} />
      <SmartEngineSelector
        concept={concept}
        selectedSubject={selectedSubject}
        onEngineSelect={onEngineSelect}
        selectedEngines={selectedEngines}
      />

      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            Advanced Settings
          </h3>
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showAdvancedSettings ? 'Hide' : 'Show'}
          </button>
        </div>
        {showAdvancedSettings && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <label htmlFor="learning-level" className="block text-xs font-medium text-gray-700 mb-1">Learning Level:</label>
              <select
                id="learning-level"
                value={learningLevel}
                onChange={(e) => onLearningLevelChange(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label htmlFor="duration" className="block text-xs font-medium text-gray-700 mb-1">Approx. Duration: {duration}s</label>
              <input
                type="range"
                id="duration"
                min="10"
                max="180"
                step="5"
                value={duration}
                onChange={(e) => onDurationChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm accent-blue-600"
              />
            </div>
            {/* Add other settings from AppSettings here if needed */}
          </div>
        )}
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !concept || selectedEngines.length === 0 || !isAuthReady}
        className={`w-full py-3 px-4 rounded-lg text-white font-bold text-md flex items-center justify-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg
          ${isGenerating || !isAuthReady ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 active:scale-95'}`}
      >
        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        <span>{isGenerating ? 'Generating Animation...' : 'Generate Animation'}</span>
      </button>
      
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <h3 className="text-md font-semibold text-gray-900 flex items-center"><BookOpen className="w-5 h-5 mr-2 text-indigo-500" />Concept Examples</h3>
        {conceptExamples.map((cat, index) => (
          <div key={index}>
            <h4 className="font-medium text-gray-800 text-sm mb-1.5">{cat.category}</h4>
            <div className="space-y-1.5">
              {cat.concepts.map((example, idx) => (
                <button key={idx} onClick={() => { onConceptChange(example); onSubjectSelect(cat.category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_') as SubjectCategoryId); }}
                  className="w-full flex items-center p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left group">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                  <p className="text-xs text-gray-700 flex-grow">{example}</p>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-2 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default ConceptInputSection;