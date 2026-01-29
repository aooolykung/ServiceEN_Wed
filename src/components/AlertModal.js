import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const AlertModal = ({ 
  isOpen, 
  onClose, 
  title = "แจ้งเตือน", 
  message = "", 
  type = "info", // success, error, warning, info
  duration = 3000
}) => {
  React.useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800'
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-800'
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all scale-100 border-2 ${styles.borderColor}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${styles.borderColor}`}>
          <div className="flex items-center">
            <Icon className={`${styles.iconColor} mr-3`} size={28} />
            <h3 className={`text-xl font-bold ${styles.titleColor}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 ${styles.bgColor}`}>
          <p className="text-gray-800 text-lg whitespace-pre-line leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-lg font-medium"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
