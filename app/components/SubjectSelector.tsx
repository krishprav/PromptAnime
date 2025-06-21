"use client";
import { Target } from 'lucide-react';
import { SUBJECT_CATEGORIES_CONFIG, SubjectCategoryId } from '../lib/config';

interface SubjectSelectorProps {
  selectedSubject: string;
  onSubjectSelect: (subject: SubjectCategoryId) => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ selectedSubject, onSubjectSelect }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
        <Target className="w-5 h-5 text-blue-600" />
        <span>Subject Category</span>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(SUBJECT_CATEGORIES_CONFIG).map(([key, subject]) => (
          <button
            key={key}
            onClick={() => onSubjectSelect(key as SubjectCategoryId)}
            className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedSubject === key
                ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-8 h-8 ${subject.color} rounded-lg flex items-center justify-center text-white mb-2 shadow-sm`}>
              {subject.icon}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {subject.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
export default SubjectSelector;
