import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, CalendarPlus, CalendarCheck, User, Clock, Download, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const JobDetailModal = ({ job, onClose, onAddAdditionalImages, onDeleteImage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOpenUpload, setShowOpenUpload] = useState(false);
  const [showCloseUpload, setShowCloseUpload] = useState(false);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openImages = useMemo(() => job?.open_images || job?.openImages || [], [job?.open_images, job?.openImages]);
  const closeImages = useMemo(() => job?.close_images || job?.closeImages || [], [job?.close_images, job?.closeImages]);

  // Add 'type' property to each image so delete function knows which array to delete from
  const allImages = useMemo(() => [
    ...openImages.map(img => ({ ...img, type: 'open' })),
    ...closeImages.map(img => ({ ...img, type: 'close' }))
  ], [openImages, closeImages]);

  // Reset currentImageIndex when allImages changes to prevent out of bounds
  useEffect(() => {
    if (allImages.length > 0 && currentImageIndex >= allImages.length) {
      setCurrentImageIndex(0);
    }
  }, [allImages, currentImageIndex]);

  const goToPreviousImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages]);

  const goToNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages]);

  const downloadImage = (imageUrl, imageName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdditionalImageUpload = (e, imageType) => {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = {
            id: Date.now() + Math.random(),
            name: file.name,
            data: event.target.result,
            type: imageType // 'open' or 'close'
          };
          setAdditionalImages(prev => [...prev, imageData]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveAdditionalImage = (imageId) => {
    setAdditionalImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSaveAdditionalImages = async (imageType) => {
    if (additionalImages.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      await onAddAdditionalImages(job.id, additionalImages, imageType);

      setAdditionalImages([]);
      if (imageType === 'open') {
        setShowOpenUpload(false);
      } else {
        setShowCloseUpload(false);
      }
    } catch (error) {
      console.error('📸 Error saving additional images:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกรูปภาพ: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImageFromJob = (imageId, imageType) => {
    const currentImage = allImages[currentImageIndex];
    if (currentImage && currentImage.id === imageId) {
      // If deleting current image, move to previous or next image
      if (allImages.length > 1) {
        setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);
      }
    }
    onDeleteImage(job.id, imageId, imageType);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'ArrowLeft') {
      goToPreviousImage();
    }
    if (e.key === 'ArrowRight') {
      goToNextImage();
    }
  }, [onClose, goToPreviousImage, goToNextImage]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!job) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {job.machine_name || job.machineName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              โดย: {job.user_name || 'Unknown'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Details */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">ข้อมูลงาน</h3>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CalendarPlus className="mr-2 text-blue-600" size={16} />
                    <span className="font-medium">วันที่เปิดงาน:</span>
                    <span className="ml-2">{formatDate(job.open_date || job.openDate)}</span>
                  </div>

                  {job.close_date && (
                    <div className="flex items-center text-sm">
                      <CalendarCheck className="mr-2 text-green-600" size={16} />
                      <span className="font-medium">วันที่ปิดงาน:</span>
                      <span className="ml-2">{formatDate(job.close_date)}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm">
                    <User className="mr-2 text-purple-600" size={16} />
                    <span className="font-medium">ผู้รับผิดชอบ:</span>
                    <span className="ml-2">{job.user_name || 'Unknown'}</span>
                  </div>

                  {job.electrical_responsible && (
                    <div className="flex items-center text-sm">
                      <User className="mr-2 text-yellow-600" size={16} />
                      <span className="font-medium">ผู้รับผิดชอบระบบไฟฟ้า:</span>
                      <span className="ml-2">{job.electrical_responsible}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 text-orange-600" size={16} />
                    <span className="font-medium">สถานะ:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${job.status === 'open'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                      }`}>
                      {job.status === 'open' ? 'เปิด' : 'ปิดแล้ว'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Thumbnails */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg text-gray-800">รูปภาพ</h3>
                  <div className="flex gap-2">
                    {/* Always show open image upload button */}
                    <button
                      onClick={() => setShowOpenUpload(true)}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors flex items-center"
                    >
                      <CalendarPlus className="mr-1" size={12} />
                      เพิ่มรูปเปิดงาน
                    </button>
                    {/* Show close image upload button only for closed jobs */}
                    {job.status === 'closed' && (
                      <button
                        onClick={() => setShowCloseUpload(true)}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors flex items-center"
                      >
                        <CalendarCheck className="mr-1" size={12} />
                        เพิ่มรูปปิดงาน
                      </button>
                    )}
                  </div>
                </div>

                {openImages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      รูปภาพการเปิดงาน ({openImages.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {openImages.map((img, index) => (
                        <div
                          key={img.id || index}
                          className="relative cursor-pointer group"
                          onClick={() => {
                            setCurrentImageIndex(index);
                          }}
                        >
                          <img
                            src={img.data}
                            alt={img.name}
                            className="w-full h-20 object-cover rounded border-2 border-transparent group-hover:border-blue-500 transition-colors"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              ดู
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {closeImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      รูปภาพการปิดงาน ({closeImages.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {closeImages.map((img, index) => (
                        <div
                          key={img.id || index}
                          className="relative cursor-pointer group"
                          onClick={() => {
                            setCurrentImageIndex(openImages.length + index);
                          }}
                        >
                          <img
                            src={img.data}
                            alt={img.name}
                            className="w-full h-20 object-cover rounded border-2 border-transparent group-hover:border-green-500 transition-colors"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              ดู
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {openImages.length === 0 && closeImages.length === 0 && (
                  <p className="text-gray-500 text-sm">ไม่มีรูปภาพ</p>
                )}
              </div>
            </div>

            {/* Image Viewer */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">ดูรูปภาพ</h3>

              {allImages.length > 0 && allImages[currentImageIndex] ? (
                <div className="relative">
                  <div className="relative bg-white rounded-lg overflow-hidden" style={{ height: '400px' }}>
                    <img
                      src={allImages[currentImageIndex].data.startsWith('blob:') ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuC4uC4uC44uC4uC4LguC4uC4uC4uC4uC4uC4uC4uC48L3RleHQ+PC9zdmc+' : allImages[currentImageIndex].data}
                      alt={allImages[currentImageIndex].name || 'รูปภาพ'}
                      className="w-full h-full object-contain"
                    />

                    {/* Navigation Buttons */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={goToPreviousImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={goToNextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}

                    {/* Download Button */}
                    <button
                      onClick={() => {
                        const currentImage = allImages[currentImageIndex];
                        if (currentImage && currentImage.data) {
                          downloadImage(currentImage.data, currentImage.name || 'รูปภาพ');
                        }
                      }}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                      title="ดาวน์โหลดรูปภาพ"
                    >
                      <Download size={16} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        const currentImage = allImages[currentImageIndex];
                        if (currentImage && currentImage.id) {
                          handleDeleteImageFromJob(currentImage.id, currentImage.type);
                        }
                      }}
                      className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      title="ลบรูปภาพ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Image Info */}
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-700 font-medium">
                      {allImages[currentImageIndex]?.name || 'รูปภาพ'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {allImages[currentImageIndex]?.type === 'open' ? 'รูปภาพการเปิดงาน' : 'รูปภาพการปิดงาน'} •
                      รูปที่ {currentImageIndex + 1} จาก {allImages.length}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>ไม่มีรูปภาพที่จะแสดง</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            ใช้ปุ่มลูกศรซ้าย/ขวาหรือคลิกที่รูปภาพเพื่อดูรูปถัดไป | ESC เพื่อปิด
          </p>
        </div>
      </div>

      {/* Open Image Upload Modal */}
      {showOpenUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-green-700">เพิ่มรูปภาพการเปิดงาน</h3>
                <button
                  onClick={() => setShowOpenUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกรูปภาพการเปิดงาน
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleAdditionalImageUpload(e, 'open')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {additionalImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    รูปภาพที่เลือก ({additionalImages.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {additionalImages.map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.data}
                          alt={img.name}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => handleRemoveAdditionalImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowOpenUpload(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isUploading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleSaveAdditionalImages('open')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={additionalImages.length === 0 || isUploading}
                >
                  {isUploading ? 'กำลังบันทึก...' : 'บันทึกรูปเปิดงาน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Image Upload Modal */}
      {showCloseUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-red-700">เพิ่มรูปภาพการปิดงาน</h3>
                <button
                  onClick={() => setShowCloseUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกรูปภาพการปิดงาน
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleAdditionalImageUpload(e, 'close')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {additionalImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    รูปภาพที่เลือก ({additionalImages.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {additionalImages.map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.data}
                          alt={img.name}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => handleRemoveAdditionalImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCloseUpload(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isUploading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleSaveAdditionalImages('close')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={additionalImages.length === 0 || isUploading}
                >
                  {isUploading ? 'กำลังบันทึก...' : 'บันทึกรูปปิดงาน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailModal;
