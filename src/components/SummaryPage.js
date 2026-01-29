import React, { useMemo } from 'react';
import { Clock, Wrench } from 'lucide-react';
import WorkCostSummary from './WorkCostSummary';

const SummaryPage = ({ timeRecords, jobs }) => {
  const timeStatistics = useMemo(() => {
    if (!timeRecords || timeRecords.length === 0) {
      return { totalRecords: 0, totalWorkMinutes: 0, totalOTMinutes: 0, avgWorkMinutes: 0, uniqueMachines: 0, thisMonthRecords: 0, todayRecords: 0 };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.toISOString().split('T')[0];

    const totalWorkMinutes = timeRecords.reduce((sum, record) => sum + (record.workMinutes || 0), 0);
    const totalOTMinutes = timeRecords.reduce((sum, record) => sum + (record.otMinutes || 0), 0);
    const uniqueMachines = new Set(timeRecords.map(record => record.machineId)).size;
    const thisMonthRecords = timeRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }).length;
    const todayRecords = timeRecords.filter(record => record.date === today).length;

    return {
      totalRecords: timeRecords.length,
      totalWorkMinutes,
      totalOTMinutes,
      avgWorkMinutes: Math.round(totalWorkMinutes / timeRecords.length),
      uniqueMachines,
      thisMonthRecords,
      todayRecords
    };
  }, [timeRecords]);

  const jobStatistics = useMemo(() => {
    if (!jobs || jobs.length === 0) {
      return { totalJobs: 0, openJobs: 0, closedJobs: 0, thisMonthJobs: 0, avgJobDuration: 0 };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const openJobs = jobs.filter(job => job.status === 'open').length;
    const closedJobs = jobs.filter(job => job.status === 'closed').length;
    const thisMonthJobs = jobs.filter(job => {
      const jobDate = new Date(job.open_date || job.openDate);
      return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
    }).length;

    const completedJobs = jobs.filter(job => job.status === 'closed' && job.close_date);
    const avgJobDuration = completedJobs.length > 0 
      ? Math.round(completedJobs.reduce((sum, job) => {
          const openDate = new Date(job.open_date || job.openDate);
          const closeDate = new Date(job.close_date);
          return sum + Math.ceil((closeDate - openDate) / (1000 * 60 * 60 * 24));
        }, 0) / completedJobs.length * 10) / 10
      : 0;

    return { totalJobs: jobs.length, openJobs, closedJobs, thisMonthJobs, avgJobDuration };
  }, [jobs]);

  const formatDurationMinutes = (totalMinutes) => {
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) totalMinutes = 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}ชั่วโมง ${minutes}นาที`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ข้อมูลสรุป</h1>
        <p className="text-gray-600">สถิติการทำงานและการจัดการงาน</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Clock className="text-purple-600 mr-3" size={28} />
          <h2 className="text-2xl font-semibold text-gray-800">สรุปสถิติการทำงาน</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="text-3xl font-bold text-purple-700">{timeStatistics.totalRecords}</div>
            <div className="text-sm text-gray-700 mt-1">รายการทั้งหมด</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-700">{formatDurationMinutes(timeStatistics.totalWorkMinutes)}</div>
            <div className="text-sm text-gray-700 mt-1">เวลาทำงานรวม</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="text-3xl font-bold text-orange-700">{formatDurationMinutes(timeStatistics.totalOTMinutes)}</div>
            <div className="text-sm text-gray-700 mt-1">OT รวม</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-700">{formatDurationMinutes(timeStatistics.avgWorkMinutes)}</div>
            <div className="text-sm text-gray-700 mt-1">เฉลี่ย/วัน</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
            <div className="text-3xl font-bold text-teal-700">{timeStatistics.uniqueMachines}</div>
            <div className="text-sm text-gray-700 mt-1">เครื่องจักร</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
            <div className="text-3xl font-bold text-indigo-700">{timeStatistics.thisMonthRecords}</div>
            <div className="text-sm text-gray-700 mt-1">เดือนนี้</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
            <div className="text-3xl font-bold text-pink-700">{timeStatistics.todayRecords}</div>
            <div className="text-sm text-gray-700 mt-1">วันนี้</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Wrench className="text-blue-600 mr-3" size={28} />
          <h2 className="text-2xl font-semibold text-gray-800">สรุปสถิติงาน</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-700">{jobStatistics.totalJobs}</div>
            <div className="text-sm text-gray-700 mt-1">งานทั้งหมด</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-700">{jobStatistics.openJobs}</div>
            <div className="text-sm text-gray-700 mt-1">งานที่เปิด</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-700">{jobStatistics.closedJobs}</div>
            <div className="text-sm text-gray-700 mt-1">งานที่ปิด</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="text-3xl font-bold text-purple-700">{jobStatistics.thisMonthJobs}</div>
            <div className="text-sm text-gray-700 mt-1">เดือนนี้</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg border border-cyan-200">
            <div className="text-3xl font-bold text-cyan-700">{jobStatistics.avgJobDuration}</div>
            <div className="text-sm text-gray-700 mt-1">วันเฉลี่ย</div>
          </div>
        </div>
      </div>

      {/* Work Cost Summary */}
      <div>
        <WorkCostSummary timeRecords={timeRecords} />
      </div>
    </div>
  );
};

export default SummaryPage;
