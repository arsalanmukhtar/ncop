// Dashboard Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();    // Set Mapbox access token from Django settings
    if (!window.MAPBOX_ACCESS_TOKEN) {
        console.error('Mapbox access token not found. Please check your environment configuration.');
        return;
    }
    mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;
    
    // Initialize map
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [74.3, 31.5], // Pakistan coordinates
        zoom: 6,
        projection: 'mercator'
    });    // Add custom navigation controls
    addCustomNavigationControls(map);
    
    // Add custom user info button
    addCustomUserButton();
    
    // Add custom basemap control
    addCustomBasemapButton(map);
    
    // Map load event
    map.on('load', function() {
        console.log('Map loaded successfully');
    });
    
    // Handle map errors
    map.on('error', function(e) {
        console.error('Map error:', e);
    });    // Custom Navigation Controls
    function addCustomNavigationControls(map) {
        const mapContainer = document.getElementById('map');
        
        // Create navigation controls container
        const navContainer = document.createElement('div');
        navContainer.className = 'custom-nav-control';
        navContainer.innerHTML = `
            <button id="zoomIn" class="custom-nav-btn" title="Zoom In">
                <i data-lucide="plus"></i>
            </button>
            <button id="zoomOut" class="custom-nav-btn" title="Zoom Out">
                <i data-lucide="minus"></i>
            </button>
            <button id="resetBearing" class="custom-nav-btn" title="Reset Bearing">
                <i data-lucide="compass"></i>
            </button>
            <button id="locate" class="custom-nav-btn" title="Find My Location">
                <i data-lucide="map-pin"></i>
            </button>
        `;
          mapContainer.appendChild(navContainer);
          // Reinitialize Lucide icons
        lucide.createIcons();
        
        // Add event listeners for navigation buttons
        document.getElementById('zoomIn').addEventListener('click', () => {
            map.zoomIn({ duration: 300 });
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            map.zoomOut({ duration: 300 });
        });
        
        document.getElementById('resetBearing').addEventListener('click', () => {
            map.easeTo({ 
                bearing: 0, 
                pitch: 0, 
                duration: 500 
            });
        });
        
        document.getElementById('locate').addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { longitude, latitude } = position.coords;
                        map.flyTo({
                            center: [longitude, latitude],
                            zoom: 15,
                            duration: 2000
                        });
                        
                        // Add a temporary marker for current location
                        new mapboxgl.Marker({ color: '#ff0000' })
                            .setLngLat([longitude, latitude])
                            .addTo(map);
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        alert('Unable to retrieve your location');
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser');
            }
        });
    }

    // Custom User Button
    function addCustomUserButton() {
        const mapContainer = document.getElementById('map');
        
        // Create user controls container
        const userContainer = document.createElement('div');
        userContainer.className = 'custom-user-control';
        userContainer.innerHTML = `
            <button id="userToggle" class="custom-user-btn" title="User Info">
                <i data-lucide="user"></i>
            </button>
        `;
          mapContainer.appendChild(userContainer);
          // Reinitialize Lucide icons
        lucide.createIcons();
        
        // Add click event listener for user button
        const userToggle = document.getElementById('userToggle');
        const userPanel = document.getElementById('userPanel');
        
        if (userToggle && userPanel) {
            userToggle.addEventListener('click', function() {
                userPanel.classList.toggle('user-panel-visible');
            });
            
            // Close panel when clicking outside
            document.addEventListener('click', function(event) {
                if (!userPanel.contains(event.target) && !userToggle.contains(event.target)) {
                    userPanel.classList.remove('user-panel-visible');
                }
            });
        }
    }
    
    // Custom Basemap Control
    function addCustomBasemapButton(map) {
        const mapContainer = document.getElementById('map');
        
        // Basemap styles available in Mapbox
        const basemapStyles = [
            { id: 'streets-v12', name: 'Streets', emoji: '🏙️' },
            { id: 'satellite-streets-v12', name: 'Satellite', emoji: '🛰️' },
            { id: 'outdoors-v12', name: 'Outdoors', emoji: '🏔️' },
            { id: 'light-v11', name: 'Light', emoji: '☀️' },
            { id: 'dark-v11', name: 'Dark', emoji: '🌙' },
            { id: 'satellite-v9', name: 'Satellite Only', emoji: '📡' },
            { id: 'navigation-day-v1', name: 'Navigation Day', emoji: '🗺️' },
            { id: 'navigation-night-v1', name: 'Navigation Night', emoji: '🌃' }
        ];
        
        let currentStyle = 'streets-v12';
        let labelsEnabled = true;
        
        // Create basemap controls container
        const basemapContainer = document.createElement('div');
        basemapContainer.className = 'custom-basemap-control';
        basemapContainer.innerHTML = `
            <button id="basemapToggle" class="custom-basemap-btn" title="Change Basemap">
                <i data-lucide="layers"></i>
            </button>
            <div id="basemapPanel" class="basemap-panel">
                <div class="labels-toggle">
                    <span class="labels-toggle-text">Show Labels</span>
                    <div class="toggle-switch active" id="labelsToggle">
                        <div class="toggle-slider"></div>
                    </div>
                </div>
                <div class="basemap-list" id="basemapList">
                    ${basemapStyles.map(style => `
                        <div class="basemap-item ${style.id === currentStyle ? 'active' : ''}" data-style="${style.id}">
                            <div class="basemap-image">${style.emoji}</div>
                            <span class="basemap-name">${style.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        mapContainer.appendChild(basemapContainer);
        
        // Reinitialize Lucide icons
        lucide.createIcons();
        
        // Get references to elements
        const basemapToggle = document.getElementById('basemapToggle');
        const basemapPanel = document.getElementById('basemapPanel');
        const labelsToggle = document.getElementById('labelsToggle');
        const basemapList = document.getElementById('basemapList');
        const userPanel = document.getElementById('userPanel');
        
        // Handle basemap panel toggle
        basemapToggle.addEventListener('click', function(event) {
            event.stopPropagation();
            basemapPanel.classList.toggle('visible');
        });
        
        // Handle labels toggle
        labelsToggle.addEventListener('click', function() {
            labelsEnabled = !labelsEnabled;
            labelsToggle.classList.toggle('active', labelsEnabled);
            
            // Toggle labels visibility on the map
            const style = map.getStyle();
            const layers = style.layers;
            
            layers.forEach(layer => {
                if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                    map.setLayoutProperty(layer.id, 'visibility', labelsEnabled ? 'visible' : 'none');
                }
            });
        });
        
        // Handle basemap selection
        basemapList.addEventListener('click', function(event) {
            const basemapItem = event.target.closest('.basemap-item');
            if (basemapItem) {
                const newStyle = basemapItem.dataset.style;
                
                // Update active state
                document.querySelectorAll('.basemap-item').forEach(item => {
                    item.classList.remove('active');
                });
                basemapItem.classList.add('active');
                
                // Change map style
                map.setStyle(`mapbox://styles/mapbox/${newStyle}`);
                currentStyle = newStyle;
                
                // Close panel
                basemapPanel.classList.remove('visible');
                
                // Reapply labels setting after style loads
                map.once('styledata', function() {
                    if (!labelsEnabled) {
                        const style = map.getStyle();
                        const layers = style.layers;
                        
                        layers.forEach(layer => {
                            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                                map.setLayoutProperty(layer.id, 'visibility', 'none');
                            }
                        });
                    }
                });
            }
        });
        
        // Handle user panel visibility and translate basemap control
        const userToggle = document.getElementById('userToggle');
        if (userToggle) {
            userToggle.addEventListener('click', function() {
                setTimeout(() => {
                    if (userPanel.classList.contains('user-panel-visible')) {
                        basemapContainer.classList.add('panel-open');
                    } else {
                        basemapContainer.classList.remove('panel-open');
                    }
                }, 50);
            });
        }
        
        // Close basemap panel when clicking outside
        document.addEventListener('click', function(event) {
            if (!basemapPanel.contains(event.target) && !basemapToggle.contains(event.target)) {
                basemapPanel.classList.remove('visible');
            }
        });
        
        // Close basemap panel when user panel opens
        if (userPanel) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (userPanel.classList.contains('user-panel-visible')) {
                            basemapPanel.classList.remove('visible');
                        }
                    }
                });
            });
            observer.observe(userPanel, { attributes: true });
        }
    }
    
    console.log('Dashboard loaded');
});
