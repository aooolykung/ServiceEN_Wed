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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = {
            id: Date.now() + Math.random(),
            name: file.name,
            data: event.target.result,
            file: file // Store the actual file for Google Drive upload
          };
          setFormData(prev => ({
            ...prev,
            openImages: [...prev.openImages, imageData]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
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
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center"
      >
        <Plus className="mr-2" size={20} />
        เปิดงาน
      </button>
    </form>
  );
};

export default OpenJobForm;
