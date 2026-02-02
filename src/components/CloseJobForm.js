import React, { useState } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';

const CloseJobForm = ({ jobs, onSubmit, disabled }) => {
  const [formData, setFormData] = useState({
    jobId: '',
    closeDate: new Date().toISOString().split('T')[0],
    closeImages: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Compress image for iOS compatibility
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale down if too large
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG
          const compressedData = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedData);
        };
        img.onerror = () => {
          // If image fails to load, use original data
          resolve(e.target.result);
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          // Compress image for iOS
          const compressedData = await compressImage(file, 800, 0.6);

          if (compressedData) {
            const imageData = {
              id: Date.now() + Math.random(),
              name: file.name,
              data: compressedData
            };
            setFormData(prev => ({
              ...prev,
              closeImages: [...prev.closeImages, imageData]
            }));
          }
        } catch (err) {
          console.error('Error processing image:', err);
          // Fallback to FileReader without compression
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageData = {
              id: Date.now() + Math.random(),
              name: file.name,
              data: event.target.result
            };
            setFormData(prev => ({
              ...prev,
              closeImages: [...prev.closeImages, imageData]
            }));
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      closeImages: prev.closeImages.filter(img => img.id !== imageId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.jobId) {
      alert('กรุณาเลือกงานที่ต้องการปิด');
      return;
    }

    // Get the first image file for Google Drive upload
    const imageFile = formData.closeImages.length > 0 ? formData.closeImages[0] : null;

    onSubmit(formData.jobId, {
      closeDate: formData.closeDate,
      closeImages: formData.closeImages,
      imageFile: imageFile
    });

    setFormData({
      jobId: '',
      closeDate: new Date().toISOString().split('T')[0],
      closeImages: []
    });
  };

  return (
    <form id="close-job-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="jobId">
          เลือกงานที่ต้องการปิด <span className="text-red-500">*</span>
        </label>
        <select
          id="jobId"
          name="jobId"
          value={formData.jobId}
          onChange={handleInputChange}
          required
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">-- เลือกงาน --</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.machine_name || job.machineName} - {new Date(job.open_date || job.openDate).toLocaleDateString('th-TH')}
            </option>
          ))}
        </select>
        {disabled && (
          <p className="text-sm text-gray-500 mt-1">ไม่มีงานที่รอการปิดอยู่</p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="closeDate">
          วันที่ปิดงาน <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="closeDate"
          name="closeDate"
          value={formData.closeDate}
          onChange={handleInputChange}
          required
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          รูปภาพประกอบการปิดงาน (สามารถเลือกได้หลายรูป)
        </label>
        <div className={`upload-area ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="file"
            id="closeImages"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={disabled}
          />
          <label
            htmlFor="closeImages"
            className={`${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Upload className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-sm text-gray-600">คลิกเพื่อเลือกรูปภาพ (สามารถเลือกได้หลายรูป)</p>
          </label>
        </div>

        {formData.closeImages.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {formData.closeImages.map(image => (
              <div key={image.id} className="image-preview">
                <img src={image.data} alt={image.name} />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeImage(image.id)}
                  disabled={disabled}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <CheckCircle className="mr-2" size={20} />
        ปิดงาน
      </button>
    </form>
  );
};

export default CloseJobForm;
