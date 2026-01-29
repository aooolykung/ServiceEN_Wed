import React from 'react';
import { Clock, Calendar, Trash2, User, Search, Filter } from 'lucide-react';

const TimeRecordsList = ({ records, onDeleteRecord, filters, onFiltersChange }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="mx-auto text-4xl mb-2" />
        <p>ยังไม่มีบันทึกเวลาการทำงาน</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('th-TH', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  const computeRecordMinutes = (record) => {
    if (
      typeof record.workMinutes === 'number' &&
      typeof record.regularMinutes === 'number' &&
      typeof record.otMinutes === 'number' &&
      typeof record.breakMinutes === 'number'
    ) {
      return {
        workMinutes: record.workMinutes,
        regularMinutes: record.regularMinutes,
        otMinutes: record.otMinutes,
        breakMinutes: record.breakMinutes
      };
    }

    if (record?.date && record?.startTime && record?.endTime) {
      const startTime = normalizeTime(record.startTime);
      const endTime = normalizeTime(record.endTime);
      if (!startTime || !endTime) {
        return { workMinutes: 0, regularMinutes: 0, otMinutes: 0, breakMinutes: 0 };
      }

      const startDateTime = new Date(`${record.date}T${startTime}`);
      const endDateTime = new Date(`${record.date}T${endTime}`);
      if (!Number.isFinite(startDateTime.getTime()) || !Number.isFinite(endDateTime.getTime())) {
        return { workMinutes: 0, regularMinutes: 0, otMinutes: 0, breakMinutes: 0 };
      }
      const diffMinutes = Math.max(
        0,
        Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))
      );
      if (!Number.isFinite(diffMinutes)) {
        return { workMinutes: 0, regularMinutes: 0, otMinutes: 0, breakMinutes: 0 };
      }
      const breakMinutes = diffMinutes > 8 * 60 ? 60 : 0;
      const workMinutes = Math.max(0, diffMinutes - breakMinutes);
      const regularMinutes = Math.min(workMinutes, 8 * 60);
      const otMinutes = Math.max(0, workMinutes - 8 * 60);
      return { workMinutes, regularMinutes, otMinutes, breakMinutes };
    }

    const duration = typeof record?.duration === 'string' ? record.duration : '';
    const match = duration.match(/(\d+)\s*ชั่วโมง\s*(\d+)\s*นาที/);
    const hours = match ? parseInt(match[1]) : 0;
    const minutes = match ? parseInt(match[2]) : 0;
    const workMinutes = hours * 60 + minutes;
    const regularMinutes = Math.min(workMinutes, 8 * 60);
    const otMinutes = Math.max(0, workMinutes - 8 * 60);
    return { workMinutes, regularMinutes, otMinutes, breakMinutes: 0 };
  };

  const getTodayRecords = () => {
    const today = new Date().toISOString().split('T')[0];
    return records.filter(record => record.date === today);
  };

  const getSummaryTotals = (targetRecords) => {
    return targetRecords.reduce(
      (acc, record) => {
        const mins = computeRecordMinutes(record);
        acc.workMinutes += mins.workMinutes;
        acc.regularMinutes += mins.regularMinutes;
        acc.otMinutes += mins.otMinutes;
        acc.breakMinutes += mins.breakMinutes;
        return acc;
      },
      { workMinutes: 0, regularMinutes: 0, otMinutes: 0, breakMinutes: 0 }
    );
  };

  const todayTotals = getSummaryTotals(getTodayRecords());
  const allTotals = getSummaryTotals(records);

  const handleFilterChange = (field, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Filter Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center mb-4">
          <Filter className="text-purple-600 mr-2" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">กรองข้อมูลบันทึกเวลา</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Name Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อผู้ใช้
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ใช้..."
                value={filters?.userName || ''}
                onChange={(e) => handleFilterChange('userName', e.target.value)}
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={filters?.dateRange?.startDate || ''}
              onChange={(e) => handleFilterChange('dateRange', { 
                ...filters?.dateRange, 
                startDate: e.target.value 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={filters?.dateRange?.endDate || ''}
              onChange={(e) => handleFilterChange('dateRange', { 
                ...filters?.dateRange, 
                endDate: e.target.value 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onFiltersChange({ dateRange: { startDate: '', endDate: '' }, userName: '' })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* Records Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-800">สรุปบันทึกเวลา</h3>
            <p className="text-sm text-blue-600">
              แสดง {records.length} รายการ {filters?.userName || filters?.dateRange?.startDate ? '(มีการกรอง)' : '(ทั้งหมด)'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-700">
              {formatDurationMinutes(allTotals.workMinutes)}
            </div>
            <div className="text-sm text-blue-600">เวลารวม</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Clock className="text-gray-600 mr-2" size={20} />
          <h2 className="text-xl font-semibold text-gray-800">บันทึกเวลาการทำงาน</h2>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">วันนี้: ปกติ {(todayTotals.regularMinutes / 60).toFixed(1)} | OT {(todayTotals.otMinutes / 60).toFixed(1)} ชั่วโมง</div>
          <div className="text-sm font-semibold text-purple-600">ทั้งหมด: ปกติ {(allTotals.regularMinutes / 60).toFixed(1)} | OT {(allTotals.otMinutes / 60).toFixed(1)} ชั่วโมง</div>
        </div>
      </div>

      <div className="space-y-3">
        {records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(record => (
          (() => {
            const mins = computeRecordMinutes(record);
            return (
          <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>
                    โดย: {record.user_name || 'Unknown'}
                  </div>
                </div>
                <div className="flex items-center mb-2">
                  <User className="text-purple-600 mr-2" size={16} />
                  <span className="text-xs text-gray-500 mb-1">{(record.machine_id || record.machineId || '').toUpperCase()}</span>
                  <span className="ml-2 text-sm text-gray-500">#{record.id}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="mr-1" size={14} />
                    {formatDate(record.date)}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="mr-1" size={14} />
                    {record.start_time || record.startTime} - {record.end_time || record.endTime}
                  </div>
                  <div className="font-semibold text-purple-600">
                    {formatDurationMinutes(mins.workMinutes)}
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  ปกติ: {(mins.regularMinutes / 60).toFixed(1)} ชม. | OT: {(mins.otMinutes / 60).toFixed(1)} ชม.
                </div>
                
                <div className="text-xs text-gray-400 mt-2">
                  บันทึกเมื่อ: {formatDateTime(record.createdAt)}
                </div>
              </div>
              
              <button
                onClick={() => {
                  onDeleteRecord(record.id);
                }}
                className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                title="ลบบันทึก"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
            );
          })()
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">สรุปสถิติ</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{records.length}</div>
            <div className="text-xs text-gray-600">รายการทั้งหมด</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{getTodayRecords().length}</div>
            <div className="text-xs text-gray-600">วันนี้</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{(todayTotals.regularMinutes / 60).toFixed(1)}</div>
            <div className="text-xs text-gray-600">ปกติวันนี้</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{(todayTotals.otMinutes / 60).toFixed(1)}</div>
            <div className="text-xs text-gray-600">OT วันนี้</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{(allTotals.regularMinutes / 60).toFixed(1)}</div>
            <div className="text-xs text-gray-600">ปกติทั้งหมด</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{(allTotals.otMinutes / 60).toFixed(1)}</div>
            <div className="text-xs text-gray-600">OT ทั้งหมด</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRecordsList;
