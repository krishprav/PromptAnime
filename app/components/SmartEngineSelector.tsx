"use client";
import { Wand2, Star, Check } from 'lucide-react';
import { AnimationEngineId } from '../lib/config';
import { useAIEngineRecommender } from '../lib/hooks/useAIEngineRecommender';

interface SmartEngineSelectorProps {
  concept: string;
  selectedSubject: string;
  onEngineSelect: (engineId: AnimationEngineId) => void;
  selectedEngines: AnimationEngineId[];
}

const SmartEngineSelector: React.FC<SmartEngineSelectorProps> = ({ concept, selectedSubject, onEngineSelect, selectedEngines }) => {
  const recommendations = useAIEngineRecommender(concept, selectedSubject);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-purple-600" />
          <span>AI-Powered Engine Selection</span>
        </h3>
        <div className="text-sm text-gray-500">
          {selectedEngines.length} selected
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((engine) => {
          const isSelected = selectedEngines.includes(engine.id);
          return (
            <div
              key={engine.id}
              onClick={() => onEngineSelect(engine.id)}
              className={`relative cursor-pointer rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                isSelected
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-500'
                  : engine.isRecommended ? 'border-purple-300 bg-purple-50 hover:border-purple-400' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {engine.isRecommended && (
                <div className={`absolute -top-2.5 -right-2.5 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1
                  ${isSelected ? 'bg-blue-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'}`}>
                  <Star className="w-3 h-3" />
                  <span>AI Pick</span>
                </div>
              )}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${engine.color} text-white shadow-lg`}>
                  {engine.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 text-md">{engine.name}</h4>
                  </div>
                  <p className="text-gray-600 mb-2 text-xs leading-relaxed">{engine.description}</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      engine.complexity === 'Beginner' ? 'bg-green-100 text-green-800' :
                      engine.complexity === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      engine.complexity === 'Advanced' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                    }`}>{engine.complexity}</span>
                    <span className="text-xs text-gray-500">{engine.estimatedTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                      <div
                        className={`h-1.5 rounded-full bg-gradient-to-r ${engine.color} transition-all duration-500`}
                        style={{ width: `${Math.max(10, engine.score * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      {Math.round(engine.score * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SmartEngineSelector;
