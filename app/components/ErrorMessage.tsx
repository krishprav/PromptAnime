import { AlertTriangle, XCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
  onClear: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClear }) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center justify-between">
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        <span>{message}</span>
      </div>
      <button onClick={onClear} className="text-red-700 hover:text-red-900">
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  );
};
export default ErrorMessage;
