import React, { useMemo, useState, useEffect } from 'react';
import { Calculator, DollarSign } from 'lucide-react';
import { getMachineCostcenter, getMultipleUserWageRates } from '../supabase';

const WorkCostSummary = ({ timeRecords }) => {
  const [machineCostcenters, setMachineCostcenters] = useState({});
  const [userWageRates, setUserWageRates] = useState({});

  // Fetch machine costcenters
  useEffect(() => {
    const fetchCostcenters = async () => {
      // Get unique machine IDs from both machineId and machine_id fields
      const uniqueMachineIds = [...new Set(
        timeRecords.map(record => record.machineId || record.machine_id).filter(Boolean)
      )];
      
      const costcenterData = {};
      
      // Fetch costcenters sequentially to avoid overwhelming the database
      for (const machineId of uniqueMachineIds) {
        try {
          const costcenter = await getMachineCostcenter(machineId);
          
          costcenterData[machineId] = costcenter?.costcenter || 'N/A';
        } catch (error) {
          console.error(`Error fetching costcenter for ${machineId}:`, error);
          costcenterData[machineId] = 'N/A';
        }
      }
      setMachineCostcenters(costcenterData);
    };

    if (timeRecords && timeRecords.length > 0) {
      fetchCostcenters();
    }
  }, [timeRecords]);

  // Fetch user wage rates
  useEffect(() => {
    const fetchUserWageRates = async () => {
      // Get unique user emails from both userEmail and user_email fields
      const uniqueUserEmails = [...new Set(
        timeRecords.map(record => record.userEmail || record.user_email || 'unknown@example.com').filter(Boolean)
      )];
      
      try {
        const wageRatesData = await getMultipleUserWageRates(uniqueUserEmails);
        setUserWageRates(wageRatesData);
      } catch (error) {
        console.error('Error fetching user wage rates:', error);
      }
    };

    if (timeRecords && timeRecords.length > 0) {
      fetchUserWageRates();
    }
  }, [timeRecords]);

  // Calculate work cost summary with wage and OT calculations
  const workCostSummary = useMemo(() => {
    if (!timeRecords || timeRecords.length === 0) {
      return [];
    }

    // Group records by machine and user
    const groupedRecords = timeRecords.reduce((acc, record) => {
      const machineId = record.machineId || record.machine_id;
      const userEmail = record.userEmail || record.user_email;
      const userName = record.userName || record.user_name;
      
      // Skip records without machineId
      if (!machineId) {
        return acc;
      }
      
      const key = `${machineId}_${userEmail}`;
      
      if (!acc[key]) {
        acc[key] = {
          machineId,
          userEmail,
          userName,
          totalRegularMinutes: 0,
          totalOTMinutes: 0,
          records: []
        };
      }
      
      // Calculate minutes from time fields if not already calculated
      let regularMinutes = record.regularMinutes;
      let otMinutes = record.otMinutes;
      
      if (regularMinutes === undefined || otMinutes === undefined) {
        // Calculate from start_time and end_time
        if (record.start_time && record.end_time && record.date) {
          const startTime = record.start_time.substring(0, 5); // Remove seconds
          const endTime = record.end_time.substring(0, 5); // Remove seconds
          
          const startDateTime = new Date(`${record.date}T${startTime}`);
          const endDateTime = new Date(`${record.date}T${endTime}`);
          
          if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime())) {
            const diffMinutes = Math.max(0, Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)));
            const breakMinutes = diffMinutes > 8 * 60 ? 60 : 0;
            const workMinutes = Math.max(0, diffMinutes - breakMinutes);
            
            regularMinutes = Math.min(workMinutes, 8 * 60);
            otMinutes = Math.max(0, workMinutes - 8 * 60);
          }
        }
      }
      
      acc[key].totalRegularMinutes += regularMinutes || 0;
      acc[key].totalOTMinutes += otMinutes || 0;
      acc[key].records.push(record);
      
      return acc;
    }, {});

    // Convert to array and calculate costs
    return Object.values(groupedRecords).map(group => {
      const regularHours = group.totalRegularMinutes / 60;
      const otHours = group.totalOTMinutes / 60;
      
      // Get wage rates from database for this user
      const userWageInfo = userWageRates[group.userEmail] || {};
      const wageRate = userWageInfo.wage_rate || 350; // Default to 350 if not found
      const otRate = userWageInfo.ot_rate || 525; // Default to 525 (350 * 1.5) if not found
      
      const regularCost = regularHours * wageRate;
      const otCost = otHours * otRate; // OT rate is now hourly rate, not multiplier
      const totalCost = regularCost + otCost;
      
      return {
        ...group,
        regularHours: regularHours.toFixed(2),
        otHours: otHours.toFixed(2),
        wageRate,
        otRate,
        regularCost: regularCost.toFixed(2),
        otCost: otCost.toFixed(2),
        totalCost: totalCost.toFixed(2),
        costcenter: machineCostcenters[group.machineId] || 'N/A'
      };
    });
  }, [timeRecords, machineCostcenters, userWageRates]);

  // Group by costcenter for summary display
  const groupedByCostcenter = useMemo(() => {
    if (!workCostSummary || workCostSummary.length === 0) {
      return {};
    }

    const grouped = workCostSummary.reduce((acc, item) => {
      const costcenter = item.costcenter;
      
      if (!acc[costcenter]) {
        acc[costcenter] = {
          costcenter: costcenter,
          items: [],
          totalRegularHours: 0,
          totalOTHours: 0,
          totalRegularCost: 0,
          totalOTCost: 0,
          totalCost: 0,
          totalMachines: new Set(),
          totalUsers: new Set()
        };
      }
      
      acc[costcenter].items.push(item);
      acc[costcenter].totalRegularHours += parseFloat(item.regularHours);
      acc[costcenter].totalOTHours += parseFloat(item.otHours);
      acc[costcenter].totalRegularCost += parseFloat(item.regularCost);
      acc[costcenter].totalOTCost += parseFloat(item.otCost);
      acc[costcenter].totalCost += parseFloat(item.totalCost);
      acc[costcenter].totalMachines.add(item.machineId);
      acc[costcenter].totalUsers.add(item.userName);
      
      return acc;
    }, {});

    // Convert Sets to counts
    Object.keys(grouped).forEach(costcenter => {
      grouped[costcenter].totalMachines = grouped[costcenter].totalMachines.size;
      grouped[costcenter].totalUsers = grouped[costcenter].totalUsers.size;
    });

    return grouped;
  }, [workCostSummary]);

  // Calculate totals
  const totals = useMemo(() => {
    return workCostSummary.reduce((acc, item) => {
      acc.totalRegularHours += parseFloat(item.regularHours);
      acc.totalOTHours += parseFloat(item.otHours);
      acc.totalRegularCost += parseFloat(item.regularCost);
      acc.totalOTCost += parseFloat(item.otCost);
      acc.totalCost += parseFloat(item.totalCost);
      return acc;
    }, {
      totalRegularHours: 0,
      totalOTHours: 0,
      totalRegularCost: 0,
      totalOTCost: 0,
      totalCost: 0
    });
  }, [workCostSummary]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  if (workCostSummary.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Calculator className="text-green-600 mr-3" size={28} />
          <h2 className="text-2xl font-semibold text-gray-800">สรุปข้อมูลการทำงาน</h2>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="mx-auto mb-4" size={48} />
          <p>ไม่มีข้อมูลการทำงานสำหรับคำนวณค่าใช้จ่าย</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Calculator className="text-green-600 mr-3" size={28} />
        <h2 className="text-2xl font-semibold text-gray-800">สรุปข้อมูลการทำงาน</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-600 mb-1">ชั่วโมงปกติรวม</div>
          <div className="text-2xl font-bold text-blue-700">{totals.totalRegularHours.toFixed(2)} ชม.</div>
          <div className="text-sm text-gray-600 mt-1">ค่าแรง: {formatCurrency(totals.totalRegularCost)}</div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="text-sm text-gray-600 mb-1">ชั่วโมง OT รวม</div>
          <div className="text-2xl font-bold text-orange-700">{totals.totalOTHours.toFixed(2)} ชม.</div>
          <div className="text-sm text-gray-600 mt-1">ค่า OT: {formatCurrency(totals.totalOTCost)}</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600 mb-1">ค่าใช้จ่ายรวม</div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(totals.totalCost)}</div>
          <div className="text-sm text-gray-600 mt-1">ทั้งหมด</div>
        </div>
      </div>

      {/* Grouped by Costcenter */}
      {Object.keys(groupedByCostcenter).length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">สรุปตามรหัสค่าใช้จ่าย</h3>
          <div className="space-y-4">
            {Object.entries(groupedByCostcenter).map(([costcenter, data]) => (
              <div key={costcenter} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      รหัสค่าใช้จ่าย: {costcenter}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {data.totalMachines} เครื่องจักร • {data.totalUsers} ผู้ใช้
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-700">
                      {formatCurrency(data.totalCost)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {data.totalRegularHours.toFixed(2)} ชม.ปกติ + {data.totalOTHours.toFixed(2)} ชม.OT
                    </div>
                  </div>
                </div>
                
                {/* Detailed items for this costcenter */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2 px-2 text-gray-700">ID เครื่องจักร</th>
                        <th className="text-left py-2 px-2 text-gray-700">ผู้ใช้</th>
                        <th className="text-right py-2 px-2 text-gray-700">ชม.ปกติ</th>
                        <th className="text-right py-2 px-2 text-gray-700">ค่าแรง</th>
                        <th className="text-right py-2 px-2 text-gray-700">ชม.OT</th>
                        <th className="text-right py-2 px-2 text-gray-700">ค่า OT</th>
                        <th className="text-right py-2 px-2 text-gray-700">รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-white">
                          <td className="py-2 px-2">
                            <span className="font-medium text-gray-900">{item.machineId}</span>
                          </td>
                          <td className="py-2 px-2 text-gray-700">{item.userName}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{item.regularHours}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(item.regularCost)}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{item.otHours}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(item.otCost)}</td>
                          <td className="py-2 px-2 text-right font-medium text-gray-900">
                            {formatCurrency(item.totalCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Table (All Records) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">รายการทั้งหมด</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">รหัสค่าใช้จ่าย</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID เครื่องจักร</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ชม. ทำงานปกติรวม</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ค่าแรง</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ชม. OT รวม</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ค่า OT</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
              </tr>
            </thead>
            <tbody>
              {workCostSummary.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {item.costcenter}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.machineId}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.regularHours}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.regularCost)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.otHours}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.otCost)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800">
          <div className="font-semibold mb-2">หมายเหตุ:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>ค่าแรงพื้นฐาน: ดึงจากฐานข้อมูลผู้ใช้ตามแต่ละบุคคล (wage_rate) คิดเป็นบาทต่อชั่วโมง</li>
            <li>ค่า OT: ดึงจากฐานข้อมูลผู้ใช้ตามแต่ละบุคคล (ot_rate) คิดเป็นบาทต่อชั่วโมง</li>
            <li>รหัสค่าใช้จ่าย: ดึงจากฐานข้อมูล machine_costcenter ตาม ID เครื่องจักร</li>
            <li>ข้อมูลคำนวณจากบันทึกเวลาการทำงานทั้งหมดในระบบ</li>
            <li>ค่าเริ่มต้น: ค่าแรง 350 บาท/ชั่วโมง, OT 525 บาท/ชั่วโมง (ถ้าไม่มีข้อมูลในฐานข้อมูล)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkCostSummary;
