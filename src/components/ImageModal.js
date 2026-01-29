import React from 'react';
import { X } from 'lucide-react';

const ImageModal = ({ image, onClose }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all z-10"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        <img
          src={image}
          alt="รูปภาพขยาย"
          className="max-w-full max-h-screen rounded-lg shadow-xl"
        />
      </div>
    </div>
  );
};

export default ImageModal;
