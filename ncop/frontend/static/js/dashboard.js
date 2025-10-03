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
    });
    
    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl());
    
    // Add fullscreen control
    map.addControl(new mapboxgl.FullscreenControl());
    
    // Map load event
    map.on('load', function() {
        console.log('Map loaded successfully');
    });
    
    // Handle map errors
    map.on('error', function(e) {
        console.error('Map error:', e);
    });
    
    // Handle responsive navigation
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('hidden');
        });
    }
    
    console.log('Dashboard loaded');
});
