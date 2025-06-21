import React from 'react';
import {
  Brain, Zap, Sparkles, TrendingUp, Atom, BarChart3, Palette, Film,
  Calculator, Layers, Telescope, Languages, BookOpen, Cpu, Dna, Beaker
} from 'lucide-react';

export const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash-latest"; 

export const DEFAULT_OPENROUTER_MODEL = "mistralai/devstral-small:free";


export const ANIMATION_ENGINES_CONFIG = {
  manim: {
    id: 'manim' as const,
    name: 'Manim Community',
    icon: React.createElement(Brain, { className: "w-5 h-5" }),
    description: 'Mathematical precision animations',
    category: 'Mathematical',
    strengths: ['LaTeX integration', 'Mathematical proofs', 'Scientific notation', 'Graph theory'],
    color: 'from-blue-500 to-indigo-600',
    estimatedTime: '15-45s',
    complexity: 'Advanced',
    outputFormat: 'Python Code (Local Render)',
    bestFor: ['Mathematics', 'Physics', 'Engineering', 'Computer Science', 'Algorithms & Data Structures'],
    aiModel: DEFAULT_OPENROUTER_MODEL
  },
  p5js: {
    id: 'p5js' as const,
    name: 'p5.js Interactive',
    icon: React.createElement(Zap, { className: "w-5 h-5" }),
    description: 'Creative coding & interactivity',
    category: 'Interactive',
    strengths: ['Real-time interaction', 'Data visualization', 'Generative art', 'User engagement'],
    color: 'from-pink-500 to-rose-600',
    estimatedTime: '5-15s',
    complexity: 'Intermediate',
    outputFormat: 'JavaScript Code (Interactive Web)',
    bestFor: ['Data Science', 'Art', 'Psychology', 'Biology', 'Algorithms & Data Structures'],
    aiModel: DEFAULT_OPENROUTER_MODEL
  },
  threejs: {
    id: 'threejs' as const,
    name: 'Three.js 3D',
    icon: React.createElement(Sparkles, { className: "w-5 h-5" }),
    description: 'Immersive 3D experiences',
    category: '3D Visualization',
    strengths: ['Spatial relationships', '3D models', 'VR/AR ready', 'Molecular structures'],
    color: 'from-purple-500 to-violet-600',
    estimatedTime: '20-60s',
    complexity: 'Advanced',
    outputFormat: 'JavaScript Code (3D Interactive)',
    bestFor: ['Chemistry', 'Anatomy', 'Architecture', 'Astronomy', 'Algorithms & Data Structures'],
    aiModel: DEFAULT_OPENROUTER_MODEL
  },
  gsap: {
    id: 'gsap' as const,
    name: 'GSAP Timeline',
    icon: React.createElement(TrendingUp, { className: "w-5 h-5" }),
    description: 'Professional motion graphics',
    category: 'Motion Graphics',
    strengths: ['Smooth transitions', 'Timeline control', 'SVG animation', 'Professional polish'],
    color: 'from-green-500 to-emerald-600',
    estimatedTime: '10-30s',
    complexity: 'Intermediate',
    outputFormat: 'HTML/CSS/JS (Web Animation)',
    bestFor: ['Presentations', 'Marketing', 'Storytelling', 'History'],
    aiModel: DEFAULT_OPENROUTER_MODEL
  },
  babylonjs: {
    id: 'babylonjs' as const,
    name: 'Babylon.js Engine',
    icon: React.createElement(Atom, { className: "w-5 h-5" }),
    description: 'High-performance 3D engine',
    category: '3D Simulation',
    strengths: ['Physics simulation', 'WebXR support', 'Real-time rendering', 'Complex scenes'],
    color: 'from-orange-500 to-red-600',
    estimatedTime: '30-90s',
    complexity: 'Expert',
    outputFormat: 'JavaScript Code (3D Simulation)',
    bestFor: ['Physics', 'Engineering', 'Gaming', 'Simulations'],
    aiModel: DEFAULT_OPENROUTER_MODEL
  },
  d3js: {
    id: 'd3js' as const,
    name: 'D3.js Data Viz',
    icon: React.createElement(BarChart3, { className: "w-5 h-5" }),
    description: 'Data-driven visualizations',
    category: 'Data Visualization',
    strengths: ['Statistical charts', 'Data binding', 'Interactive graphs', 'Real-time updates'],
    color: 'from-cyan-500 to-blue-600',
    estimatedTime: '8-25s',
    complexity: 'Intermediate',
    outputFormat: 'JavaScript Code (Interactive Chart)',
    bestFor: ['Statistics', 'Economics', 'Research', 'Analytics', 'Algorithms & Data Structures'],
    aiModel: DEFAULT_OPENROUTER_MODEL
  },
  lottie: {
    id: 'lottie' as const,
    name: 'Lottie Animations',
    icon: React.createElement(Palette, { className: "w-5 h-5" }),
    description: 'Vector-based animations',
    category: 'Vector Animation',
    strengths: ['Scalable graphics', 'Lightweight files', 'Cross-platform', 'Designer-friendly'],
    color: 'from-teal-500 to-green-600',
    estimatedTime: '5-20s',
    complexity: 'Beginner',
    outputFormat: 'JSON (Vector Animation)',
    bestFor: ['UI/UX', 'Mobile Apps', 'Web Design', 'Icons'],
    aiModel: DEFAULT_OPENROUTER_MODEL
  },
  anime: {
    id: 'anime' as const,
    name: 'Anime.js',
    icon: React.createElement(Film, { className: "w-5 h-5" }),
    description: 'Lightweight JavaScript animation',
    category: 'Web Animation',
    strengths: ['CSS animations', 'DOM manipulation', 'Timeline sync', 'Performance optimized'],
    color: 'from-yellow-500 to-orange-600',
    estimatedTime: '3-12s',
    complexity: 'Beginner',
    outputFormat: 'JavaScript Code (CSS Animation)',
    bestFor: ['Web Development', 'UI Design', 'Micro-interactions', 'Loading states'],
    aiModel: DEFAULT_OPENROUTER_MODEL
  }
};
export type AnimationEngineId = keyof typeof ANIMATION_ENGINES_CONFIG;
export type AnimationEngineConfigType = typeof ANIMATION_ENGINES_CONFIG[AnimationEngineId]; // Renamed to avoid conflict
export type RecommendedEngine = AnimationEngineConfigType & {
  score: number;
  isRecommended: boolean;
};

