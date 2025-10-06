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
    });    // Add navigation controls to bottom right
    const navControl = new mapboxgl.NavigationControl();
    map.addControl(navControl, 'bottom-right');
    
    // Add user info button after map controls are added
    setTimeout(() => {
        addUserInfoButton();
    }, 100);
    
    // Map load event
    map.on('load', function() {
        console.log('Map loaded successfully');
    });
    
    // Handle map errors
    map.on('error', function(e) {
        console.error('Map error:', e);
    });    // User panel toggle functionality
    function addUserInfoButton() {
        const mapContainer = document.getElementById('map');
        
        // Create a top-right controls container for user button
        let topRightContainer = mapContainer.querySelector('.mapboxgl-ctrl-top-right');
        if (!topRightContainer) {
            topRightContainer = document.createElement('div');
            topRightContainer.className = 'mapboxgl-ctrl-top-right';
            mapContainer.appendChild(topRightContainer);
        }
        
        // Create user info button
        const userButton = document.createElement('div');
        userButton.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        userButton.innerHTML = `
            <button id="userToggle" class="mapboxgl-ctrl-icon" type="button" title="User Info" style="background-image: none; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="user" style="width: 18px; height: 18px; color: #374151;"></i>
            </button>
        `;
        
        // Add to controls container
        topRightContainer.appendChild(userButton);
        
        // Reinitialize lucide icons for the new button
        lucide.createIcons();
        
        // Add click event listener
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
    
    console.log('Dashboard loaded');
});
