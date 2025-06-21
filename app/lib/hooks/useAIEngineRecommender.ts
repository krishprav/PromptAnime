import { useState, useEffect } from 'react';
import { ANIMATION_ENGINES_CONFIG, SUBJECT_CATEGORIES_CONFIG, AnimationEngineId, RecommendedEngine, SubjectCategoryId } from '../config';

export const useAIEngineRecommender = (concept: string, selectedSubject: string): RecommendedEngine[] => {
  const [recommendations, setRecommendations] = useState<RecommendedEngine[]>([]);

  useEffect(() => {
    if (concept) {
      const analyzeAndRecommend = () => {
        const conceptLower = concept.toLowerCase();
        const engineScores: Record<string, number> = {};

        Object.entries(ANIMATION_ENGINES_CONFIG).forEach(([id, engine]) => {
          let score = 0.1; // Base score
          if (selectedSubject && SUBJECT_CATEGORIES_CONFIG[selectedSubject as SubjectCategoryId]?.engines?.includes(id as AnimationEngineId)) {
            score += 0.3;
          }
          engine.bestFor.forEach(bfSubject => {
            if (conceptLower.includes(bfSubject.toLowerCase())) score += 0.15;
          });
          engine.strengths.forEach(strength => {
            if (conceptLower.includes(strength.toLowerCase())) score += 0.1;
          });
          if (conceptLower.includes('simple') && engine.complexity === 'Beginner') score += 0.2;
          if ((conceptLower.includes('advanced') || conceptLower.includes('complex')) && (engine.complexity === 'Advanced' || engine.complexity === 'Expert')) score += 0.2;
          if ((conceptLower.includes('interact') || conceptLower.includes('explore')) && (engine.category === 'Interactive' || engine.outputFormat.includes('Interactive'))) score += 0.25;
          if ((conceptLower.includes('3d') || conceptLower.includes('spatial')) && engine.category.includes('3D')) score += 0.3;
          engineScores[id] = Math.min(score, 1.0);
        });

        const sorted = Object.entries(engineScores)
          .sort(([, a], [, b]) => b - a)
          .map(([id, score]) => ({
            ...ANIMATION_ENGINES_CONFIG[id as AnimationEngineId],
            score,
            isRecommended: score > 0.55 // Adjusted threshold
          }));
        setRecommendations(sorted);
      };
      const debounceTimer = setTimeout(analyzeAndRecommend, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setRecommendations(Object.values(ANIMATION_ENGINES_CONFIG).map(engine => ({ ...engine, score: 0.1, isRecommended: false })));
    }
  }, [concept, selectedSubject]);

  return recommendations;
};
