import { useState, useEffect, useMemo } from 'react';
import { Home, Clock, FolderPlus, FolderCheck, Search, TrendingUp, Calendar } from 'lucide-react';
import OpenJobForm from './components/OpenJobForm';
import CloseJobForm from './components/CloseJobForm';
import JobList from './components/JobList';
import ImageModal from './components/ImageModal';
import JobDetailModal from './components/JobDetailModal';
import Notification from './components/Notification';
import TimeTrackingForm from './components/TimeTrackingForm';
import TimeRecordsList from './components/TimeRecordsList';
import SummaryPage from './components/SummaryPage';
import ConfirmModal from './components/ConfirmModal';
import AlertModal from './components/AlertModal';
import { supabase } from './supabase';
import { 
  signInWithGoogle, 
  signOut, 
  onAuthStateChange, 
  checkUserAllowed,
  getElectricalResponsibleUsers,
  getJobs,
  getTimeRecords,
  createJob,
  updateJob,
  deleteJob,
  createTimeRecord,
  deleteTimeRecord,
  addAdditionalImages,
  deleteJobImage
} from './supabase';

function App() {
  const adminEmails = useMemo(() => new Set(['aooolykung@gmail.com']), []);

  const [jobs, setJobs] = useState([]);
  const [timeRecords, setTimeRecords] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [timeRecordFilters, setTimeRecordFilters] = useState({
    dateRange: { startDate: '', endDate: '' },
    userName: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [electricalResponsibleUsers, setElectricalResponsibleUsers] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState('jobs');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null, title: '', message: '', type: 'warning' });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    user: null,
    allowed: false,
    error: '',
    userName: ''
  });

  // Simplified auth check
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setAuthStatus({ loading: false, user: null, allowed: false, error: 'Session error' });
          }
          return;
        }
        
        if (!session?.user) {
          if (mounted) {
            setAuthStatus({ loading: false, user: null, allowed: false, error: '' });
          }
          return;
        }
        
        // Check user permissions
        const email = session.user.email.toLowerCase();
        let userData = null;
        
        try {
          userData = await checkUserAllowed(email);
        } catch (error) {
          console.error('Error checking user:', error);
        }
        
        if (mounted) {
          if (email && adminEmails.has(email)) {
            // Admin user
            setAuthStatus({
              loading: false,
              user: session.user,
              allowed: true,
              error: '',
              userName: userData?.user_name || 'Admin'
            });
          } else if (userData) {
            // Regular allowed user
            setAuthStatus({
              loading: false,
              user: session.user,
              allowed: true,
              error: '',
              userName: userData.user_name || session.user.email.split('@')[0]
            });
          } else {
            // Not allowed
            await signOut();
            setAuthStatus({
              loading: false,
              user: null,
              allowed: false,
              error: `อีเมล ${email} ยังไม่ได้รับอนุญาต`
            });
          }
          
          // Load data immediately after auth is successful
          if (userData || adminEmails.has(email)) {
            try {
              const [jobsData, timeRecordsData] = await Promise.all([
                getJobs(),
                getTimeRecords()
              ]);
              if (mounted) {
                setJobs(jobsData || []);
                setTimeRecords(timeRecordsData || []);
              }
            } catch (error) {
              console.error('Error loading data after auth:', error);
            }
          }
        }
        
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          setAuthStatus({ loading: false, user: null, allowed: false, error: 'Auth check failed' });
        }
      }
    };
    
    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setAuthStatus(prev => ({ ...prev, loading: false }));
      }
    }, 5000);
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        setAuthStatus({ loading: false, user: null, allowed: false, error: '' });
        setJobs([]);
        setTimeRecords([]);
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Re-check permissions on sign in
        await checkAuth();
      }
    });
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [adminEmails]);

  // Load electrical responsible users
  useEffect(() => {
    const loadElectricalResponsibleUsers = async () => {
      try {
        const users = await getElectricalResponsibleUsers();
        setElectricalResponsibleUsers(users);
      } catch (error) {
        console.error('Error loading electrical responsible users:', error);
      }
    };

    loadElectricalResponsibleUsers();
  }, []);

  // Load data from Supabase
  useEffect(() => {
    if (!authStatus.user || !authStatus.allowed) return;

    const loadData = async () => {
      try {
        const [jobsData, timeRecordsData] = await Promise.all([
          getJobs(),
          getTimeRecords()
        ]);
        setJobs(jobsData || []);
        setTimeRecords(timeRecordsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        showNotification('โหลดข้อมูลไม่สำเร็จ', 'error');
      }
    };

    loadData();
  }, [authStatus.user, authStatus.allowed]);

  // Remove localStorage usage - data is now stored in Supabase

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const showConfirm = (title, message, onConfirm, type = 'warning') => {
    setConfirmModal({
      isOpen: true,
      onConfirm,
      title,
      message,
      type
    });
  };

  const showAlert = (title, message, type = 'info') => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const handleOpenJob = async (jobData) => {
    try {
      const newJob = await createJob({
        ...jobData,
        jobName: jobData.machineName,
        userEmail: authStatus.user.email,
        userName: authStatus.userName
      });
      
      setJobs(prev => [newJob, ...prev]);
      showNotification('เปิดงานสำเร็จ!', 'success');
    } catch (error) {
      console.error('Error creating job:', error);
      showNotification('เปิดงานไม่สำเร็จ', 'error');
    }
  };

  const handleDeleteImage = async (jobId, imageId, imageType = 'close') => {
    showConfirm(
      'ลบรูปภาพ',
      'คุณแน่ใจว่าต้องการลบรูปภาพนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      async () => {
        try {
          const updatedJob = await deleteJobImage(jobId, imageId, imageType);
          
          setJobs(prev => {
            const updated = prev.map(job => 
              job.id === jobId ? updatedJob : job
            );
            return updated;
          });
          
          // Update selectedJob if this is the currently viewed job
          if (selectedJob && selectedJob.id === jobId) {
            setSelectedJob(updatedJob);
          }
          
          showNotification('ลบรูปภาพสำเร็จ!', 'success');
        } catch (error) {
          console.error('🗑️ App.js - Error deleting image:', error);
          showNotification('ลบรูปภาพไม่สำเร็จ: ' + error.message, 'error');
        }
      },
      'danger'
    );
  };

  const handleAddAdditionalImages = async (jobId, newImages, imageType = 'close') => {
    try {
      const updatedJob = await addAdditionalImages(jobId, newImages, imageType);
      
      setJobs(prev => {
        const updated = prev.map(job => 
          job.id === jobId ? updatedJob : job
        );
        return updated;
      });
      
      // Update selectedJob if this is the currently viewed job
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(updatedJob);
      }
      
      showNotification('เพิ่มรูปภาพเพิ่มเติมสำเร็จ!', 'success');
    } catch (error) {
      console.error('📸 App.js - Error adding additional images:', error);
      showNotification('เพิ่มรูปภาพไม่สำเร็จ: ' + error.message, 'error');
    }
  };

  const handleQuickClose = async (jobId) => {
    try {
      // Quick close with today's date and no images
      const updatedJob = await updateJob(jobId, {
        status: 'closed',
        close_date: new Date().toISOString().split('T')[0],
        close_images: []
      });
      
      setJobs(prev => prev.map(job => 
        job.id === jobId ? updatedJob : job
      ));
      showNotification('ปิดงานสำเร็จ!', 'success');
    } catch (error) {
      console.error('Error quick closing job:', error);
      showNotification('ปิดงานไม่สำเร็จ: ' + error.message, 'error');
    }
  };

  const handleCloseJob = async (jobId, closeData) => {
    try {
      const updatedJob = await updateJob(jobId, {
        status: 'closed',
        close_date: closeData.closeDate,
        close_images: closeData.closeImages
      });
      
      setJobs(prev => prev.map(job => 
        job.id === jobId ? updatedJob : job
      ));
      showNotification('ปิดงานสำเร็จ!', 'success');
    } catch (error) {
      console.error('Error closing job:', error);
      showNotification('ปิดงานไม่สำเร็จ: ' + error.message, 'error');
    }
  };

  const handleDeleteJob = async (jobId) => {
    const jobToDelete = jobs.find(j => j.id === jobId);
    if (!jobToDelete) return;
    
    showConfirm(
      'ลบรายการงาน',
      `คุณแน่ใจว่าต้องการลบรายการงานนี้?\n\nเครื่อง: ${jobToDelete.machine_name || jobToDelete.machineName}\nวันที่เปิด: ${jobToDelete.open_date || jobToDelete.openDate}\nสถานะ: ${jobToDelete.status === 'open' ? 'เปิด' : 'ปิดแล้ว'}\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      async () => {
        try {
          await deleteJob(jobId);
          setJobs(prev => prev.filter(job => job.id !== jobId));
          showNotification('ลบงานสำเร็จ', 'success');
          showAlert(
            '✅ ลบงานสำเร็จ',
            `ลบรายการงานของเครื่อง ${jobToDelete.machine_name || jobToDelete.machineName} เรียบร้อยแล้ว`,
            'success'
          );
        } catch (error) {
          console.error('Error deleting job:', error);
          showAlert(
            '❌ ลบงานไม่สำเร็จ',
            'เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง',
            'error'
          );
          showNotification('ลบงานไม่สำเร็จ', 'error');
        }
      },
      'danger'
    );
  };

  const handleAddTimeRecord = async (record) => {
    try {
      // Additional validation - check for any record on the same date (only one machine per day)
      
      // Check in current state first - any record on the same date
      const existingRecord = timeRecords.find(existing => existing.date === record.date);

      if (existingRecord) {
        showAlert(
          '⚠️ มีการบันทึกเวลาในวันนี้แล้ว',
          `วันที่ ${record.date} มีการบันทึกเวลาของเครื่อง ${(existingRecord.machine_id || existingRecord.machineId || '').toUpperCase()} แล้ว\nเวลาที่บันทึกไว้: ${existingRecord.startTime} - ${existingRecord.endTime}\n\nหนึ่งวันสามารถบันทึกได้เพียงเครื่องเดียวเท่านั้น\nหากต้องการแก้ไข กรุณาลบรายการเก่าก่อน`,
          'warning'
        );
        return;
      }

      // Double check with database before insertion
      try {
        const dbRecords = await getTimeRecords();
        const dbExistingRecord = dbRecords.find(existing => existing.date === record.date);
        
        if (dbExistingRecord) {
          showAlert(
            '⚠️ มีการบันทึกเวลาในวันนี้แล้ว',
            `วันที่ ${record.date} มีการบันทึกเวลาของเครื่อง ${(dbExistingRecord.machine_id || dbExistingRecord.machineId || '').toUpperCase()} แล้ว (พบในฐานข้อมูล)\nเวลาที่บันทึกไว้: ${dbExistingRecord.startTime} - ${dbExistingRecord.endTime}\n\nหนึ่งวันสามารถบันทึกได้เพียงเครื่องเดียวเท่านั้น\nหากต้องการแก้ไข กรุณาลบรายการเก่าก่อน`,
            'warning'
          );
          return;
        }
      } catch (error) {
        console.error('Error checking database for same date records:', error);
      }

      await createTimeRecord({
        ...record,
        userEmail: authStatus.user.email,
        userName: authStatus.userName
      });
      
      // Add the new record to state immediately for instant validation
      const newRecord = {
        ...record,
        userEmail: authStatus.user.email,
        userName: authStatus.userName,
        machine_id: record.machineId,
        user_email: authStatus.user.email,
        user_name: authStatus.userName
      };
      
      setTimeRecords(prev => [...prev, newRecord]);
      
      // Show prominent success alert
      showAlert(
        '✅ บันทึกเวลาสำเร็จ!',
        `เครื่อง ${record.machineId.toUpperCase()} - วันที่ ${record.date}\nเวลา: ${record.startTime} - ${record.endTime}\nระยะเวลาทำงาน: ${calculateWorkDuration(record.startTime, record.endTime)}\n\nฟอร์มถูกรีเซ็ตแล้ว สามารถบันทึกเวลาใหม่ได้`,
        'success'
      );
      
      // Also show notification for consistency
      showNotification('บันทึกเวลาสำเร็จ!', 'success');
    } catch (error) {
      console.error('Error creating time record:', error);
      showAlert(
        '❌ บันทึกเวลาไม่สำเร็จ',
        'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง',
        'error'
      );
      showNotification('บันทึกเวลาไม่สำเร็จ', 'error');
    }
  };

  const calculateWorkDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes <= 0) return '0 ชั่วโมง 0 นาที';
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours} ชั่วโมง ${minutes} นาที`;
  };

  const handleDeleteTimeRecord = async (recordId) => {
    const recordToDelete = timeRecords.find(r => r.id === recordId);
    
    if (!recordToDelete) {
      return;
    }
    
    showConfirm(
      'ลบบันทึกเวลา',
      `คุณแน่ใจว่าต้องการลบบันทึกเวลานี้?\n\nเครื่อง: ${(recordToDelete.machine_id || recordToDelete.machineId || '').toUpperCase()}\nวันที่: ${recordToDelete.date}\nเวลา: ${recordToDelete.startTime} - ${recordToDelete.endTime}\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      async () => {
        try {
          await deleteTimeRecord(recordId);
          
          setTimeRecords(prev => {
            const filtered = prev.filter(record => record.id !== recordId);
            return filtered;
          });
          
          showNotification('ลบบันทึกเวลาสำเร็จ', 'success');
          showAlert(
            '✅ ลบบันทึกเวลาสำเร็จ',
            `ลบบันทึกเวลาของเครื่อง ${(recordToDelete.machine_id || recordToDelete.machineId || '').toUpperCase()} ในวันที่ ${recordToDelete.date} เรียบร้อยแล้ว`,
            'success'
          );
        } catch (error) {
          console.error('❌ Error deleting time record:', error);
          showAlert(
            '❌ ลบบันทึกเวลาไม่สำเร็จ',
            'เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง',
            'error'
          );
          showNotification('ลบบันทึกเวลาไม่สำเร็จ', 'error');
        }
      },
      'danger'
    );
  };

  const getFilteredTimeRecords = () => {
    let filteredRecords = timeRecords;
    
    // Filter by user name
    if (timeRecordFilters.userName.trim()) {
      const searchLower = timeRecordFilters.userName.toLowerCase();
      filteredRecords = filteredRecords.filter(record => {
        const userName = (record.userName || record.user_name || '').toLowerCase();
        return userName.includes(searchLower);
      });
    }
    
    // Filter by date range
    if (timeRecordFilters.dateRange.startDate && timeRecordFilters.dateRange.endDate) {
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        const start = new Date(timeRecordFilters.dateRange.startDate);
        const end = new Date(timeRecordFilters.dateRange.endDate);
        return recordDate >= start && recordDate <= end;
      });
    }
    
    return filteredRecords;
  };

  const getFilteredJobs = () => {
    let filteredJobs = jobs;
    
    // Filter by status
    if (currentFilter === 'open') {
      filteredJobs = filteredJobs.filter(job => job.status === 'open');
    } else if (currentFilter === 'closed') {
      filteredJobs = filteredJobs.filter(job => job.status === 'closed');
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredJobs = filteredJobs.filter(job => {
        const machineName = (job.machine_name || job.machineName || '').toLowerCase();
        const userName = (job.user_name || '').toLowerCase();
        const jobName = (job.job_name || '').toLowerCase();
        const openDate = job.open_date || job.openDate || '';
        
        return machineName.includes(searchLower) || 
               userName.includes(searchLower) || 
               jobName.includes(searchLower) ||
               openDate.includes(searchLower);
      });
    }
    
    return filteredJobs;
  };

  const openJobs = jobs.filter(job => job.status === 'open');

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
      typeof record?.regularMinutes === 'number' &&
      typeof record?.otMinutes === 'number' &&
      typeof record?.breakMinutes === 'number'
    ) {
      return {
        regularMinutes: Number.isFinite(record.regularMinutes) ? record.regularMinutes : 0,
        otMinutes: Number.isFinite(record.otMinutes) ? record.otMinutes : 0,
        breakMinutes: Number.isFinite(record.breakMinutes) ? record.breakMinutes : 0
      };
    }

    if (record?.date && record?.startTime && record?.endTime) {
      const startTime = normalizeTime(record.startTime);
      const endTime = normalizeTime(record.endTime);
      if (!startTime || !endTime) {
        return { regularMinutes: 0, otMinutes: 0, breakMinutes: 0 };
      }

      const startDateTime = new Date(`${record.date}T${startTime}`);
      const endDateTime = new Date(`${record.date}T${endTime}`);
      if (!Number.isFinite(startDateTime.getTime()) || !Number.isFinite(endDateTime.getTime())) {
        return { regularMinutes: 0, otMinutes: 0, breakMinutes: 0 };
      }
      const diffMinutes = Math.max(
        0,
        Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))
      );
      if (!Number.isFinite(diffMinutes)) {
        return { regularMinutes: 0, otMinutes: 0, breakMinutes: 0 };
      }
      const breakMinutes = diffMinutes > 8 * 60 ? 60 : 0;
      const workMinutes = Math.max(0, diffMinutes - breakMinutes);
      const regularMinutes = Math.min(workMinutes, 8 * 60);
      const otMinutes = Math.max(0, workMinutes - 8 * 60);
      return { regularMinutes, otMinutes, breakMinutes };
    }

    return { regularMinutes: 0, otMinutes: 0, breakMinutes: 0 };
  };

  const getTotals = (targetRecords) => {
    return targetRecords.reduce(
      (acc, record) => {
        const mins = computeRecordMinutes(record);
        acc.regularMinutes += mins.regularMinutes;
        acc.otMinutes += mins.otMinutes;
        acc.breakMinutes += mins.breakMinutes;
        return acc;
      },
      { regularMinutes: 0, otMinutes: 0, breakMinutes: 0 }
    );
  };

  const today = new Date().toISOString().split('T')[0];
  const allTimeTotals = getTotals(timeRecords);

  const handleGoogleLogin = async () => {
    setAuthStatus(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthStatus(prev => ({ 
        loading: false, 
        user: null, 
        allowed: false, 
        error: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่' 
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setJobs([]);
      setTimeRecords([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleViewDetail = (job) => {
    setSelectedJob(job);
  };

  const handleViewImage = (imageOrAlert) => {
    if (typeof imageOrAlert === 'object' && imageOrAlert.type === 'alert') {
      showAlert(imageOrAlert.title, imageOrAlert.message, imageOrAlert.alertType);
    } else {
      setSelectedImage(imageOrAlert);
    }
  };

  // Load time records with date filtering - only when date range changes (for summary page)
  useEffect(() => {
    const loadTimeRecords = async () => {
      try {
        let records = await getTimeRecords();
        
        // Apply date range filter only if dates are set
        if (dateRange.startDate && dateRange.endDate) {
          records = records.filter(record => {
            const recordDate = new Date(record.date);
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            return recordDate >= start && recordDate <= end;
          });
        }
        
        // Only update timeRecords if we're on summary page to avoid conflicts
        if (currentPage === 'summary') {
          setTimeRecords(records);
        }
      } catch (error) {
        console.error('Error loading time records for summary:', error);
      }
    };

    // Only run this effect when date range changes and we're on summary page
    if (authStatus.user && currentPage === 'summary' && (dateRange.startDate || dateRange.endDate)) {
      loadTimeRecords();
    }
  }, [authStatus.user, dateRange.startDate, dateRange.endDate, currentPage]);

  // Reload time records when new record is added
  useEffect(() => {
    // This effect is not needed since we now reload directly in handleAddTimeRecord
  }, []); // Empty dependency

  // Load jobs
  useEffect(() => {
    const loadData = async () => {
      try {
        const jobsData = await getJobs();
        setJobs(jobsData || []);
      } catch (error) {
        console.error('Error loading jobs:', error);
        showNotification('โหลดข้อมูลไม่สำเร็จ', 'error');
      }
    };

    loadData();
  }, [authStatus.user]);

  if (authStatus.loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
          <div className="text-lg font-semibold text-gray-800">กำลังตรวจสอบสิทธิ์...</div>
        </div>
      </div>
    );
  }

  if (!authStatus.user || !authStatus.allowed) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
          <div className="text-xl font-semibold text-gray-800 mb-2">เข้าสู่ระบบ</div>
          <div className="text-sm text-gray-600 mb-4">
            กรุณาเข้าสู่ระบบด้วย Google และต้องได้รับอนุญาตจากแอดมินก่อน
          </div>
          {authStatus.error && (
            <div className="mb-4 text-sm text-red-600">{authStatus.error}</div>
          )}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
          >
            Login ด้วย Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">ระบบจัดการการเปิด-ปิดงาน</h1>
            <p className="text-sm sm:text-base text-gray-600">Job Opening & Closing Management System</p>
          </div>
          
          {/* Navigation */}
          <div className="flex justify-center">
            <div className="inline-flex flex-col sm:flex-row rounded-lg border border-gray-200 bg-white p-1 w-full sm:w-auto max-w-sm sm:max-w-none">
              <button
                onClick={() => setCurrentPage('jobs')}
                className={`px-4 py-2 rounded-md flex items-center justify-center transition-colors w-full sm:w-auto ${
                  currentPage === 'jobs' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Home className="mr-2" size={16} />
                <span className="text-sm sm:text-base">จัดการงาน</span>
              </button>
              <button
                onClick={() => setCurrentPage('time')}
                className={`px-4 py-2 rounded-md flex items-center justify-center transition-colors w-full sm:w-auto ${
                  currentPage === 'time' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Clock className="mr-2" size={16} />
                <span className="text-sm sm:text-base">ลงเวลา</span>
              </button>
              <button
                onClick={() => setCurrentPage('summary')}
                className={`px-4 py-2 rounded-md flex items-center justify-center transition-colors w-full sm:w-auto ${
                  currentPage === 'summary' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="mr-2" size={16} />
                <span className="text-sm sm:text-base">สรุป</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500 truncate max-w-full">
              {authStatus.user.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-purple-600 hover:text-purple-800 text-xs sm:text-sm"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        {currentPage === 'jobs' ? (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mb-8">
              {/* Open Job Form */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <FolderPlus className="text-blue-600 mr-2" size={20} />
                  <h2 className="text-lg sm:text-xl font-semibold text-blue-600">เปิดงาน</h2>
                </div>
                <OpenJobForm onSubmit={handleOpenJob} electricalResponsibleUsers={electricalResponsibleUsers} />
              </div>

              {/* Close Job Form */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <FolderCheck className="text-green-600 mr-2" size={20} />
                  <h2 className="text-lg sm:text-xl font-semibold text-green-600">ปิดงาน</h2>
                </div>
                <CloseJobForm 
                  jobs={openJobs} 
                  onSubmit={handleCloseJob}
                />
              </div>
            </div>

            {/* Job List */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">รายการงาน</h2>
                
                {/* Search Input */}
                <div className="relative w-full lg:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="ค้นหางาน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-64"
                  />
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setCurrentFilter('all')}
                  className={`filter-btn px-3 sm:px-4 py-2 rounded-md text-white text-sm ${
                    currentFilter === 'all' ? 'bg-gray-600 active' : 'bg-gray-500'
                  }`}
                >
                  ทั้งหมด ({jobs.length})
                </button>
                <button
                  onClick={() => setCurrentFilter('open')}
                  className={`filter-btn px-3 sm:px-4 py-2 rounded-md text-white text-sm ${
                    currentFilter === 'open' ? 'bg-blue-600 active' : 'bg-blue-500'
                  }`}
                >
                  เปิด ({openJobs.length})
                </button>
                <button
                  onClick={() => setCurrentFilter('closed')}
                  className={`filter-btn px-3 sm:px-4 py-2 rounded-md text-white text-sm ${
                    currentFilter === 'closed' ? 'bg-green-600 active' : 'bg-green-500'
                  }`}
                >
                  ปิด ({jobs.filter(job => job.status === 'closed').length})
                </button>
              </div>
              
              <JobList 
                jobs={getFilteredJobs()}
                onDeleteJob={handleDeleteJob}
                onQuickClose={handleQuickClose}
                onViewImage={handleViewImage}
                onViewDetail={handleViewDetail}
              />
            </div>
          </> 
        ) : currentPage === 'time' ? (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mb-8">
              {/* Time Tracking Form */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <TimeTrackingForm 
                  onSubmit={handleAddTimeRecord}
                  timeRecords={timeRecords}
                  onShowAlert={showAlert}
                />
              </div>

              {/* Time Summary */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <Clock className="text-purple-600 mr-2" size={20} />
                  <h2 className="text-lg sm:text-xl font-semibold text-purple-600">สรุปเวลาทำงาน</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {timeRecords.filter(r => r.date === today).length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">รายการวันนี้</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      ปกติ {(allTimeTotals.regularMinutes / 60).toFixed(1)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">ชั่วโมง</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600">
                      OT {(allTimeTotals.otMinutes / 60).toFixed(1)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">ชั่วโมง</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {timeRecords.length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">รายการทั้งหมด</div>
                  </div>
                </div>
              </div>
            </div>

            <TimeRecordsList 
              records={getFilteredTimeRecords()}
              onDeleteRecord={handleDeleteTimeRecord}
              filters={timeRecordFilters}
              onFiltersChange={setTimeRecordFilters}
            />
          </>
        ) : currentPage === 'summary' ? (
          <>
            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center mb-4">
                <Calendar className="text-green-600 mr-3" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">กรองข้อมูลตามวันที่</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => setDateRange({ startDate: '', endDate: '' })}
                    className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    ล้างกรอง
                  </button>
                </div>
              </div>
            </div>

            <SummaryPage timeRecords={timeRecords} jobs={jobs} />
            
            {/* Debug Info */}
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-800">
                <div className="font-semibold mb-2">Debug Info:</div>
                <div>Time Records: {timeRecords.length}</div>
                <div>Jobs: {jobs.length}</div>
                <div>Date Range: {dateRange.startDate} - {dateRange.endDate}</div>
                <div>User: {authStatus.user?.email}</div>
              </div>
            </div>
          </>
        ) : null}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          image={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)}
          onAddAdditionalImages={handleAddAdditionalImages}
          onDeleteImage={handleDeleteImage}
        />
      )}

      {/* Notification */}
      {notification.show && (
        <Notification 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Custom Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Debug Info - Remove in production */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs">
        <div>Page: {currentPage}</div>
        <div>Jobs: {jobs.length}</div>
        <div>Time Records: {timeRecords.length}</div>
        <div>Date Range: {dateRange.startDate} - {dateRange.endDate}</div>
        <div>User: {authStatus.user?.email}</div>
      </div>
    </div>
  );
}

export default App;
