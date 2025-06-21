"use client";
import { Wand2, Crown } from 'lucide-react';

interface HeaderProps {
  userId: string | null;
  onUpgrade: () => void;
}

const Header: React.FC<HeaderProps> = ({ userId, onUpgrade }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8 border-b border-gray-300 pb-4">
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 flex items-center">
        <Wand2 className="w-8 h-8 md:w-10 md:h-10 mr-3 text-blue-600" />
        PromptAnimator Pro
      </h1>
      <div className="flex items-center space-x-3 mt-2 sm:mt-0">
        {userId && <span className="text-xs text-gray-500 hidden md:block">UID: {userId}</span>}
        <button
          onClick={onUpgrade}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 transition-colors text-sm font-semibold shadow-sm"
        >
          <Crown className="w-4 h-4" />
          <span>Upgrade Pro</span>
        </button>
      </div>
    </header>
  );
};
export default Header;
