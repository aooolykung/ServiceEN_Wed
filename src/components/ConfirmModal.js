import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "ยืนยันการดำเนินการ", 
  message = "คุณแน่ใจว่าต้องการดำเนินการนี้?", 
  confirmText = "ยืนยัน", 
  cancelText = "ยกเลิก",
  type = "warning" // warning, danger, info
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          borderColor: 'border-red-200'
        };
      case 'warning':
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
          borderColor: 'border-yellow-200'
        };
      case 'info':
        return {
          icon: AlertTriangle,
          iconColor: 'text-blue-600',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          borderColor: 'border-blue-200'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${styles.borderColor}`}>
          <div className="flex items-center">
            <Icon className={`${styles.iconColor} mr-2`} size={20} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-gray-700">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${styles.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
