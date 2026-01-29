// Job Management System JavaScript
class JobManager {
    constructor() {
        this.jobs = this.loadJobs();
        this.currentFilter = 'all';
        this.openImageData = [];
        this.closeImageData = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.renderJobList();
        this.updateJobSelect();
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('openJobForm').addEventListener('submit', (e) => this.handleOpenJob(e));
        document.getElementById('closeJobForm').addEventListener('submit', (e) => this.handleCloseJob(e));

        // Image uploads
        document.getElementById('openImages').addEventListener('change', (e) => this.handleImageUpload(e, 'open'));
        document.getElementById('closeImages').addEventListener('change', (e) => this.handleImageUpload(e, 'close'));

        // Modal close
        document.getElementById('imageModal').addEventListener('click', (e) => {
            if (e.target.id === 'imageModal') {
                this.closeImageModal();
            }
        });
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('openDate').value = today;
        document.getElementById('closeDate').value = today;
    }

    handleImageUpload(event, type) {
        const files = Array.from(event.target.files);
        const previewContainer = type === 'open' ? 
            document.getElementById('openImagePreview') : 
            document.getElementById('closeImagePreview');
        
        const imageData = type === 'open' ? this.openImageData : this.closeImageData;

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageId = Date.now() + Math.random();
                    imageData.push({
                        id: imageId,
                        name: file.name,
                        data: e.target.result
                    });
                    this.renderImagePreview(previewContainer, imageData, type);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    renderImagePreview(container, imageData, type) {
        container.innerHTML = imageData.map(img => `
            <div class="image-preview">
                <img src="${img.data}" alt="${img.name}" onclick="jobManager.viewImage('${img.data}')">
                <button type="button" class="remove-btn" onclick="jobManager.removeImage('${img.id}', '${type}')">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `).join('');
    }

    removeImage(imageId, type) {
        const imageData = type === 'open' ? this.openImageData : this.closeImageData;
        const index = imageData.findIndex(img => img.id == imageId);
        if (index > -1) {
            imageData.splice(index, 1);
            const previewContainer = type === 'open' ? 
                document.getElementById('openImagePreview') : 
                document.getElementById('closeImagePreview');
            this.renderImagePreview(previewContainer, imageData, type);
        }
    }

    viewImage(imageSrc) {
        document.getElementById('modalImage').src = imageSrc;
        document.getElementById('imageModal').classList.remove('hidden');
    }

    closeImageModal() {
        document.getElementById('imageModal').classList.add('hidden');
    }

    handleOpenJob(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const job = {
            id: Date.now(),
            machineName: formData.get('machineName'),
            openDate: formData.get('openDate'),
            openImages: [...this.openImageData],
            status: 'open',
            createdAt: new Date().toISOString()
        };

        this.jobs.push(job);
        this.saveJobs();
        this.renderJobList();
        this.updateJobSelect();
        
        // Reset form
        event.target.reset();
        this.setDefaultDates();
        this.openImageData = [];
        document.getElementById('openImagePreview').innerHTML = '';
        
        this.showNotification('เปิดงานสำเร็จ!', 'success');
    }

    handleCloseJob(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const jobId = parseInt(formData.get('jobSelect'));
        
        const jobIndex = this.jobs.findIndex(job => job.id === jobId);
        if (jobIndex > -1) {
            this.jobs[jobIndex].status = 'closed';
            this.jobs[jobIndex].closeDate = formData.get('closeDate');
            this.jobs[jobIndex].closeImages = [...this.closeImageData];
            this.jobs[jobIndex].closedAt = new Date().toISOString();
            
            this.saveJobs();
            this.renderJobList();
            this.updateJobSelect();
            
            // Reset form
            event.target.reset();
            this.setDefaultDates();
            this.closeImageData = [];
            document.getElementById('closeImagePreview').innerHTML = '';
            
            this.showNotification('ปิดงานสำเร็จ!', 'success');
        }
    }

    renderJobList() {
        const jobListContainer = document.getElementById('jobList');
        const emptyState = document.getElementById('emptyState');
        
        let filteredJobs = this.jobs;
        if (this.currentFilter === 'open') {
            filteredJobs = this.jobs.filter(job => job.status === 'open');
        } else if (this.currentFilter === 'closed') {
            filteredJobs = this.jobs.filter(job => job.status === 'closed');
        }

        if (filteredJobs.length === 0) {
            jobListContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        jobListContainer.innerHTML = filteredJobs.map(job => this.createJobCard(job)).join('');
    }

    createJobCard(job) {
        const statusClass = job.status === 'open' ? 'open' : 'closed';
        const statusText = job.status === 'open' ? 'เปิด' : 'ปิดแล้ว';
        const statusColor = job.status === 'open' ? 'blue' : 'green';
        
        const openDate = new Date(job.openDate).toLocaleDateString('th-TH');
        const closeDate = job.closeDate ? new Date(job.closeDate).toLocaleDateString('th-TH') : '-';

        return `
            <div class="job-card ${statusClass} fade-in">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-semibold text-lg text-gray-800">${job.machineName}</h3>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                
                <div class="text-sm text-gray-600 space-y-1">
                    <div><i class="bi bi-calendar-plus"></i> เปิด: ${openDate}</div>
                    ${job.closeDate ? `<div><i class="bi bi-calendar-check"></i> ปิด: ${closeDate}</div>` : ''}
                </div>
                
                ${job.openImages && job.openImages.length > 0 ? `
                    <div class="mt-3">
                        <p class="text-xs text-gray-500 mb-1">รูปภาพการเปิดงาน (${job.openImages.length})</p>
                        <div class="thumbnail-grid">
                            ${job.openImages.slice(0, 6).map(img => 
                                `<img src="${img.data}" alt="${img.name}" class="thumbnail" onclick="jobManager.viewImage('${img.data}')">`
                            ).join('')}
                            ${job.openImages.length > 6 ? `
                                <div class="thumbnail bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                    +${job.openImages.length - 6}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${job.closeImages && job.closeImages.length > 0 ? `
                    <div class="mt-3">
                        <p class="text-xs text-gray-500 mb-1">รูปภาพการปิดงาน (${job.closeImages.length})</p>
                        <div class="thumbnail-grid">
                            ${job.closeImages.slice(0, 6).map(img => 
                                `<img src="${img.data}" alt="${img.name}" class="thumbnail" onclick="jobManager.viewImage('${img.data}')">`
                            ).join('')}
                            ${job.closeImages.length > 6 ? `
                                <div class="thumbnail bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                    +${job.closeImages.length - 6}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="mt-3 flex gap-2">
                    ${job.status === 'open' ? `
                        <button onclick="jobManager.quickCloseJob(${job.id})" 
                                class="text-xs bg-${statusColor}-600 text-white px-3 py-1 rounded hover:bg-${statusColor}-700">
                            <i class="bi bi-check-circle"></i> ปิดงาน
                        </button>
                    ` : ''}
                    <button onclick="jobManager.deleteJob(${job.id})" 
                            class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                        <i class="bi bi-trash"></i> ลบ
                    </button>
                </div>
            </div>
        `;
    }

    updateJobSelect() {
        const jobSelect = document.getElementById('jobSelect');
        const openJobs = this.jobs.filter(job => job.status === 'open');
        
        jobSelect.innerHTML = '<option value="">-- เลือกงาน --</option>' +
            openJobs.map(job => `
                <option value="${job.id}">
                    ${job.machineName} - ${new Date(job.openDate).toLocaleDateString('th-TH')}
                </option>
            `).join('');
    }

    quickCloseJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
            document.getElementById('jobSelect').value = jobId;
            document.getElementById('closeDate').value = new Date().toISOString().split('T')[0];
            
            // Scroll to close form
            document.getElementById('closeJobForm').scrollIntoView({ behavior: 'smooth' });
        }
    }

    deleteJob(jobId) {
        if (confirm('คุณแน่ใจว่าต้องการลบงานนี้?')) {
            const index = this.jobs.findIndex(job => job.id === jobId);
            if (index > -1) {
                this.jobs.splice(index, 1);
                this.saveJobs();
                this.renderJobList();
                this.updateJobSelect();
                this.showNotification('ลบงานสำเร็จ', 'success');
            }
        }
    }

    filterJobs(filter) {
        this.currentFilter = filter;
        this.renderJobList();
        
        // Update filter button styles
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500');
        });
        event.target.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 fade-in ${
            type === 'success' ? 'bg-green-600' : 'bg-blue-600'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-info-circle'} mr-2"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveJobs() {
        localStorage.setItem('jobs', JSON.stringify(this.jobs));
    }

    loadJobs() {
        const saved = localStorage.getItem('jobs');
        return saved ? JSON.parse(saved) : [];
    }
}

// Global functions for inline event handlers
function filterJobs(filter) {
    jobManager.filterJobs(filter);
}

function closeImageModal() {
    jobManager.closeImageModal();
}

// Initialize the application
let jobManager;
document.addEventListener('DOMContentLoaded', () => {
    jobManager = new JobManager();
});
