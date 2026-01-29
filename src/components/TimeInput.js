import React from 'react';

const TimeInput = ({ value, onChange, disabled, label, required, name, options = [] }) => {
  const handleInputChange = (e) => {
    const value = e.target.value;
    // อนุญาตให้กรอกตัวเลขและ : เท่านั้น
    const cleanValue = value.replace(/[^0-9:]/g, '');
    
    // ตรวจสอบรูปแบบ - ยอมรับทุกรูปแบบที่กำลังพิมพ์
    if (cleanValue === '' || 
        /^[0-9]{1,4}$/.test(cleanValue) ||     // 8, 14, 830, 0830
        /^[0-9]{1,2}:$/.test(cleanValue) ||    // 8:, 14:
        /^[0-9]{1,2}:[0-9]{1,2}$/.test(cleanValue)) { // 8:3, 14:30
      onChange({ target: { name, value: cleanValue } });
    }
  };

  const handleBlur = (e) => {
    let value = e.target.value;

    if (/^[0-9]{3,4}$/.test(value)) {
      const digits = value.padStart(4, '0');
      const hour = parseInt(digits.slice(0, 2));
      const minute = parseInt(digits.slice(2, 4));
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange({ target: { name, value } });
      }
      return;
    }
    
    // ถ้ามีแค่ชั่วโมง เติม :00
    if (/^[0-9]{1,2}$/.test(value)) {
      const hour = parseInt(value);
      if (hour >= 0 && hour <= 23) {
        value = `${hour.toString().padStart(2, '0')}:00`;
        onChange({ target: { name, value } });
      }
    }
    // ถ้ามีชั่วโมง: ให้เติม 00
    else if (/^[0-9]{1,2}:$/.test(value)) {
      const hour = parseInt(value.split(':')[0]);
      if (hour >= 0 && hour <= 23) {
        value = `${hour.toString().padStart(2, '0')}:00`;
        onChange({ target: { name, value } });
      }
    }
    // ถ้ามี HH:mm ให้ตรวจสอบความถูกต้อง
    else if (/^([0-9]{1,2}):([0-9]{1,2})$/.test(value)) {
      const [hourStr, minuteStr] = value.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange({ target: { name, value } });
      }
    }
  };

  return (
    <div>
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder="08:00"
        list={options.length > 0 ? `${name}-options` : undefined}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
      />
      {options.length > 0 && (
        <datalist id={`${name}-options`}>
          {options.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      )}
    </div>
  );
};

export default TimeInput;