export const SUBJECT_CATEGORIES_CONFIG = {
  mathematics: {
    name: 'Mathematics',
    icon: React.createElement(Calculator, { className: "w-6 h-6" }),
    color: 'bg-blue-500',
    engines: ['manim', 'p5js', 'd3js'] as AnimationEngineId[],
    keywords: ['equation', 'formula', 'theorem', 'proof', 'calculus', 'algebra', 'geometry']
  },
  physics: {
    name: 'Physics',
    icon: React.createElement(Atom, { className: "w-6 h-6" }),
    color: 'bg-purple-500',
    engines: ['manim', 'threejs', 'babylonjs', 'p5js'] as AnimationEngineId[],
    keywords: ['force', 'energy', 'wave', 'particle', 'quantum', 'mechanics', 'electromagnetic']
  },
  chemistry: {
    name: 'Chemistry',
    icon: React.createElement(Beaker, { className: "w-6 h-6" }),
    color: 'bg-green-500',
    engines: ['threejs', 'babylonjs', 'p5js', 'manim'] as AnimationEngineId[],
    keywords: ['molecule', 'atom', 'reaction', 'bond', 'compound', 'element', 'periodic']
  },
  biology: {
    name: 'Biology',
    icon: React.createElement(Dna, { className: "w-6 h-6" }),
    color: 'bg-emerald-500',
    engines: ['threejs', 'p5js', 'gsap', 'manim'] as AnimationEngineId[],
    keywords: ['cell', 'dna', 'organism', 'evolution', 'ecosystem', 'protein', 'genetics']
  },
  computer_science: {
    name: 'Computer Science',
    icon: React.createElement(Cpu, { className: "w-6 h-6" }),
    color: 'bg-indigo-500',
    engines: ['p5js', 'manim', 'd3js', 'threejs', 'gsap'] as AnimationEngineId[],
    keywords: ['programming', 'machine learning', 'ai', 'network', 'cybersecurity', 'software']
  },
  algorithms_data_structures: { // New Vertical
    name: 'Algorithms & Data Structures',
    icon: React.createElement(Layers, { className: "w-6 h-6" }),
    color: 'bg-sky-500',
    engines: ['p5js', 'manim', 'd3js', 'threejs', 'gsap'] as AnimationEngineId[],
    keywords: ['sort', 'tree', 'graph', 'array', 'linked list', 'recursion', 'dynamic programming', 'pathfinding', 'search', 'stack', 'queue', 'heap']
  },
  astronomy: {
    name: 'Astronomy',
    icon: React.createElement(Telescope, { className: "w-6 h-6" }),
    color: 'bg-violet-500',
    engines: ['threejs', 'babylonjs', 'gsap', 'manim'] as AnimationEngineId[],
    keywords: ['planet', 'star', 'galaxy', 'orbit', 'universe', 'cosmos', 'space']
  },
  data_science: {
    name: 'Data Science',
    icon: React.createElement(BarChart3, { className: "w-6 h-6" }),
    color: 'bg-cyan-500',
    engines: ['d3js', 'p5js', 'manim'] as AnimationEngineId[],
    keywords: ['statistics', 'analysis', 'visualization', 'correlation', 'regression', 'dataset', 'plot']
  },
  language: {
    name: 'Language Arts',
    icon: React.createElement(Languages, { className: "w-6 h-6" }),
    color: 'bg-rose-500',
    engines: ['gsap', 'lottie', 'anime'] as AnimationEngineId[],
    keywords: ['grammar', 'literature', 'writing', 'poetry', 'narrative', 'linguistics']
  },
    history: {
    name: 'History',
    icon: React.createElement(BookOpen, { className: "w-6 h-6" }),
    color: 'bg-amber-500',
    engines: ['gsap', 'lottie', 'anime', 'd3js'] as AnimationEngineId[],
    keywords: ['timeline', 'event', 'historical figure', 'era', 'ancient', 'modern']
  },
  economics: {
    name: 'Economics',
    icon: React.createElement(TrendingUp, { className: "w-6 h-6" }),
    color: 'bg-lime-500',
    engines: ['d3js', 'gsap', 'p5js'] as AnimationEngineId[],
    keywords: ['supply', 'demand', 'market', 'gdp', 'inflation', 'trade', 'finance']
  }
};
export type SubjectCategoryId = keyof typeof SUBJECT_CATEGORIES_CONFIG;


export interface MessageType {
  type: 'success' | 'error' | 'info';
  text: string;
}
export interface GeneratedAnimation {
  code: string;
  status: 'success' | 'error' | 'pending';
  generatedAt?: string;
  modifiedAt?: string;
  engine: AnimationEngineId | string;
  error?: string;
  analysis?: string;
}
export type GeneratedAnimationsState = Record<string, GeneratedAnimation>;

export interface AppSettings {
  voiceover: boolean;
  subtitles: boolean;
  interactivity: string;
  colorScheme: string;
  exportFormat: string;
  quality: string;
}

export interface AppState {
  concept: string;
  selectedSubject: string;
  selectedEngines: AnimationEngineId[];
  generatedAnimations: GeneratedAnimationsState;
  activeTab: AnimationEngineId | string;
  learningLevel: string;
  duration: number;
  settings: AppSettings;
}

export const API_TIMEOUT_MS = 90000; 