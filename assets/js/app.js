document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const linkText = document.getElementById('link-text');
    const dashboardText = document.getElementById('dashboard-text');
    const copyBtn = document.getElementById('copy-btn');
    const copyDashboardBtn = document.getElementById('copy-dashboard-btn');
    const creatorSection = document.getElementById('creator-section');
    const dashboardContainer = document.getElementById('dashboard-container');
    const backToCreatorBtn = document.getElementById('back-to-creator');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const expiryOptions = document.querySelectorAll('.expiry-option');
    const customExpiryInput = document.getElementById('custom-expiry-days');
    const qrCodeElement = document.getElementById('qr-code');
    const downloadQrBtn = document.getElementById('download-qr');
    const notification = document.getElementById('notification');
    
    // Check if we should show dashboard
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    const trackingId = urlParams.get('tid');
    
    if (view === 'dashboard' && trackingId) {
        showDashboard(trackingId);
    }
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.getAttribute('data-tab') === tabName) {
                    content.classList.add('active');
                    
                    // Load specific tab data when selected
                    const tracker = getCurrentTracker();
                    if (tracker) {
                        switch(tabName) {
                            case 'devices':
                                updateDevicesTab(tracker);
                                break;
                            case 'analysis':
                                updateAnalysisTab(tracker);
                                break;
                        }
                    }
                }
            });
        });
    });
    
    // Expiry options
    expiryOptions.forEach(option => {
        option.addEventListener('click', function() {
            expiryOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            if (this.dataset.days === 'custom') {
                customExpiryInput.classList.remove('hidden');
            } else {
                customExpiryInput.classList.add('hidden');
            }
        });
    });
    
    // Generate random tracking ID
    function generateTrackingId() {
        return 'trk-' + Math.random().toString(36).substr(2, 16) + '-' + Date.now().toString(36);
    }
    
    // Generate QR code
    function generateQRCode(url) {
        qrCodeElement.innerHTML = '';
        new QRCode(qrCodeElement, {
            text: url,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    
    // Download QR code
    downloadQrBtn.addEventListener('click', function() {
        const canvas = qrCodeElement.querySelector('canvas');
        if (!canvas) return;
        
        const link = document.createElement('a');
        link.download = 'tracking-qr-code.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    // Show notification
    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    generateBtn.addEventListener('click', function() {
        const targetUrl = document.getElementById('target-url').value.trim();
        const campaignName = document.getElementById('campaign-name').value.trim();
        const customMessage = document.getElementById('custom-message').value.trim();
        const securityLevel = document.getElementById('security-level').value;
        
        // Get selected expiry
        const selectedExpiry = document.querySelector('.expiry-option.selected');
        let expiryDays = 0;
        if (selectedExpiry.dataset.days === 'custom') {
            expiryDays = parseInt(customExpiryInput.value) || 0;
        } else {
            expiryDays = parseInt(selectedExpiry.dataset.days) || 0;
        }
        
        if (!targetUrl) {
            showNotification('Please enter a destination URL');
            return;
        }
        
        // Validate URL
        try {
            new URL(targetUrl);
        } catch (e) {
            showNotification('Please enter a valid URL (include http:// or https://)');
            return;
        }
        
        // Generate tracking ID
        const trackingId = generateTrackingId();
        
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
        linkText.textContent = fullTrackingUrl;
        dashboardText.textContent = dashboardUrl;
        resultContainer.classList.add('show');
        
        // Generate QR code
        generateQRCode(fullTrackingUrl);
        
        // Store in localStorage for the dashboard
        const trackingData = {
            id: trackingId,
            targetUrl: targetUrl,
            campaignName: campaignName,
            customMessage: customMessage,
            securityLevel: securityLevel,
            expiryDate: expiryDays > 0 ? new Date(new Date().getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null,
            createdAt: new Date().toISOString(),
            clicks: 0,
            locations: [],
            visitors: []
        };
        
        let allTrackers = JSON.parse(localStorage.getItem('trackers') || '[]');
        allTrackers.push(trackingData);
        localStorage.setItem('trackers', JSON.stringify(allTrackers));
    });
    
    // Copy functionality
    copyBtn.addEventListener('click', function() {
        const text = linkText.textContent;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Tracking link copied!');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
            }, 2000);
        }).catch(err => {
            showNotification('Failed to copy: ' + err);
        });
    });
    
    copyDashboardBtn.addEventListener('click', function() {
        const text = dashboardText.textContent;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Dashboard link copied!');
            copyDashboardBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyDashboardBtn.textContent = 'Copy';
            }, 2000);
        }).catch(err => {
            showNotification('Failed to copy: ' + err);
        });
    });
    
    // Back to creator button
    backToCreatorBtn.addEventListener('click', function() {
        creatorSection.style.display = 'block';
        dashboardContainer.classList.remove('show');
        window.history.pushState({}, '', window.location.pathname);
    });
    
    // Get current tracker from URL
    function getCurrentTracker() {
        const urlParams = new URLSearchParams(window.location.search);
        const trackingId = urlParams.get('tid');
        
        if (!trackingId) return null;
        
        let allTrackers = JSON.parse(localStorage.getItem('trackers') || '[]');
        return allTrackers.find(t => t.id === trackingId);
    }
    
    // Show dashboard function
    function showDashboard(trackingId) {
        creatorSection.style.display = 'none';
        dashboardContainer.classList.add('show');
        
        let allTrackers = JSON.parse(localStorage.getItem('trackers') || '[]');
        const tracker = allTrackers.find(t => t.id === trackingId);
        
        if (!tracker) {
            document.getElementById('tracker-summary').innerHTML = `
                <div class="no-data">
                    <h3>No tracking data found</h3>
                    <p>The tracking ID you requested does not exist or has no data yet.</p>
                </div>
            `;
            return;
        }
        
        // Load tracking data
        let trackingData = JSON.parse(localStorage.getItem('trackingData') || '[]');
        tracker.visitors = trackingData.filter(t => t.id === trackingId);
        tracker.clicks = tracker.visitors.length;
        
        // Update all tabs
        updateSummaryTab(tracker);
        updateVisitorsTab(tracker);
        updateLocationsTab(tracker);
        updateDevicesTab(tracker);
        updateAnalysisTab(tracker);
    }
    
    function updateSummaryTab(tracker) {
        const summaryEl = document.getElementById('tracker-summary');
        const locations = tracker.visitors.filter(v => v.location).map(v => v.location);
        const uniqueLocations = [...new Set(locations.map(l => `${l.latitude},${l.longitude}`))];
        const uniqueIps = [...new Set(tracker.visitors.map(v => v.ipInfo?.ip))].filter(ip => ip);
        const uniqueDevices = [...new Set(tracker.visitors.map(v => v.userAgent))].length;
        
        summaryEl.innerHTML = `
            <div class="tracker-card">
                <div class="tracker-header">
                    <h2>${tracker.campaignName || 'Untitled Campaign'}</h2>
                    <div class="tracker-stats">
                        <div class="stat-box">
                            <div class="stat-value">${tracker.clicks || 0}</div>
                            <div class="stat-label">CLICKS</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${uniqueLocations.length}</div>
                            <div class="stat-label">LOCATIONS</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${uniqueIps.length}</div>
                            <div class="stat-label">UNIQUE IPs</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${uniqueDevices}</div>
                            <div class="stat-label">DEVICES</div>
                        </div>
                    </div>
                </div>
                
                <div class="tracker-details">
                    <div class="detail-card">
                        <div class="detail-title">DESTINATION URL</div>
                        <div class="detail-value">${tracker.targetUrl}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-title">CREATED</div>
                        <div class="detail-value">${new Date(tracker.createdAt).toLocaleString()}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-title">SECURITY LEVEL</div>
                        <div class="detail-value">${tracker.securityLevel.toUpperCase()}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-title">TRACKING ID</div>
                        <div class="detail-value">${tracker.id}</div>
                    </div>
                </div>
                
                <div class="map-container">
                    <div class="map-placeholder">
                        <div>
                            <h3>Location Heatmap</h3>
                            <p>${uniqueLocations.length} unique locations detected</p>
                        </div>
                    </div>
                </div>
                
                <h3>Recent Activity</h3>
                <table class="visitor-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Device</th>
                            <th>Location</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tracker.visitors.slice(0, 5).map(visitor => `
                            <tr>
                                <td>${new Date(visitor.timestamp).toLocaleTimeString()}</td>
                                <td>${getDeviceName(visitor.userAgent)}</td>
                                <td>
                                    ${visitor.location ? 
                                        `${visitor.location.latitude.toFixed(4)}, ${visitor.location.longitude.toFixed(4)}` : 
                                        'Unknown'}
                                </td>
                                <td>
                                    <span class="badge ${
                                        visitor.aiVerification?.verificationPassed ? 'badge-success' : 'badge-danger'
                                    }">
                                        ${visitor.aiVerification?.verificationPassed ? 'Verified' : 'Suspicious'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    function updateVisitorsTab(tracker) {
        const tableBody = document.getElementById('visitor-table-body');
        
        if (tracker.visitors.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">No visitor data available yet</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = tracker.visitors.map(visitor => `
            <tr>
                <td>${new Date(visitor.timestamp).toLocaleString()}</td>
                <td>${getDeviceName(visitor.userAgent)}</td>
                <td>
                    ${visitor.location ? 
                        `${visitor.location.latitude.toFixed(4)}, ${visitor.location.longitude.toFixed(4)}` : 
                        'Unknown'}
                </td>
                <td>${visitor.ipInfo?.ip || 'Unknown'}</td>
                <td>
                    <span class="badge ${
                        visitor.aiVerification?.verificationPassed ? 'badge-success' : 
                        visitor.aiVerification?.riskScore > 50 ? 'badge-warning' : 'badge-danger'
                    }">
                        ${visitor.aiVerification?.verificationPassed ? 'Verified' : 
                         visitor.aiVerification?.riskScore > 50 ? 'Suspicious' : 'High Risk'}
                    </span>
                </td>
            </tr>
        `).join('');
    }
    
    function updateLocationsTab(tracker) {
        const locationDataEl = document.getElementById('location-data');
        const locations = tracker.visitors.filter(v => v.location);
        
        if (locations.length === 0) {
            locationDataEl.innerHTML = `
                <div class="no-data">
                    <h3>No location data available</h3>
                    <p>No visitors have shared their location yet.</p>
                </div>
            `;
            return;
        }
        
        locationDataEl.innerHTML = `
            <h3>Location Details</h3>
            <table class="visitor-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Coordinates</th>
                        <th>Accuracy</th>
                        <th>Address</th>
                        <th>Device</th>
                    </tr>
                </thead>
                <tbody>
                    ${locations.map(loc => `
                        <tr>
                            <td>${new Date(loc.timestamp).toLocaleTimeString()}</td>
                            <td>${loc.location.latitude.toFixed(6)}, ${loc.location.longitude.toFixed(6)}</td>
                            <td>±${Math.round(loc.location.accuracy)} meters</td>
                            <td>
                                ${loc.address ? 
                                    `${loc.address.street}, ${loc.address.city}, ${loc.address.country}` : 
                                    'Unknown'}
                            </td>
                            <td>${getDeviceName(loc.userAgent)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    function updateDevicesTab(tracker) {
        const deviceInfoEl = document.getElementById('device-info-content');
        
        if (tracker.visitors.length === 0) {
            deviceInfoEl.innerHTML = `
                <div class="no-data">
                    <h3>No device data available</h3>
                    <p>No visitors have been tracked yet.</p>
                </div>
            `;
            return;
        }
        
        // Group devices by user agent
        const deviceGroups = {};
        tracker.visitors.forEach(visitor => {
            if (!deviceGroups[visitor.userAgent]) {
                deviceGroups[visitor.userAgent] = {
                    count: 0,
                    firstSeen: visitor.timestamp,
                    lastSeen: visitor.timestamp,
                    locations: [],
                    ipAddresses: new Set(),
                    aiStatus: []
                };
            }
            
            deviceGroups[visitor.userAgent].count++;
            deviceGroups[visitor.userAgent].lastSeen = visitor.timestamp;
            if (visitor.ipInfo?.ip) deviceGroups[visitor.userAgent].ipAddresses.add(visitor.ipInfo.ip);
            if (visitor.location) deviceGroups[visitor.userAgent].locations.push(visitor.location);
            if (visitor.aiVerification) deviceGroups[visitor.userAgent].aiStatus.push(visitor.aiVerification);
        });
        
        // Calculate device stats
        const deviceStats = Object.entries(deviceGroups).map(([userAgent, data]) => {
            const aiScores = data.aiStatus.map(a => a.riskScore);
            const avgRiskScore = aiScores.length ? 
                (aiScores.reduce((a, b) => a + b, 0) / aiScores.length) : 
                0;
            
            const suspiciousCount = data.aiStatus.filter(a => !a.verificationPassed).length;
            const verificationRate = data.aiStatus.length ? 
                Math.round((1 - suspiciousCount/data.aiStatus.length) * 100) : 
                0;
            
            return {
                userAgent,
                count: data.count,
                firstSeen: data.firstSeen,
                lastSeen: data.lastSeen,
                ipCount: data.ipAddresses.size,
                locationCount: data.locations.length,
                avgRiskScore,
                verificationRate
            };
        });
        
        deviceInfoEl.innerHTML = `
            <div class="device-info-grid">
                <div class="device-info-card">
                    <div class="detail-title">UNIQUE DEVICES</div>
                    <div class="detail-value">${deviceStats.length}</div>
                </div>
                <div class="device-info-card">
                    <div class="detail-title">TOTAL ACCESSES</div>
                    <div class="detail-value">${tracker.visitors.length}</div>
                </div>
                <div class="device-info-card">
                    <div class="detail-title">AVG RISK SCORE</div>
                    <div class="detail-value">${calculateAverage(deviceStats.map(d => d.avgRiskScore))}</div>
                </div>
                <div class="device-info-card">
                    <div class="detail-title">VERIFICATION RATE</div>
                    <div class="detail-value">${calculateAverage(deviceStats.map(d => d.verificationRate))}%</div>
                </div>
            </div>
            
            <h3 style="margin-top: 1.5rem;">Device List</h3>
            <table class="visitor-table">
                <thead>
                    <tr>
                        <th>Device</th>
                        <th>Accesses</th>
                        <th>IPs</th>
                        <th>Locations</th>
                        <th>Risk Score</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${deviceStats.map(device => `
                        <tr>
                            <td>${getDeviceName(device.userAgent)}</td>
                            <td>${device.count}</td>
                            <td>${device.ipCount}</td>
                            <td>${device.locationCount}</td>
                            <td>${device.avgRiskScore.toFixed(1)}</td>
                            <td>
                                <span class="badge ${
                                    device.verificationRate > 70 ? 'badge-success' : 
                                    device.verificationRate > 30 ? 'badge-warning' : 'badge-danger'
                                }">
                                    ${device.verificationRate > 70 ? 'Trusted' : 
                                     device.verificationRate > 30 ? 'Suspicious' : 'High Risk'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    function updateAnalysisTab(tracker) {
        const analysisEl = document.getElementById('ai-analysis-results');
        const visitors = tracker.visitors;
        
        if (visitors.length === 0) {
            analysisEl.innerHTML = `
                <div class="no-data">
                    <h3>No analysis data available</h3>
                    <p>No visitors have been analyzed yet.</p>
                </div>
            `;
            return;
        }
        
        const suspiciousCount = visitors.filter(v => !v.aiVerification?.verificationPassed).length;
        const verifiedCount = visitors.length - suspiciousCount;
        const riskScoreAvg = visitors.reduce((sum, v) => sum + (v.aiVerification?.riskScore || 0), 0) / visitors.length;
        const botDetections = visitors.filter(v => v.aiVerification?.botDetection === "Suspicious").length;
        
        analysisEl.innerHTML = `
            <div class="tracker-details">
                <div class="detail-card">
                    <div class="detail-title">TOTAL VISITORS</div>
                    <div class="detail-value">${visitors.length}</div>
                </div>
                <div class="detail-card">
                    <div class="detail-title">VERIFIED</div>
                    <div class="detail-value">${verifiedCount} (${Math.round(verifiedCount/visitors.length*100)}%)</div>
                </div>
                <div class="detail-card">
                    <div class="detail-title">SUSPICIOUS</div>
                    <div class="detail-value">${suspiciousCount} (${Math.round(suspiciousCount/visitors.length*100)}%)</div>
                </div>
                <div class="detail-card">
                    <div class="detail-title">BOT DETECTIONS</div>
                    <div class="detail-value">${botDetections} (${Math.round(botDetections/visitors.length*100)}%)</div>
                </div>
            </div>
            
            <h4>Overall Risk Assessment</h4>
            <div class="ai-score">
                <div class="ai-score-bar" style="width: ${riskScoreAvg}%"></div>
            </div>
            <p style="text-align: right; margin-top: 0.5rem;">${getRiskAssessment(riskScoreAvg)}</p>
            
            <h4 style="margin-top: 1.5rem;">Threat Breakdown</h4>
            <div class="tracker-details">
                <div class="detail-card">
                    <div class="detail-title">HIGH RISK VISITORS</div>
                    <div class="detail-value">${visitors.filter(v => v.aiVerification?.riskScore > 70).length}</div>
                </div>
                <div class="detail-card">
                    <div class="detail-title">POTENTIAL BOTS</div>
                    <div class="detail-value">${visitors.filter(v => v.aiVerification?.botDetection === "Suspicious").length}</div>
                </div>
                <div class="detail-card">
                    <div class="detail-title">UNKNOWN DEVICES</div>
                    <div class="detail-value">${visitors.filter(v => v.userAgent.includes('Unknown') || v.userAgent.includes('Bot')).length}</div>
                </div>
                <div class="detail-card">
                    <div class="detail-title">LOCATION SPOOFING</div>
                    <div class="detail-value">${visitors.filter(v => v.location && v.location.accuracy > 1000).length}</div>
                </div>
            </div>
            
            <h4 style="margin-top: 1.5rem;">Recent AI Verifications</h4>
            <table class="visitor-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Device</th>
                        <th>Verification</th>
                        <th>Risk Score</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${visitors.slice(0, 5).map(v => `
                        <tr>
                            <td>${new Date(v.timestamp).toLocaleTimeString()}</td>
                            <td>${getDeviceName(v.userAgent)}</td>
                            <td>
                                <span class="badge ${
                                    v.aiVerification?.verificationPassed ? 'badge-success' : 'badge-danger'
                                }">
                                    ${v.aiVerification?.verificationPassed ? 'Verified' : 'Failed'}
                                </span>
                            </td>
                            <td>${v.aiVerification?.riskScore.toFixed(1) || '0'}</td>
                            <td>${v.aiVerification?.botDetection || 'Unknown'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    // Helper functions
    function getRiskAssessment(score) {
        if (score < 30) return 'Low Risk - Mostly human traffic';
        if (score < 60) return 'Medium Risk - Some suspicious activity';
        if (score < 80) return 'High Risk - Likely bot traffic';
        return 'Critical Risk - Probable attack in progress';
    }
    
    function getDeviceName(userAgent) {
        if (!userAgent) return 'Unknown Device';
        
        // Check for common bots
        if (userAgent.includes('bot') || userAgent.includes('Bot') || userAgent.includes('crawler')) {
            return 'Bot/Crawler';
        }
        
        // Check for mobile devices
        if (userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i)) {
            if (userAgent.match(/iPhone|iPad|iPod/i)) return 'iOS Device';
            if (userAgent.match(/Android/i)) return 'Android Device';
            return 'Mobile Device';
        }
        
        // Check for desktop browsers
        if (userAgent.match(/Windows NT/i)) {
            if (userAgent.match(/Chrome/i)) return 'Windows (Chrome)';
            if (userAgent.match(/Firefox/i)) return 'Windows (Firefox)';
            if (userAgent.match(/Edge/i)) return 'Windows (Edge)';
            return 'Windows PC';
        }
        
        if (userAgent.match(/Macintosh|Mac OS X/i)) {
            if (userAgent.match(/Safari/i)) return 'Mac (Safari)';
            if (userAgent.match(/Chrome/i)) return 'Mac (Chrome)';
            return 'Mac Computer';
        }
        
        if (userAgent.match(/Linux/i)) return 'Linux Device';
        
        // Fallback to first part of user agent
        return userAgent.split(')')[0].split('(')[1] || userAgent.split(' ')[0] || 'Unknown Device';
    }
    
    function calculateAverage(values) {
        const nums = values.filter(v => !isNaN(parseFloat(v)));
        if (nums.length === 0) return 'N/A';
        const sum = nums.reduce((a, b) => a + parseFloat(b), 0);
        return (sum / nums.length).toFixed(1);
    }
});
