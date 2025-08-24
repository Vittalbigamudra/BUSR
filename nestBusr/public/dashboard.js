let map;
let currentMarker;
let updateInterval;

// Initialize the map
function initMap() {
    map = L.map('map').setView([34.131607, -84.205612], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add satellite layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
    }).addTo(map);
}

// Update satellite constellation display
function updateConstellation(satelliteCount) {
    const grid = document.getElementById('constellationGrid');
    grid.innerHTML = '';

    const positions = [
        { row: 0, col: 1, label: 'N' },   // North
        { row: 1, col: 0, label: 'W' },   // West
        { row: 1, col: 1, label: 'C' },   // Center
        { row: 1, col: 2, label: 'E' },   // East
        { row: 2, col: 1, label: 'S' },   // South
        { row: 0, col: 0, label: 'NW' }, // Northwest
        { row: 0, col: 2, label: 'NE' }, // Northeast
        { row: 2, col: 0, label: 'SW' }, // Southwest
        { row: 2, col: 2, label: 'SE' }  // Southeast
    ];

    positions.forEach((pos, index) => {
        if (index < satelliteCount) {
            const satellite = document.createElement('div');
            satellite.className = 'satellite';
            satellite.textContent = '🛰';
            
            // Determine signal strength based on position
            if (index < 3) satellite.classList.add('strong');
            else if (index < 6) satellite.classList.add('weak');
            
            satellite.title = `${pos.label} Satellite`;
            grid.appendChild(satellite);
        }
    });
}

// Update signal quality bar
function updateSignalQuality(satelliteCount) {
    const signalFill = document.getElementById('signalFill');
    let percentage = 0;
    let quality = 'Poor';

    if (satelliteCount >= 8) {
        percentage = 100;
        quality = 'Excellent';
    } else if (satelliteCount >= 6) {
        percentage = 75;
        quality = 'Good';
    } else if (satelliteCount >= 4) {
        percentage = 50;
        quality = 'Fair';
    } else if (satelliteCount >= 2) {
        percentage = 25;
        quality = 'Poor';
    }

    signalFill.style.width = percentage + '%';
    document.getElementById('satelliteCount').textContent = `Satellites: ${satelliteCount} (${quality})`;
}

// Update map with new coordinates
function updateMap(lat, lng) {
    // Ensure coordinates are numbers
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    // Check if coordinates are valid numbers
    if (isNaN(latNum) || isNaN(lngNum)) {
        console.error('Invalid coordinates:', lat, lng);
        return;
    }
    
    const coordinates = document.getElementById('coordinates');
    coordinates.textContent = `Lat: ${latNum.toFixed(6)}\nLng: ${lngNum.toFixed(6)}`;

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    currentMarker = L.marker([latNum, lngNum]).addTo(map);
    map.setView([latNum, lngNum], 15);

    // Add satellite overlay
    addSatelliteOverlay(latNum, lngNum);
}

// Add satellite positions overlay
function addSatelliteOverlay(lat, lng) {
    // Ensure coordinates are numbers
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    // Check if coordinates are valid numbers
    if (isNaN(latNum) || isNaN(lngNum)) {
        console.error('Invalid coordinates for satellite overlay:', lat, lng);
        return;
    }
    
    // Remove existing satellite markers
    map.eachLayer((layer) => {
        if (layer.options && layer.options.satellite) {
            map.removeLayer(layer);
        }
    });

    // Add satellite positions (simulated for demo)
    const satellitePositions = [
        { lat: latNum + 0.001, lng: lngNum, strength: 'strong' },
        { lat: latNum - 0.001, lng: lngNum, strength: 'medium' },
        { lat: latNum, lng: lngNum + 0.001, strength: 'weak' },
        { lat: latNum, lng: lngNum - 0.001, strength: 'strong' },
        { lat: latNum + 0.0005, lng: lngNum + 0.0005, strength: 'medium' },
        { lat: latNum - 0.0005, lng: lngNum - 0.0005, strength: 'weak' },
        { lat: latNum + 0.0005, lng: lngNum - 0.0005, strength: 'strong' }
    ];

    satellitePositions.forEach((pos, index) => {
        // Validate satellite position coordinates
        if (isNaN(pos.lat) || isNaN(pos.lng)) {
            console.error('Invalid satellite position:', pos);
            return;
        }
        
        const icon = L.divIcon({
            className: 'satellite-marker',
            html: '🛰',
            iconSize: [20, 20]
        });

        const marker = L.marker([pos.lat, pos.lng], { icon, satellite: true }).addTo(map);
        marker.bindPopup(`Satellite ${index + 1}<br>Signal: ${pos.strength}`);
    });
}

