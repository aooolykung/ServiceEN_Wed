import React from 'react';
import { CalendarPlus, CalendarCheck, Trash2, ImageIcon, Eye, User } from 'lucide-react';

const JobList = ({ jobs, onDeleteJob, onQuickClose, onViewImage, onViewDetail }) => {
  const handleImageClick = (imageData) => {
    // Check if it's a blob URL that can't be loaded
    if (imageData.startsWith('blob:')) {
      // Show custom alert instead of trying to load the blob
      onViewImage && onViewImage({
        type: 'alert',
        title: 'รูปภาพไม่สามารถแสดง',
        message: 'รูปภาพนี้ไม่สามารถแสดงได้เนื่องจากเป็นข้อมูลเก่าที่จัดเก็บไม่ถูกต้อง กรุณาอัพโหลดรูปภาพใหม่ผ่านหน้ารายละเอียดงาน',
        alertType: 'warning'
      });
      return;
    }
    onViewImage && onViewImage(imageData);
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ImageIcon className="mx-auto text-4xl mb-2" />
        <p>ยังไม่มีรายการงาน</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map(job => (
        <div key={job.id} className={`job-card ${job.status} fade-in cursor-pointer hover:shadow-lg transition-shadow`}
             onClick={() => onViewDetail(job)}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                โดย: {job.user_name || 'Unknown'}
              </div>
              <h3 className="font-semibold text-lg text-gray-800">{job.machine_name || job.machineName}</h3>
            </div>
            <span className={`status-badge ${job.status}`}>
              {job.status === 'open' ? 'เปิด' : 'ปิดแล้ว'}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center">
              <CalendarPlus className="mr-1" size={14} />
              เปิด: {formatDate(job.open_date || job.openDate)}
            </div>
            {job.close_date && (
              <div className="flex items-center">
                <CalendarCheck className="mr-1" size={14} />
                ปิด: {formatDate(job.close_date)}
              </div>
            )}
            {job.electrical_responsible && (
              <div className="flex items-center">
                <User className="mr-1" size={14} />
                ไฟฟ้า: {job.electrical_responsible}
              </div>
            )}
          </div>
          
          {job.open_images && job.open_images.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">
                รูปภาพการเปิดงาน ({job.open_images.length})
              </p>
              <div className="thumbnail-grid">
                {job.open_images.slice(0, 6).map(img => (
                  <img
                    key={img.id}
                    src={img.data.startsWith('blob:') ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7DguLguLguLguLguLjwvdGV4dD48L3N2Zz4=' : img.data}
                    alt={img.name}
                    className="thumbnail"
                    onClick={() => handleImageClick(img.data)}
                  />
                ))}
                {job.open_images.length > 6 && (
                  <div className="thumbnail bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                    +{job.open_images.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {job.close_images && job.close_images.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">
                รูปภาพการปิดงาน ({job.close_images.length})
              </p>
              <div className="thumbnail-grid">
                {job.close_images.slice(0, 6).map(img => (
                  <img
                    key={img.id}
                    src={img.data.startsWith('blob:') ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7DguLguLguLguLguLjwvdGV4dD48L3N2Zz4=' : img.data}
                    alt={img.name}
                    className="thumbnail"
                    onClick={() => handleImageClick(img.data)}
                  />
                ))}
                {job.close_images.length > 6 && (
                  <div className="thumbnail bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                    +{job.close_images.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(job);
              }}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center"
            >
              <Eye className="mr-1" size={12} />
              ดูรายละเอียด
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteJob(job.id);
              }}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 className="mr-1" size={12} />
              ลบ
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobList;
