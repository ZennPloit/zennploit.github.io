document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('tid');
    const targetUrl = urlParams.get('target');
    const campaignName = urlParams.get('campaign');
    const customMessage = urlParams.get('message');
    const securityLevel = urlParams.get('security') || 'standard';
    const expiryDate = urlParams.get('expiry');
    
    const loadingSection = document.getElementById('loading-section');
    const expiredSection = document.getElementById('expired-section');
    const verificationContainer = document.getElementById('verification-container');
    const locationRequiredSection = document.getElementById('location-required-section');
    const redirectSection = document.getElementById('redirect-section');
    const requestLocationBtn = document.getElementById('request-location-btn');
    const locationError = document.getElementById('location-error');
    const customMessageElement = document.getElementById('custom-message');
    
    // Verification step elements
    const stepBot = document.getElementById('step-bot');
    const stepBehavior = document.getElementById('step-behavior');
    const stepFingerprint = document.getElementById('step-fingerprint');
    
    // Check if link is expired
    if (expiryDate) {
        const now = new Date();
        const expiry = new Date(expiryDate);
        
        if (now > expiry) {
            loadingSection.classList.add('hidden');
            expiredSection.classList.remove('hidden');
            return;
        }
    }
    
    // Validate target URL
    if (!targetUrl) {
        document.body.innerHTML = `
            <div class="container">
                <h1 style="color: var(--danger);">Invalid Tracking Link</h1>
                <p>This tracking link is missing the destination URL. Please contact the link provider.</p>
            </div>
        `;
        return;
    }
    
    // Display custom message if available
    if (customMessage) {
        customMessageElement.textContent = decodeURIComponent(customMessage);
    }
    
    // Show verification container for enhanced security
    if (securityLevel === 'enhanced' || securityLevel === 'stealth') {
        verificationContainer.classList.remove('hidden');
    }
    
    // Simulate AI verification and anti-DDoS delay
    setTimeout(() => {
        if (securityLevel === 'enhanced') {
            // Enhanced security requires location
            checkLocation();
        } else {
            // Standard security - proceed without location
            proceedWithTracking();
        }
        
        // Simulate AI verification steps
        simulateVerification();
    }, 1500);
    
    function simulateVerification() {
        // Step 1: Bot detection
        setTimeout(() => {
            updateVerificationStep(stepBot, isLikelyBot());
        }, 1000);
        
        // Step 2: Behavior analysis
        setTimeout(() => {
            updateVerificationStep(stepBehavior, isSuspiciousBehavior());
        }, 2000);
        
        // Step 3: Device fingerprinting
        setTimeout(() => {
            updateVerificationStep(stepFingerprint, true);
        }, 3000);
    }
    
    function updateVerificationStep(element, isSuccess) {
        element.classList.remove('pending');
        element.classList.add(isSuccess ? 'success' : 'error');
        
        // Update icon
        element.innerHTML = isSuccess ? 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' :
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    }
    
    function isLikelyBot() {
        // Simulate bot detection (10% chance of detecting as bot)
        return Math.random() > 0.1;
    }
    
    function isSuspiciousBehavior() {
        // Simulate behavior analysis (15% chance of suspicious behavior)
        return Math.random() > 0.15;
    }
    
    function checkLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    // Location access granted
                    proceedWithTracking(position);
                },
                function(error) {
                    // Location access denied or error
                    showLocationRequired(getLocationError(error));
                },
                { 
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            // Geolocation not supported
            showLocationRequired("Geolocation is not supported by your browser.");
        }
    }
    
    function getLocationError(error) {
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
    
    function showLocationRequired(errorMessage = "") {
        loadingSection.classList.add('hidden');
        locationRequiredSection.classList.remove('hidden');
        
        if (errorMessage) {
            locationError.textContent = errorMessage;
            locationError.classList.remove('hidden');
        }
    }
    
    requestLocationBtn.addEventListener('click', function() {
        checkLocation();
    });
    
    function proceedWithTracking(position = null) {
        loadingSection.classList.add('hidden');
        locationRequiredSection.classList.add('hidden');
        redirectSection.classList.remove('hidden');
        
        // Collect tracking data
        const trackingData = {
            id: trackingId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            campaign: campaignName ? decodeURIComponent(campaignName) : null,
            securityLevel: securityLevel,
            destinationUrl: targetUrl
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
            trackingData.address = simulateReverseGeocoding(position.coords.latitude, position.coords.longitude);
        }
        
        // Simulate IP detection (in a real app, this would be server-side)
        trackingData.ipInfo = simulateIPDetection();
        
        // Simulate AI verification
        trackingData.aiVerification = performAIVerification();
        
        // Save tracking data to localStorage (simulating server storage)
        let allTrackingData = JSON.parse(localStorage.getItem('trackingData') || '[]');
        allTrackingData.push(trackingData);
        localStorage.setItem('trackingData', JSON.stringify(allTrackingData));
        
        // Update tracker count
        updateTrackerCount(trackingId);
        
        // Redirect after delay (longer for stealth mode)
        const redirectDelay = securityLevel === 'stealth' ? 5000 : 3000;
        setTimeout(() => {
            window.location.href = decodeURIComponent(targetUrl);
        }, redirectDelay);
    }
    
    function simulateReverseGeocoding(lat, lng) {
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
    
    function simulateIPDetection() {
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
    
    function performAIVerification() {
        // Simulate AI analysis
        const isHuman = Math.random() > 0.1; // 90% chance human
        const riskScore = Math.random() * 100;
        const deviceFingerprint = generateFingerprint();
        
        return {
            isHuman: isHuman,
            riskScore: riskScore,
            deviceFingerprint: deviceFingerprint,
            botDetection: riskScore > 70 ? "Suspicious" : "Clean",
            behaviorAnalysis: "Normal",
            verificationPassed: isHuman && riskScore < 70
        };
    }
    
    function generateFingerprint() {
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
    
    function updateTrackerCount(trackingId) {
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
});