// Fetch latest data
async function fetchData() {
    try {
        console.log('Fetching GPS data...');
        const gpsResponse = await fetch('/latest');
        console.log('GPS Response:', gpsResponse.status, gpsResponse.ok);
        
        if (gpsResponse.ok) {
            const gpsData = await gpsResponse.json();
            console.log('GPS Data:', gpsData);
            
            if (gpsData.lat && gpsData.lng) {
                console.log('Raw coordinates received:', gpsData.lat, gpsData.lng);
                console.log('Coordinate types:', typeof gpsData.lat, typeof gpsData.lng);
                
                updateMap(gpsData.lat, gpsData.lng);
                
                // Get satellite data from GPS response
                const satelliteCount = gpsData.satellites || 0;
                const satelliteDetails = gpsData.satelliteDetails || [];
                
                updateConstellation(satelliteCount);
                updateSignalQuality(satelliteCount);
                
                // Update satellite overlay with real data
                if (satelliteDetails.length > 0) {
                    updateSatelliteOverlay(gpsData.lat, gpsData.lng, satelliteDetails);
                }
                
                document.getElementById('lastUpdate').textContent = `Last update: ${new Date().toLocaleTimeString()}`;
                document.getElementById('connectionStatus').textContent = `✅ Connected to ESP32 - ${satelliteCount} satellites`;
            } else {
                document.getElementById('connectionStatus').textContent = '⏳ Waiting for GPS data...';
            }
        } else {
            throw new Error(`GPS response not ok: ${gpsResponse.status}`);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('connectionStatus').textContent = `❌ Connection error: ${error.message}`;
    }
}

// Refresh data manually
function refreshData() {
    fetchData();
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    fetchData();
    
    // Update data every 3 seconds
    updateInterval = setInterval(fetchData, 3000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

// Update satellite overlay with real data from ESP32
function updateSatelliteOverlay(lat, lng, satelliteDetails) {
    // Remove existing satellite markers
    map.eachLayer((layer) => {
        if (layer.options && layer.options.satellite) {
            map.removeLayer(layer);
        }
    });

    // Add real satellite positions based on azimuth and elevation
    satelliteDetails.forEach((sat, index) => {
        if (sat.azimuth !== undefined && sat.elevation !== undefined) {
            // Calculate satellite position relative to current location
            // This is a simplified representation - in reality, satellites are much higher
            const distance = 0.001; // Small offset for visualization
            const azimuthRad = (sat.azimuth * Math.PI) / 180;
            
            // Calculate offset based on azimuth (direction)
            const latOffset = Math.cos(azimuthRad) * distance;
            const lngOffset = Math.sin(azimuthRad) * distance;
            
            const satLat = parseFloat(lat) + latOffset;
            const satLng = parseFloat(lng) + lngOffset;
            
            // Choose icon based on signal strength (SNR)
            let iconHtml = '🛰';
            if (sat.snr > 80) iconHtml = '⭐';
            else if (sat.snr > 60) iconHtml = '🌟';
            
            const icon = L.divIcon({
                className: 'satellite-marker',
                html: iconHtml,
                iconSize: [20, 20]
            });

            const marker = L.marker([satLat, satLng], { icon, satellite: true }).addTo(map);
            marker.bindPopup(`Satellite ${sat.id}<br>Azimuth: ${sat.azimuth}°<br>Elevation: ${sat.elevation}°<br>SNR: ${sat.snr} dB`);
        }
    });
    
    // Update polar coordinate display
    updatePolarCoordinateDisplay(satelliteDetails);
}

// Update polar coordinate display
function updatePolarCoordinateDisplay(satelliteDetails) {
    const polarDisplay = document.getElementById('polarDisplay');
    if (!polarDisplay) return;
    
    let html = '<div class="polar-coordinates">';
    html += '<h3>🛰️ Satellite Positions</h3>';
    html += '<div class="polar-grid">';
    html += '<div class="north">N (0°)</div>';
    html += '<div class="directions">';
    html += '<div class="nw">NW (270°)</div>';
    html += '<div class="ne">NE (90°)</div>';
    html += '</div>';
    html += '<div class="south">S (180°)</div>';
    html += '</div>';
    
    html += '<div class="satellite-list">';
    satelliteDetails.forEach(sat => {
        const direction = getDirectionFromAzimuth(sat.azimuth);
        const symbol = sat.snr > 80 ? '⭐' : sat.snr > 60 ? '🌟' : '🛰';
        html += `<div class="satellite-item">${symbol} ${direction} (ID:${sat.id}, El:${sat.elevation}°, SNR:${sat.snr})</div>`;
    });
    html += '</div></div>';
    
    polarDisplay.innerHTML = html;
}

// Helper function to get direction from azimuth
function getDirectionFromAzimuth(azimuth) {
    if (azimuth >= 337.5 || azimuth < 22.5) return 'N';
    if (azimuth >= 22.5 && azimuth < 67.5) return 'NE';
    if (azimuth >= 67.5 && azimuth < 112.5) return 'E';
    if (azimuth >= 112.5 && azimuth < 157.5) return 'SE';
    if (azimuth >= 157.5 && azimuth < 202.5) return 'S';
    if (azimuth >= 202.5 && azimuth < 247.5) return 'SW';
    if (azimuth >= 247.5 && azimuth < 292.5) return 'W';
    if (azimuth >= 292.5 && azimuth < 337.5) return 'NW';
    return '?';
}
