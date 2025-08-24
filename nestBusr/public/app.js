// app.js

// API base URL
const API_BASE_URL = 'http://localhost:5000';

// Initialize map
const map = L.map('map', {
    center: [37.7, -122.4],
    zoom: 10,
    zoomControl: false,
    attributionControl: false
});

// Add dark theme map tiles with lighter roads
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    className: 'custom-tiles'
}).addTo(map);

// Add road labels layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, © CARTO',
    className: 'custom-labels'
}).addTo(map);

// Add zoom control in top right
L.control.zoom({
    position: 'topright'
}).addTo(map);

// Add attribution in bottom right
L.control.attribution({
    position: 'bottomright'
}).addTo(map);

// Create a custom icon for the marker (Waze-style)
const customIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Create a marker with custom icon
const marker = L.marker([37.7, -122.4], {
    icon: customIcon,
    riseOnHover: true
}).addTo(map);

// Add a popup to the marker
marker.bindPopup('Current Location').openPopup();

// Layer for highlighted roads
const highlightedRoads = L.layerGroup().addTo(map);

// Function to query nearby roads using Overpass API
async function queryNearbyRoads(lat, lng) {
    const radius = 100; // meters
    const query = `
        [out:json][timeout:25];
        (
            way["highway"](around:${radius},${lat},${lng});
            >;
        );
        out body;
    `;
    
    try {
        console.log('Querying roads near:', lat, lng);
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });
        const data = await response.json();
        console.log('Found roads:', data.elements ? data.elements.length : 0);
        return data;
    } catch (error) {
        console.error('Error querying nearby roads:', error);
        return null;
    }
}

// Function to find and highlight the closest road
async function highlightClosestRoad(lat, lng) {
    // Clear previous highlights
    highlightedRoads.clearLayers();
    
    const data = await queryNearbyRoads(lat, lng);
    if (!data || !data.elements) {
        console.log('No roads found nearby');
        return;
    }
    
    let closestRoad = null;
    let minDistance = Infinity;
    
    // Process ways (roads)
    data.elements.forEach(element => {
        if (element.type === 'way') {
            // Calculate distance from marker to road
            const distance = calculateDistanceToRoad(lat, lng, element);
            console.log('Road distance:', distance);
            if (distance < minDistance) {
                minDistance = distance;
                closestRoad = element;
            }
        }
    });
    
    if (closestRoad) {
        console.log('Found closest road:', closestRoad);
        // Create a polyline for the closest road
        const coordinates = closestRoad.nodes.map(nodeId => {
            const node = data.elements.find(e => e.type === 'node' && e.id === nodeId);
            return node ? [node.lat, node.lon] : null;
        }).filter(coord => coord !== null);
        
        if (coordinates.length > 1) {
            console.log('Drawing road with coordinates:', coordinates);
            L.polyline(coordinates, {
                color: 'red',
                weight: 4,
                opacity: 0.8,
                className: 'highlighted-road'
            }).addTo(highlightedRoads);
        }
    } else {
        console.log('No closest road found');
    }
}

// Function to calculate distance from point to road
function calculateDistanceToRoad(lat, lng, road) {
    // Simple distance calculation - can be improved for accuracy
    const roadLat = road.center ? road.center.lat : road.lat;
    const roadLng = road.center ? road.center.lon : road.lon;
    
    return Math.sqrt(
        Math.pow(lat - roadLat, 2) + 
        Math.pow(lng - roadLng, 2)
    );
}

// Dropdown elements
const stateSelect = document.getElementById('state');
const countySelect = document.getElementById('county');

// Fetch and populate states
async function loadStates() {
    try {
        const res = await fetch(`${API_BASE_URL}/schooldist/states`);
        if (!res.ok) throw new Error('Failed to fetch states');
        const states = await res.json();
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading states:', error);
    }
}

// Fetch and populate counties based on selected state
async function loadCounties(state) {
    try {
        countySelect.innerHTML = '<option value="">--Select a county--</option>';
        if (!state) {
            countySelect.disabled = true;
            return;
        }
        const res = await fetch(`${API_BASE_URL}/schooldist/counties?state=${encodeURIComponent(state)}`);
        if (!res.ok) throw new Error('Failed to fetch counties');
        const counties = await res.json();
        counties.forEach(county => {
            const option = document.createElement('option');
            option.value = county;
            option.textContent = county;
            countySelect.appendChild(option);
        });
        countySelect.disabled = false;
    } catch (error) {
        console.error('Error loading counties:', error);
        countySelect.disabled = true;
    }
}

// Handle county selection
countySelect.addEventListener('change', async () => {
    const selectedCounty = countySelect.value;
    const selectedState = stateSelect.value;

    if (!selectedCounty || !selectedState) return;

    try {
        const response = await fetch(`${API_BASE_URL}/gps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                state: selectedState,
                county: selectedCounty
            })
        });

        if (!response.ok) throw new Error('Failed to send data');
        console.log('Successfully sent:', selectedState, selectedCounty);
    } catch (err) {
        console.error('Error sending county:', err);
    }
});

// Handle state selection
stateSelect.addEventListener('change', () => {
    loadCounties(stateSelect.value);
});

// Real-time GPS update
async function updateCoords() {
    try {
        const res = await fetch(`${API_BASE_URL}/latest`);
        if (!res.ok) throw new Error('Failed to fetch GPS data');
        const data = await res.json();
        if (data.lat && data.lng) {
            const lat = parseFloat(data.lat);
            const lng = parseFloat(data.lng);
            
            // Smooth marker movement
            marker.setLatLng([lat, lng]);
            marker.getPopup().setContent(`Current Location<br>Lat: ${lat.toFixed(4)}<br>Lng: ${lng.toFixed(4)}`);
            
            // Smooth map movement
            map.panTo([lat, lng], {
                animate: true,
                duration: 1
            });
            
            // Highlight closest road
            await highlightClosestRoad(lat, lng);
            
            console.log('Updated coordinates:', lat, lng);
        }
    } catch (error) {
        console.error('Error updating coordinates:', error);
    }
}

// Initial load
loadStates();
setInterval(updateCoords, 4000); 