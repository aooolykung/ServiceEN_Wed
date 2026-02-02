import React, { useState } from 'react';
import { Upload, X, Plus } from 'lucide-react';

const OpenJobForm = ({ onSubmit, electricalResponsibleUsers }) => {
  const [formData, setFormData] = useState({
    machineName: '',
    openDate: new Date().toISOString().split('T')[0],
    openImages: [],
    electricalResponsible: '' // เพิ่มฟิลด์ผู้รับผิดชอบระบบไฟฟ้า
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Convert machineName to uppercase automatically
    const processedValue = name === 'machineName' ? value.toUpperCase() : value;
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
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
              openImages: [...prev.openImages, imageData]
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
              openImages: [...prev.openImages, imageData]
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
      openImages: prev.openImages.filter(img => img.id !== imageId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.machineName.trim()) {
      alert('กรุณากรอกชื่อเครื่องจักร');
      return;
    }

    const imageFile = formData.openImages.length > 0 ? formData.openImages[0] : null;

    const submitData = {
      machineName: formData.machineName,
      jobName: formData.machineName, // Use machineName as jobName for folder naming
      openDate: formData.openDate,
      openImages: formData.openImages.map(img => ({
        id: img.id,
        name: img.name,
        data: img.data
      })),
      electricalResponsible: formData.electricalResponsible,
      imageFile: imageFile
    };

    onSubmit(submitData);

    setFormData({
      machineName: '',
      openDate: new Date().toISOString().split('T')[0],
      openImages: [],
      electricalResponsible: ''
    });
  };

  return (
    <form id="open-job-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="machineName">
          ชื่อเครื่องจักร <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="machineName"
          name="machineName"
          value={formData.machineName}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="กรอกชื่อเครื่องจักร"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="openDate">
          วันที่เปิดงาน <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="openDate"
          name="openDate"
          value={formData.openDate}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="electricalResponsible">
          ผู้รับผิดชอบระบบไฟฟ้า
        </label>
        <select
          id="electricalResponsible"
          name="electricalResponsible"
          value={formData.electricalResponsible}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- เลือกผู้รับผิดชอบระบบไฟฟ้า --</option>
          {electricalResponsibleUsers && electricalResponsibleUsers.map(user => (
            <option key={user.email} value={user.user_name}>
              {user.user_name} ({user.position})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          รูปภาพประกอบการเปิดงาน (สามารถเลือกได้หลายรูป)
        </label>
        <div className="upload-area">
          <input
            type="file"
            id="openImages"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <label htmlFor="openImages" className="cursor-pointer">
            <Upload className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-sm text-gray-600">คลิกเพื่อเลือกรูปภาพ (สามารถเลือกได้หลายรูป)</p>
          </label>
        </div>

        {formData.openImages.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {formData.openImages.map(image => (
              <div key={image.id} className="image-preview">
                <img src={image.data} alt={image.name} />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeImage(image.id)}
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
        className="w-full min-h-12 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 active:bg-blue-800 transition duration-200 flex items-center justify-center text-base sm:text-lg font-medium touch-manipulation"
      >
        <Plus className="mr-2" size={24} />
        เปิดงาน
      </button>
    </form>
  );
};

export default OpenJobForm;
