class TrackerMap {
    constructor(elementId) {
        this.map = L.map(elementId).setView([20, 0], 2);
        this.markers = [];
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
    }
    
    addMarker(lat, lng, title, riskLevel) {
        let markerColor;
        let markerSize = 32;
        
        if (riskLevel > 70) {
            markerColor = '#f72585'; // High risk
        } else if (riskLevel > 30) {
            markerColor = '#f8961e'; // Medium risk
            markerSize = 28;
        } else {
            markerColor = '#4cc9f0'; // Low risk
            markerSize = 24;
        }
        
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${markerColor}; width: ${markerSize}px; height: ${markerSize}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transform: translate(-50%, -50%);">${title.substring(0,1)}</div>`,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize/2, markerSize/2]
        });
        
        const marker = L.marker([lat, lng], { icon })
            .addTo(this.map)
            .bindPopup(`<b>${title}</b><br>Risk: ${riskLevel}%`);
        
        this.markers.push(marker);
        return marker;
    }
    
    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }
    
    fitBounds() {
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
        } else {
            this.map.setView([20, 0], 2);
        }
    }
    
    addSampleData() {
        // Sample data - in a real app this would come from your tracking data
        this.addMarker(40.7128, -74.0060, 'New York', 15);
        this.addMarker(34.0522, -118.2437, 'Los Angeles', 45);
        this.addMarker(51.5074, -0.1278, 'London', 75);
        this.addMarker(35.6762, 139.6503, 'Tokyo', 30);
        this.addMarker(48.8566, 2.3522, 'Paris', 60);
        this.fitBounds();
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('tracker-map')) {
        const trackerMap = new TrackerMap('tracker-map');
        trackerMap.addSampleData(); // Remove this in production
        
        // Example of how to add a real marker:
        // trackerMap.addMarker(37.7749, -122.4194, 'San Francisco', 20);
    }
});