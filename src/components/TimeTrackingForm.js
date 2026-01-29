import React, { useState } from 'react';
import { Clock, Save } from 'lucide-react';
import TimeInput from './TimeInput';

const TimeTrackingForm = ({ onSubmit, timeRecords, onShowAlert }) => {
  const [formData, setFormData] = useState({
    machineId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Convert machineId to uppercase automatically
    const processedValue = name === 'machineId' ? value.toUpperCase() : value;
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const formatDurationMinutes = (totalMinutes) => {
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
      totalMinutes = 0;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}ชั่วโมง ${minutes}นาที`;
  };

  const normalizeTime = (raw) => {
    const value = String(raw ?? '').trim();
    if (value === '') return '';

    if (/^[0-9]{3,4}$/.test(value)) {
      const digits = value.padStart(4, '0');
      const hour = parseInt(digits.slice(0, 2));
      const minute = parseInt(digits.slice(2, 4));
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      }
      return '';
    }

    if (/^[0-9]{1,2}$/.test(value)) {
      const hour = parseInt(value);
      if (hour >= 0 && hour <= 23) {
        return `${hour.toString().padStart(2, '0')}:00`;
      }
      return '';
    }

    if (/^[0-9]{1,2}:$/.test(value)) {
      const hour = parseInt(value.split(':')[0]);
      if (hour >= 0 && hour <= 23) {
        return `${hour.toString().padStart(2, '0')}:00`;
      }
      return '';
    }

    const match = value.match(/^([0-9]{1,2}):([0-9]{1,2})$/);
    if (match) {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      }
      return '';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.machineId || !formData.date || !formData.startTime || !formData.endTime) {
      onShowAlert('⚠️ กรุณากรอกข้อมูล', 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง', 'warning');
      return;
    }

    // Check for any record on the same date (only one machine per day)
    
    // Check in current state first - any record on the same date
    const existingRecord = timeRecords.find(record => record.date === formData.date);

    if (existingRecord) {
      onShowAlert(
        '⚠️ มีการบันทึกเวลาในวันนี้แล้ว',
        `เครื่อง ${formData.machineId.toUpperCase()} มีการบันทึกเวลาในวันที่ ${formData.date} แล้ว\nเวลาที่บันทึกไว้: ${existingRecord.startTime} - ${existingRecord.endTime}\n\nหนึ่งวันสามารถบันทึกได้เพียงเครื่องเดียวเท่านั้น\nหากต้องการแก้ไข กรุณาลบรายการเก่าก่อน`,
        'warning'
      );
      return;
    }

    // Also check database before submission (double protection)
    try {
      // Import getTimeRecords dynamically to avoid circular dependency
      const { getTimeRecords } = await import('../supabase');
      const dbRecords = await getTimeRecords();
      const dbExistingRecord = dbRecords.find(record => record.date === formData.date);
      
      if (dbExistingRecord) {
        onShowAlert(
          '⚠️ มีการบันทึกเวลาในวันนี้แล้ว',
          `เครื่อง ${formData.machineId.toUpperCase()} มีการบันทึกเวลาในวันที่ ${formData.date} แล้ว (พบในฐานข้อมูล)\nเวลาที่บันทึกไว้: ${dbExistingRecord.startTime} - ${dbExistingRecord.endTime}\n\nหนึ่งวันสามารถบันทึกได้เพียงเครื่องเดียวเท่านั้น\nหากต้องการแก้ไข กรุณาลบรายการเก่าก่อน`,
          'warning'
        );
        return;
      }
    } catch (error) {
      console.error('🔍 Error checking database for same date records:', error);
      // Continue with submission if database check fails
    }

    const startTime = normalizeTime(formData.startTime);
    const endTime = normalizeTime(formData.endTime);
    
    if (!startTime || !endTime) {
      onShowAlert('⚠️ รูปแบบเวลาไม่ถูกต้อง', 'กรุณากรอกเวลาในรูปแบบ HH:MM เช่น 08:00', 'warning');
      return;
    }
    
    const startDateTime = new Date(`${formData.date}T${startTime}`);
    const endDateTime = new Date(`${formData.date}T${endTime}`);
    
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      onShowAlert('❌ วันที่หรือเวลาไม่ถูกต้อง', 'กรุณาตรวจสอบวันที่และเวลาที่กรอก', 'error');
      return;
    }
    
    if (endDateTime <= startDateTime) {
      onShowAlert('⚠️ เวลาไม่ถูกต้อง', 'เวลาเลิกงานต้องมากกว่าเวลาเริ่มงาน', 'warning');
      return;
    }

    const diffMinutes = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
    const breakMinutes = diffMinutes > 8 * 60 ? 60 : 0;
    const workMinutes = Math.max(0, diffMinutes - breakMinutes);
    const regularMinutes = Math.min(workMinutes, 8 * 60);
    const otMinutes = Math.max(0, workMinutes - 8 * 60);

    const record = {
      ...formData,
      startTime,
      endTime,
      id: Date.now(),
      duration: formatDurationMinutes(workMinutes),
      workMinutes,
      breakMinutes,
      regularMinutes,
      otMinutes,
      createdAt: new Date().toISOString()
    };

    await onSubmit(record);
    
    // Reset form after successful submission
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      machineId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: ''
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <Clock className="text-purple-600 mr-2" size={24} />
        <h2 className="text-xl font-semibold text-purple-600">ลงเวลาการทำงาน</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="machineId">
            ID เครื่องจักร <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="machineId"
            name="machineId"
            value={formData.machineId}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="กรอก ID เครื่องจักร"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
            วันที่ <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TimeInput
            value={formData.startTime}
            onChange={handleInputChange}
            label="เวลาเริ่มงาน"
            required={true}
            name="startTime"
            options={["08:00", "08:30"]}
          />
          <TimeInput
            value={formData.endTime}
            onChange={handleInputChange}
            label="เวลาเลิกงาน"
            required={true}
            name="endTime"
            options={["17:00", "17:30", "18:00"]}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            <Save className="mr-2" size={16} />
            บันทึกเวลา
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimeTrackingForm;
