// Dashboard Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Wait for storage manager to be ready
    setTimeout(() => {
        initializeDashboard();
    }, 100);
});

function initializeDashboard() {
    // Set Mapbox access token from Django settings
    if (!window.MAPBOX_ACCESS_TOKEN) {
        console.error('Mapbox access token not found. Please check your environment configuration.');
        return;
    }
    mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;
    
    // Get saved settings
    const storage = window.ncop_storage;
    const savedStyle = storage ? storage.getMapStyle() : 'streets-v12';
    const savedCenter = storage ? storage.getSetting('mapCenter') : [74.3, 31.5];
    const savedZoom = storage ? storage.getSetting('mapZoom') : 6;
    
    // Initialize map with saved settings
    const map = new mapboxgl.Map({
        container: 'map',
        style: `mapbox://styles/mapbox/${savedStyle}`,
        center: savedCenter,
        zoom: savedZoom,
        projection: 'mercator'
    });
    
    // Update last login timestamp
    if (storage) {
        storage.updateLastLogin();
    }    // Add custom navigation controls
    addCustomNavigationControls(map);
    
    // Add custom user info button
    addCustomUserButton();
    
    // Add custom basemap control
    addCustomBasemapButton(map);
    
    // Add custom sidebar menu
    addCustomSidebarMenu();
      // Map load event
    map.on('load', function() {
        console.log('Map loaded successfully');
        
        // Restore saved map state
        if (storage) {
            const savedBearing = storage.getSetting('mapBearing');
            const savedPitch = storage.getSetting('mapPitch');
            
            if (savedBearing !== null || savedPitch !== null) {
                map.setBearing(savedBearing || 0);
                map.setPitch(savedPitch || 0);
            }
            
            // Restore labels state
            const labelsEnabled = storage.getLabelsState();
            if (!labelsEnabled) {
                setTimeout(() => {
                    toggleMapLabels(map, false);
                }, 1000);
            }
        }
    });
    
    // Save map state when it changes
    map.on('moveend', function() {
        if (storage) {
            storage.saveMapState(map);
        }
    });
    
    // Handle map errors
    map.on('error', function(e) {
        console.error('Map error:', e);
    });
    
    // Function to toggle map labels
    function toggleMapLabels(map, enabled) {
        const style = map.getStyle();
        if (style && style.layers) {
            style.layers.forEach(layer => {
                if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                    map.setLayoutProperty(layer.id, 'visibility', enabled ? 'visible' : 'none');
                }
            });
        }
    }// Custom Navigation Controls
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
          // Get saved settings
        const storage = window.ncop_storage;
        let currentStyle = storage ? storage.getMapStyle() : 'streets-v12';
        let labelsEnabled = storage ? storage.getLabelsState() : true;
        
        // Create basemap controls container
        const basemapContainer = document.createElement('div');
        basemapContainer.className = 'custom-basemap-control';        basemapContainer.innerHTML = `
            <button id="basemapToggle" class="custom-basemap-btn" title="Change Basemap">
                <i data-lucide="layers"></i>
            </button>
            <div id="basemapPanel" class="basemap-panel">
                <div class="labels-toggle">
                    <span class="labels-toggle-text">Show Labels</span>
                    <div class="toggle-switch ${labelsEnabled ? 'active' : ''}" id="labelsToggle">
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
            
            // Save labels state
            if (storage) {
                storage.saveLabelsState(labelsEnabled);
            }
            
            // Toggle labels visibility on the map
            toggleMapLabels(map, labelsEnabled);
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
                
                // Save map style
                if (storage) {
                    storage.saveMapStyle(newStyle);
                }
                
                // Close panel
                basemapPanel.classList.remove('visible');
                
                // Reapply labels setting after style loads
                map.once('styledata', function() {
                    if (!labelsEnabled) {
                        toggleMapLabels(map, false);
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
        }    }
    
    // Custom Sidebar Menu
    function addCustomSidebarMenu() {
        const mapContainer = document.getElementById('map');
        
        // Create menu button container
        const menuContainer = document.createElement('div');
        menuContainer.className = 'custom-menu-control';
        menuContainer.innerHTML = `
            <button id="menuToggle" class="custom-menu-btn" title="Open Menu">
                <i data-lucide="menu"></i>
            </button>
        `;
        
        mapContainer.appendChild(menuContainer);
        
        // Reinitialize Lucide icons
        lucide.createIcons();        // Get references to sidebar elements
        const menuToggle = document.getElementById('menuToggle');
        const menuControlDiv = menuContainer; // Reference to the created menu container
        const sidebarPanel = document.getElementById('sidebarPanel');
        const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
          // Function to open sidebar
        function openSidebar() {
            sidebarPanel.classList.add('visible');
            menuControlDiv.classList.add('hidden'); // Hide menu button
        }
        
        // Function to close sidebar
        function closeSidebar() {
            sidebarPanel.classList.remove('visible');
            menuControlDiv.classList.remove('hidden'); // Show menu button
        }
        
        // Event listeners
        menuToggle.addEventListener('click', function(event) {
            event.stopPropagation();
            openSidebar();
        });
          sidebarCloseBtn.addEventListener('click', function() {
            closeSidebar();
        });
        
        // Close sidebar on Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && sidebarPanel.classList.contains('visible')) {
                closeSidebar();
            }
        });
        
        // Handle accordion functionality
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        accordionHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const accordionContent = this.nextElementSibling;
                const isActive = this.classList.contains('active');
                
                // Close all other accordions
                accordionHeaders.forEach(otherHeader => {
                    if (otherHeader !== this) {
                        otherHeader.classList.remove('active');
                        otherHeader.nextElementSibling.classList.remove('expanded');
                    }
                });
                
                // Toggle current accordion
                if (isActive) {
                    this.classList.remove('active');
                    accordionContent.classList.remove('expanded');
                } else {
                    this.classList.add('active');
                    accordionContent.classList.add('expanded');
                }
            });
        });
        
        console.log('📋 Sidebar menu initialized');
    }
    
    console.log('Dashboard loaded with localStorage integration');
}

// Utility functions for storage management
window.ncop_utils = {
    // Export user settings
    exportSettings: function() {
        if (window.ncop_storage) {
            const data = window.ncop_storage.exportSettings();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `ncop-settings-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            console.log('📥 Settings exported');
        }
    },
    
    // Import user settings
    importSettings: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const jsonData = e.target.result;
                    if (window.ncop_storage && window.ncop_storage.importSettings(jsonData)) {
                        alert('Settings imported successfully! Please refresh the page.');
                    } else {
                        alert('Failed to import settings. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    },
    
    // Clear all user data
    clearAllData: function() {
        if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
            if (window.ncop_storage) {
                window.ncop_storage.clearUserData();
                alert('All data cleared! Please refresh the page.');
            }
        }
    },
    
    // Show storage info
    showStorageInfo: function() {
        if (window.ncop_storage) {
            const info = window.ncop_storage.getStorageInfo();
            console.table(info);
            
            const message = `
Storage Information:
- Total Keys: ${info.totalKeys}
- Total Size: ${info.sizeKB} KB
- Max Size: ${info.maxSize}
- User: ${window.USERNAME || 'Guest'}
            `;
            
            alert(message);
        }
    },
    
    // Reset to defaults
    resetToDefaults: function() {
        if (confirm('Reset all settings to defaults? This will clear your preferences.')) {
            if (window.ncop_storage) {
                window.ncop_storage.clearUserData();
                window.ncop_storage.initializeUserSettings();
                alert('Settings reset to defaults! Please refresh the page.');
            }
        }
    }
};

// Add keyboard shortcuts for power users
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+E: Export settings
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        window.ncop_utils.exportSettings();
    }
    
    // Ctrl+Shift+I: Import settings
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        window.ncop_utils.importSettings();
    }
    
    // Ctrl+Shift+D: Show storage info
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        window.ncop_utils.showStorageInfo();
    }
});

console.log('🔧 NCOP Utilities loaded. Available commands:');
console.log('- ncop_utils.exportSettings()');
console.log('- ncop_utils.importSettings()'); 
console.log('- ncop_utils.clearAllData()');
console.log('- ncop_utils.showStorageInfo()');
console.log('- ncop_utils.resetToDefaults()');
console.log('Keyboard shortcuts: Ctrl+Shift+E (export), Ctrl+Shift+I (import), Ctrl+Shift+D (info)');
