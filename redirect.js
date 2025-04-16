class LinkRedirect {
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);
        this.trackingId = this.urlParams.get('tid');
        this.targetUrl = this.urlParams.get('target');
        this.campaignName = this.urlParams.get('campaign');
        this.customMessage = this.urlParams.get('message');
        this.securityLevel = this.urlParams.get('security') || 'standard';
        this.expiryDate = this.urlParams.get('expiry');
        
        this.initElements();
        this.initEvents();
        this.startVerification();
    }
    
    initElements() {
        this.loadingSection = document.getElementById('loading-section');
        this.expiredSection = document.getElementById('expired-section');
        this.locationRequiredSection = document.getElementById('location-required-section');
        this.redirectSection = document.getElementById('redirect-section');
        this.requestLocationBtn = document.getElementById('request-location-btn');
        this.locationError = document.getElementById('location-error');
        this.customMessageElement = document.getElementById('custom-message');
        this.verificationContainer = document.getElementById('verification-container');
        
        // Verification steps
        this.stepBot = document.getElementById('step-bot');
        this.stepBehavior = document.getElementById('step-behavior');
        this.stepFingerprint = document.getElementById('step-fingerprint');
    }
    
    initEvents() {
        this.requestLocationBtn.addEventListener('click', () => this.checkLocation());
    }
    
    startVerification() {
        // Check if link is expired
        if (this.isLinkExpired()) {
            this.showExpired();
            return;
        }
        
        // Validate target URL
        if (!this.targetUrl) {
            this.showInvalidLink();
            return;
        }
        
        // Show custom message if available
        if (this.customMessage) {
            this.customMessageElement.textContent = decodeURIComponent(this.customMessage);
        }
        
        // Show verification container for enhanced security
        if (this.securityLevel === 'enhanced' || this.securityLevel === 'stealth') {
            this.verificationContainer.classList.remove('hidden');
        }
        
        // Start verification process
        setTimeout(() => {
            if (this.securityLevel === 'enhanced') {
                this.checkLocation();
            } else {
                this.proceedWithTracking();
            }
            
            this.simulateVerification();
        }, 1500);
    }
    
    isLinkExpired() {
        if (!this.expiryDate) return false;
        const now = new Date();
        const expiry = new Date(this.expiryDate);
        return now > expiry;
    }
    
    showExpired() {
        this.loadingSection.classList.add('hidden');
        this.expiredSection.classList.remove('hidden');
    }
    
    showInvalidLink() {
        document.body.innerHTML = `
            <div class="redirect-container">
                <div class="redirect-header">
                    <div class="logo">LinkTracker</div>
                </div>
                <div class="redirect-content">
                    <div class="state-section">
                        <div class="status-icon error">
                            <i class="icon-alert"></i>
                        </div>
                        <h1>Invalid Link</h1>
                        <p>This tracking link is missing the destination URL</p>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="window.location.href='/'">
                                <i class="icon-home"></i> Return Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    simulateVerification() {
        // Step 1: Bot detection
        setTimeout(() => {
            this.updateVerificationStep(this.stepBot, this.isLikelyBot());
        }, 1000);
        
        // Step 2: Behavior analysis
        setTimeout(() => {
            this.updateVerificationStep(this.stepBehavior, this.isSuspiciousBehavior());
        }, 2000);
        
        // Step 3: Device fingerprinting
        setTimeout(() => {
            this.updateVerificationStep(this.stepFingerprint, true);
        }, 3000);
    }
    
    updateVerificationStep(element, isSuccess) {
        element.classList.remove('pending');
        element.classList.add(isSuccess ? 'success' : 'error');
        
        // Update icon
        const iconClass = isSuccess ? 'icon-check' : 'icon-x';
        element.innerHTML = `<i class="${iconClass}"></i>`;
    }
    
    isLikelyBot() {
        // Basic bot detection (in a real app, this would be more sophisticated)
        const userAgent = navigator.userAgent.toLowerCase();
        const isBot = userAgent.includes('bot') || 
                      userAgent.includes('crawler') || 
                      userAgent.includes('spider') || 
                      userAgent.includes('headless');
        
        // Simulate 10% chance of detecting as bot
        return !isBot && Math.random() > 0.1;
    }
    
    isSuspiciousBehavior() {
        // Simulate behavior analysis (15% chance of suspicious behavior)
        return Math.random() > 0.15;
    }
    
    checkLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => this.handleLocationSuccess(position),
                error => this.handleLocationError(error),
                { 
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            this.showLocationRequired("Geolocation is not supported by your browser.");
        }
    }
    
    handleLocationSuccess(position) {
        this.proceedWithTracking(position);
    }
    
    handleLocationError(error) {
        this.showLocationRequired(this.getLocationError(error));
    }
    
    getLocationError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                return "Location access was denied. Please enable location services in your browser settings.";
            case error.POSITION_UNAVAILABLE:
                return "Location information is unavailable.";
            case error.TIMEOUT:
                return "The request to get location timed out.";
            case error.UNKNOWN_ERROR:
                return "An unknown error occurred while getting location.";
            default:
                return "Could not get location information.";
        }
    }
    
    showLocationRequired(errorMessage = "") {
        this.loadingSection.classList.add('hidden');
        this.locationRequiredSection.classList.remove('hidden');
        
        if (errorMessage) {
            this.locationError.textContent = errorMessage;
            this.locationError.classList.remove('hidden');
        }
    }
    
    proceedWithTracking(position = null) {
        this.loadingSection.classList.add('hidden');
        this.locationRequiredSection.classList.add('hidden');
        this.redirectSection.classList.remove('hidden');
        
        // Collect tracking data
        const trackingData = {
            id: this.trackingId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            campaign: this.campaignName ? decodeURIComponent(this.campaignName) : null,
            securityLevel: this.securityLevel,
            destinationUrl: this.targetUrl
        };
        
        // Add location if available
        if (position) {
            trackingData.location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed
            };
            
            // Reverse geocoding to get address (simulated)
            trackingData.address = this.simulateReverseGeocoding(position.coords.latitude, position.coords.longitude);
        }
        
        // Simulate IP detection
        trackingData.ipInfo = this.simulateIPDetection();
        
        // Simulate AI verification
        trackingData.aiVerification = this.performAIVerification();
        
        // Save tracking data
        this.saveTrackingData(trackingData);
        
        // Update tracker count
        this.updateTrackerCount(this.trackingId);
        
        // Redirect after delay (longer for stealth mode)
        const redirectDelay = this.securityLevel === 'stealth' ? 5000 : 3000;
        setTimeout(() => {
            window.location.href = decodeURIComponent(this.targetUrl);
        }, redirectDelay);
    }
    
    simulateReverseGeocoding(lat, lng) {
        // In a real app, you would use a geocoding API
        const addresses = [
            {
                street: "123 Main St",
                city: "New York",
                state: "NY",
                country: "USA",
                postalCode: "10001"
            },
            {
                street: "456 Elm Ave",
                city: "Los Angeles",
                state: "CA",
                country: "USA",
                postalCode: "90001"
            },
            {
                street: "789 Oak Blvd",
                city: "Chicago",
                state: "IL",
                country: "USA",
                postalCode: "60601"
            }
        ];
        
        return addresses[Math.floor(Math.random() * addresses.length)];
    }
    
    simulateIPDetection() {
        // In a real app, this would come from a server-side API
        const ipInfo = {
            ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
            region: ["NY", "CA", "IL", "TX", "AZ"][Math.floor(Math.random() * 5)],
            country: "US",
            loc: `${Math.random() * 180 - 90},${Math.random() * 360 - 180}`,
            org: "AS" + Math.floor(Math.random() * 10000) + " " + ["Comcast", "Verizon", "AT&T", "T-Mobile", "Spectrum"][Math.floor(Math.random() * 5)],
            postal: Math.floor(Math.random() * 90000) + 10000,
            timezone: ["America/New_York", "America/Los_Angeles", "America/Chicago"][Math.floor(Math.random() * 3)]
        };
        
        return ipInfo;
    }
    
    performAIVerification() {
        // Simulate AI analysis
        const isHuman = Math.random() > 0.1; // 90% chance human
        const riskScore = Math.random() * 100;
        const deviceFingerprint = this.generateFingerprint();
        
        return {
            isHuman: isHuman,
            riskScore: riskScore,
            deviceFingerprint: deviceFingerprint,
            botDetection: riskScore > 70 ? "Suspicious" : "Clean",
            behaviorAnalysis: "Normal",
            verificationPassed: isHuman && riskScore < 70
        };
    }
    
    generateFingerprint() {
        // Simple fingerprint generation
        const components = [
            navigator.userAgent,
            navigator.platform,
            navigator.language,
            screen.width,
            screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown',
            navigator.maxTouchPoints || 'unknown'
        ];
        
        return components.join('|') + '|' + Math.random().toString(36).substr(2, 9);
    }
    
    saveTrackingData(trackingData) {
        let allTrackingData = JSON.parse(localStorage.getItem('trackingData') || '[]');
        allTrackingData.push(trackingData);
        localStorage.setItem('trackingData', JSON.stringify(allTrackingData));
    }
    
    updateTrackerCount(trackingId) {
        let allTrackers = JSON.parse(localStorage.getItem('trackers') || '[]');
        const trackerIndex = allTrackers.findIndex(t => t.id === trackingId);
        
        if (trackerIndex !== -1) {
            allTrackers[trackerIndex].clicks = (allTrackers[trackerIndex].clicks || 0) + 1;
            
            // Add location data if available
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        allTrackers[trackerIndex].locations = allTrackers[trackerIndex].locations || [];
                        allTrackers[trackerIndex].locations.push({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            timestamp: new Date().toISOString(),
                            accuracy: position.coords.accuracy
                        });
                        localStorage.setItem('trackers', JSON.stringify(allTrackers));
                    },
                    () => {
                        // Location not available, just save without it
                        localStorage.setItem('trackers', JSON.stringify(allTrackers));
                    }
                );
            } else {
                localStorage.setItem('trackers', JSON.stringify(allTrackers));
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const redirect = new LinkRedirect();
});