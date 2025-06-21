import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 16, className = '', text }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`w-${size} h-${size} animate-spin text-blue-600`} />
      {text && <p className="text-lg mt-2">{text}</p>}
    </div>
  );
};
export default LoadingSpinner;
