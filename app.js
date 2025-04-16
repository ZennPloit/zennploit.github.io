class LinkTracker {
    constructor() {
        this.initElements();
        this.initEvents();
        this.checkDashboardView();
    }
    
    initElements() {
        // Form elements
        this.targetUrlInput = document.getElementById('target-url');
        this.campaignNameInput = document.getElementById('campaign-name');
        this.securityLevelSelect = document.getElementById('security-level');
        this.customMessageTextarea = document.getElementById('custom-message');
        this.generateBtn = document.getElementById('generate-btn');
        this.resultContainer = document.getElementById('result-container');
        this.linkText = document.getElementById('link-text');
        this.copyBtn = document.getElementById('copy-btn');
        this.downloadQrBtn = document.getElementById('download-qr');
        this.qrCodeElement = document.getElementById('qr-code');
        this.notification = document.getElementById('notification');
        
        // Dashboard elements
        this.dashboardSection = document.getElementById('dashboard-section');
        this.creatorSection = document.getElementById('creator-section');
        this.newTrackerBtn = document.getElementById('new-tracker-btn');
        this.trackersTableBody = document.getElementById('trackers-table-body');
        this.totalClicksEl = document.getElementById('total-clicks');
        this.uniqueVisitorsEl = document.getElementById('unique-visitors');
        this.conversionRateEl = document.getElementById('conversion-rate');
        this.avgRiskEl = document.getElementById('avg-risk');
        
        // Expiry options
        this.expiryOptions = document.querySelectorAll('.expiry-option');
        this.customExpiryInput = document.getElementById('custom-expiry-days');
    }
    
    initEvents() {
        // Form submission
        this.generateBtn.addEventListener('click', () => this.generateTracker());
        
        // Copy button
        this.copyBtn.addEventListener('click', () => this.copyToClipboard(this.linkText.textContent, 'Tracking link copied!'));
        
        // Download QR code
        this.downloadQrBtn.addEventListener('click', () => this.downloadQRCode());
        
        // New tracker button
        this.newTrackerBtn.addEventListener('click', () => this.showCreator());
        
        // Expiry options
        this.expiryOptions.forEach(option => {
            option.addEventListener('click', () => this.selectExpiryOption(option));
        });
    }
    
    checkDashboardView() {
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view');
        const trackingId = urlParams.get('tid');
        
        if (view === 'dashboard' && trackingId) {
            this.showDashboard(trackingId);
        } else {
            this.loadTrackersTable();
            this.updateDashboardStats();
        }
    }
    
    selectExpiryOption(option) {
        this.expiryOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        if (option.dataset.days === 'custom') {
            this.customExpiryInput.classList.remove('hidden');
        } else {
            this.customExpiryInput.classList.add('hidden');
        }
    }
    
    generateTracker() {
        const targetUrl = this.targetUrlInput.value.trim();
        const campaignName = this.campaignNameInput.value.trim();
        const customMessage = this.customMessageTextarea.value.trim();
        const securityLevel = this.securityLevelSelect.value;
        
        // Get selected expiry
        const selectedExpiry = document.querySelector('.expiry-option.selected');
        let expiryDays = 0;
        if (selectedExpiry.dataset.days === 'custom') {
            expiryDays = parseInt(this.customExpiryInput.value) || 0;
        } else {
            expiryDays = parseInt(selectedExpiry.dataset.days) || 0;
        }
        
        // Validate URL
        if (!this.validateUrl(targetUrl)) {
            this.showNotification('Please enter a valid URL (include http:// or https://)', 'error');
            return;
        }
        
        // Generate tracking ID
        const trackingId = this.generateTrackingId();
        
        // Create tracking URL
        const currentUrl = window.location.href.split('/').slice(0, -1).join('/');
        const trackingUrl = `${currentUrl}/redirect.html?tid=${trackingId}&target=${encodeURIComponent(targetUrl)}`;
        
        // Add optional parameters
        const params = new URLSearchParams();
        if (campaignName) params.append('campaign', encodeURIComponent(campaignName));
        if (customMessage) params.append('message', encodeURIComponent(customMessage));
        params.append('security', securityLevel);
        if (expiryDays > 0) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + expiryDays);
            params.append('expiry', expiryDate.toISOString());
        }
        
        const fullTrackingUrl = `${trackingUrl}&${params.toString()}`;
        const dashboardUrl = `${window.location.origin}${window.location.pathname}?view=dashboard&tid=${trackingId}`;
        
        // Display results
        this.linkText.textContent = fullTrackingUrl;
        this.resultContainer.classList.add('show');
        
        // Generate QR code
        this.generateQRCode(fullTrackingUrl);
        
        // Save tracker
        this.saveTracker({
            id: trackingId,
            targetUrl,
            campaignName,
            customMessage,
            securityLevel,
            expiryDate: expiryDays > 0 ? new Date(new Date().getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null,
            createdAt: new Date().toISOString(),
            clicks: 0,
            locations: [],
            visitors: []
        });
        
        // Update UI
        this.loadTrackersTable();
        this.updateDashboardStats();
    }
    
    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    generateTrackingId() {
        return 'trk-' + Math.random().toString(36).substr(2, 16) + '-' + Date.now().toString(36);
    }
    
    generateQRCode(url) {
        this.qrCodeElement.innerHTML = '';
        new QRCode(this.qrCodeElement, {
            text: url,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    
    downloadQRCode() {
        const canvas = this.qrCodeElement.querySelector('canvas');
        if (!canvas) return;
        
        const link = document.createElement('a');
        link.download = 'tracking-qr-code.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    copyToClipboard(text, successMessage) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification(successMessage);
            this.copyBtn.innerHTML = '<i class="icon-check"></i>';
            setTimeout(() => {
                this.copyBtn.innerHTML = '<i class="icon-copy"></i>';
            }, 2000);
        }).catch(err => {
            this.showNotification('Failed to copy: ' + err, 'error');
        });
    }
    
    saveTracker(tracker) {
        let allTrackers = JSON.parse(localStorage.getItem('trackers') || '[]');
        allTrackers.push(tracker);
        localStorage.setItem('trackers', JSON.stringify(allTrackers));
    }
    
    loadTrackersTable() {
        const trackers = JSON.parse(localStorage.getItem('trackers') || '[]');
        this.trackersTableBody.innerHTML = '';
        
        if (trackers.length === 0) {
            this.trackersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">No trackers created yet</td>
                </tr>
            `;
            return;
        }
        
        trackers.forEach(tracker => {
            const isExpired = tracker.expiryDate && new Date(tracker.expiryDate) < new Date();
            const statusClass = isExpired ? 'expired' : 'active';
            const statusText = isExpired ? 'Expired' : 'Active';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tracker.campaignName || 'Untitled'}</td>
                <td class="truncate">${tracker.targetUrl}</td>
                <td>${tracker.clicks || 0}</td>
                <td>${tracker.locations?.length || 0}</td>
                <td>${new Date(tracker.createdAt).toLocaleDateString()}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="actions">
                    <button class="icon-btn view-btn" data-id="${tracker.id}">
                        <i class="icon-eye"></i>
                    </button>
                    <button class="icon-btn stats-btn" data-id="${tracker.id}">
                        <i class="icon-chart"></i>
                    </button>
                </td>
            `;
            this.trackersTableBody.appendChild(row);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.viewTracker(btn.dataset.id));
        });
        
        document.querySelectorAll('.stats-btn').forEach(btn => {
            btn.addEventListener('click', () => this.viewStats(btn.dataset.id));
        });
    }
    
    viewTracker(trackerId) {
        window.location.href = `?view=dashboard&tid=${trackerId}`;
    }
    
    viewStats(trackerId) {
        // Implement detailed stats view
        this.showNotification('Showing stats for tracker: ' + trackerId);
    }
    
    updateDashboardStats() {
        const trackers = JSON.parse(localStorage.getItem('trackers') || '[]');
        const trackingData = JSON.parse(localStorage.getItem('trackingData') || '[]');
        
        // Calculate stats
        const totalClicks = trackers.reduce((sum, t) => sum + (t.clicks || 0), 0);
        const uniqueVisitors = new Set(trackingData.map(t => t.userAgent)).size;
        const conversionRate = trackers.length > 0 ? Math.round((totalClicks / trackers.length) * 100) : 0;
        const avgRisk = trackingData.length > 0 ? 
            Math.round(trackingData.reduce((sum, t) => sum + (t.aiVerification?.riskScore || 0), 0) / trackingData.length) : 
            0;
        
        // Update UI
        this.totalClicksEl.textContent = totalClicks;
        this.uniqueVisitorsEl.textContent = uniqueVisitors;
        this.conversionRateEl.textContent = conversionRate + '%';
        this.avgRiskEl.textContent = avgRisk.toFixed(1);
    }
    
    showDashboard(trackingId) {
        this.creatorSection.style.display = 'none';
        this.dashboardSection.style.display = 'block';
        
        // Load tracker data and display detailed dashboard
        const tracker = this.getTrackerById(trackingId);
        if (!tracker) {
            this.showNotification('Tracker not found', 'error');
            return;
        }
        
        // Update dashboard with tracker details
        // Implement detailed dashboard view
    }
    
    getTrackerById(id) {
        const trackers = JSON.parse(localStorage.getItem('trackers') || '[]');
        return trackers.find(t => t.id === id);
    }
    
    showCreator() {
        this.creatorSection.style.display = 'block';
        this.dashboardSection.style.display = 'none';
        window.history.pushState({}, '', window.location.pathname);
    }
    
    showNotification(message, type = 'success') {
        this.notification.textContent = message;
        this.notification.className = 'notification ' + type;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const tracker = new LinkTracker();
});