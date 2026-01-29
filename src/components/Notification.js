import React from 'react';
import { CheckCircle, Info, X } from 'lucide-react';

const Notification = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-blue-600';
  const Icon = type === 'success' ? CheckCircle : Info;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in flex items-center`}>
      <Icon className="mr-2" size={20} />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 hover:opacity-75 transition-opacity"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Notification;
