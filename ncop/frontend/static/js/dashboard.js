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
        projection: 'mercator',
        hash: true
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
        });          document.getElementById('locate').addEventListener('click', () => {
            // Zoom to specific coordinates: Islamabad, Pakistan
            const targetCoords = [73.09896723226383, 33.681421388232];
            
            map.flyTo({
                center: targetCoords,
                zoom: 17,
                duration: 2000
            });
            
            // Add a marker for the target location
            new mapboxgl.Marker({ color: '#ff0000' })
                .setLngLat(targetCoords)
                .addTo(map);
                
            console.log('🎯 Zoomed to target location:', targetCoords);
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
          // Watch user panel visibility changes and adjust basemap control position
        if (userPanel) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (userPanel.classList.contains('user-panel-visible')) {
                            // User panel is open - translate basemap control and close basemap panel
                            basemapContainer.classList.add('panel-open');
                            basemapPanel.classList.remove('visible');
                        } else {
                            // User panel is closed - return basemap control to original position
                            basemapContainer.classList.remove('panel-open');
                        }
                    }
                });
            });
            observer.observe(userPanel, { attributes: true });
        }}
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
        lucide.createIcons();
        
        // Load sidebar configuration and populate content
        loadSidebarConfig();
        
        // Get references to sidebar elements
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
          // Initialize search functionality
        initializeSearchFunctionality();
        
        console.log('📋 Sidebar menu initialized');
    }
    
    // Initialize search functionality
    function initializeSearchFunctionality() {
        const searchInput = document.getElementById('sidebarSearch');
        const clearSearchBtn = document.getElementById('clearSearch');
        
        if (!searchInput || !clearSearchBtn) return;
        
        // Search input event listener
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm) {
                clearSearchBtn.style.display = 'flex';
                performSearch(searchTerm);
            } else {
                clearSearchBtn.style.display = 'none';
                clearSearch();
            }
        });
        
        // Clear search button event listener
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            clearSearch();
        });
    }
      // Comprehensive search function
    function performSearch(searchTerm) {
        const accordionContainer = document.querySelector('.accordion-container');
        if (!accordionContainer) return;
        
        const accordions = accordionContainer.querySelectorAll('.accordion-item');
        let visibleCount = 0;
        
        accordions.forEach(accordion => {
            let accordionHasMatch = false;
            const accordionHeader = accordion.querySelector('.accordion-header');
            const accordionContent = accordion.querySelector('.accordion-content');
            
            // Check main accordion title
            const accordionTitle = accordionHeader.querySelector('span').textContent.toLowerCase();
            const accordionMatches = accordionTitle.includes(searchTerm);
            
            if (accordionMatches) {
                accordionHasMatch = true;
            }
            
            // Check subcategories and items
            const subcategories = accordion.querySelectorAll('.ncop-subcategory');
            let visibleSubcategories = 0;
            
            subcategories.forEach(subcategory => {
                let subcategoryHasMatch = false;
                const subcategoryHeader = subcategory.querySelector('.ncop-subcategory-header span');
                const subcategoryTitle = subcategoryHeader ? subcategoryHeader.textContent.toLowerCase() : '';
                
                // Check subcategory title
                if (subcategoryTitle.includes(searchTerm)) {
                    subcategoryHasMatch = true;
                    accordionHasMatch = true;
                }
                
                // Check items within subcategory
                const items = subcategory.querySelectorAll('.ncop-item');
                let visibleItems = 0;
                
                items.forEach(item => {
                    const itemLabel = item.querySelector('.ncop-item-label');
                    const itemText = itemLabel ? itemLabel.textContent.toLowerCase() : '';
                    
                    // Get all text content including endpoints and types
                    const toggleInput = item.querySelector('input[type="checkbox"]');
                    const dropdownSelect = item.querySelector('select');
                    
                    const allItemText = [
                        itemText,
                        toggleInput ? toggleInput.dataset.endpoint || '' : '',
                        dropdownSelect ? dropdownSelect.dataset.endpoint || '' : '',
                        subcategoryTitle,
                        accordionTitle
                    ].join(' ').toLowerCase();
                    
                    if (allItemText.includes(searchTerm)) {
                        item.style.display = 'flex';
                        visibleItems++;
                        subcategoryHasMatch = true;
                        accordionHasMatch = true;
                        highlightText(itemLabel, searchTerm);
                    } else {
                        item.style.display = 'none';
                        removeHighlight(itemLabel);
                    }
                });
                
                // Show/hide subcategory based on matches
                if (subcategoryHasMatch) {
                    subcategory.style.display = 'block';
                    visibleSubcategories++;
                    
                    // If subcategory title matches, highlight it
                    if (subcategoryTitle.includes(searchTerm)) {
                        highlightText(subcategoryHeader, searchTerm);
                    } else {
                        removeHighlight(subcategoryHeader);
                    }
                    
                    // Expand subcategory if it has matches
                    const itemsContainer = subcategory.querySelector('.ncop-items-container');
                    const subcatHeader = subcategory.querySelector('.ncop-subcategory-header');
                    if (itemsContainer && subcatHeader && visibleItems > 0) {
                        itemsContainer.classList.add('visible');
                        subcatHeader.classList.add('expanded');
                    }
                } else {
                    subcategory.style.display = 'none';
                    removeHighlight(subcategoryHeader);
                }
            });
            
            // Show/hide accordion based on matches
            if (accordionHasMatch) {
                accordion.style.display = 'block';
                visibleCount++;
                
                // Expand accordion if it has matches
                if (accordionContent && visibleSubcategories > 0) {
                    accordionContent.classList.add('expanded');
                    accordionHeader.classList.add('active');
                }
                
                // Highlight accordion title if it matches
                const accordionTitleElement = accordionHeader.querySelector('span');
                if (accordionMatches && accordionTitleElement) {
                    highlightText(accordionTitleElement, searchTerm);
                } else if (accordionTitleElement) {
                    removeHighlight(accordionTitleElement);
                }
            } else {
                accordion.style.display = 'none';
                const accordionTitleElement = accordionHeader.querySelector('span');
                if (accordionTitleElement) {
                    removeHighlight(accordionTitleElement);
                }
            }
        });
        
        // Show no results message if nothing found
        if (visibleCount === 0) {
            showNoResultsMessage();
        } else {
            removeNoResultsMessage();
        }
    }
      // Clear search and restore normal view
    function clearSearch() {
        const accordionContainer = document.querySelector('.accordion-container');
        if (!accordionContainer) return;
        
        const accordions = accordionContainer.querySelectorAll('.accordion-item');
        
        accordions.forEach(accordion => {
            accordion.style.display = 'block';
            
            // Remove highlights and reset accordion state
            const header = accordion.querySelector('.accordion-header');
            const content = accordion.querySelector('.accordion-content');
            const headerTitle = header.querySelector('span');
            
            if (headerTitle) {
                removeHighlight(headerTitle);
            }
            
            // Collapse accordion
            header.classList.remove('active');
            content.classList.remove('expanded');
            
            // Reset subcategories
            const subcategories = accordion.querySelectorAll('.ncop-subcategory');
            subcategories.forEach(subcategory => {
                subcategory.style.display = 'block';
                
                const subHeader = subcategory.querySelector('.ncop-subcategory-header');
                const subHeaderTitle = subHeader.querySelector('span');
                const itemsContainer = subcategory.querySelector('.ncop-items-container');
                
                if (subHeaderTitle) {
                    removeHighlight(subHeaderTitle);
                }
                
                // Collapse subcategory
                subHeader.classList.remove('expanded');
                itemsContainer.classList.remove('visible');
                
                // Reset items
                const items = subcategory.querySelectorAll('.ncop-item');
                items.forEach(item => {
                    item.style.display = 'flex';
                    const label = item.querySelector('.ncop-item-label');
                    if (label) {
                        removeHighlight(label);
                    }
                });
            });
        });
        
        removeNoResultsMessage();
    }
    
    // Highlight matching text
    function highlightText(element, searchTerm) {
        if (!element || !searchTerm) return;
        
        const originalText = element.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedText = originalText.replace(regex, '<span class="search-highlight">$1</span>');
        element.innerHTML = highlightedText;
    }
    
    // Remove text highlighting
    function removeHighlight(element) {
        if (!element) return;
        
        const highlightedElements = element.querySelectorAll('.search-highlight');
        highlightedElements.forEach(highlighted => {
            const parent = highlighted.parentNode;
            parent.replaceChild(document.createTextNode(highlighted.textContent), highlighted);
            parent.normalize();
        });
    }
      // Show no results message
    function showNoResultsMessage() {
        removeNoResultsMessage();
        const accordionContainer = document.querySelector('.accordion-container');
        if (accordionContainer) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results-message';
            noResultsDiv.innerHTML = `
                <i data-lucide="search-x"></i>
                <p>No results found</p>
                <small>Try different keywords or check spelling</small>
            `;
            accordionContainer.appendChild(noResultsDiv);
            lucide.createIcons();
        }
    }
    
    // Remove no results message
    function removeNoResultsMessage() {
        const noResultsMessage = document.querySelector('.no-results-message');
        if (noResultsMessage) {
            noResultsMessage.remove();
        }
    }
      // Load NCOP menu configuration from JSON
    async function loadSidebarConfig() {
        try {
            const response = await fetch('/static/data/ncop_menu.json');
            const menuData = await response.json();
            
            if (menuData) {
                populateNCOPSidebar(menuData);
            }
        } catch (error) {
            console.error('Error loading NCOP menu configuration:', error);
            // Fallback to basic sidebar structure
            createBasicSidebar();
        }
    }
    
    // Populate sidebar with NCOP menu data
    function populateNCOPSidebar(menuData) {
        const accordionContainer = document.querySelector('#sidebarPanel .accordion-container');
        if (!accordionContainer) return;
        
        // Clear existing content
        accordionContainer.innerHTML = '';
        
        // Create accordion sections for each main category
        Object.keys(menuData).forEach(categoryKey => {
            const categoryData = menuData[categoryKey];
            const categoryElement = createNCOPCategorySection(categoryKey, categoryData);
            accordionContainer.appendChild(categoryElement);
        });
          // Reinitialize Lucide icons
        lucide.createIcons();
          // Initialize accordion functionality
        initializeAccordionHandlers();
        
        // Initialize search functionality
        initializeSearchFunctionality();
        
        // Restore NCOP control states after a brief delay
        setTimeout(() => {
            restoreNCOPStates();
        }, 100);
    }
    
    // Create NCOP category section with subcategories
    function createNCOPCategorySection(categoryKey, categoryData) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'accordion-item';
        
        // Map category keys to display names and icons
        const categoryConfig = {
            'gis_layers': { title: 'GIS Layers', icon: 'layers' },
            'weather': { title: 'Weather Systems', icon: 'cloud' },
            'flood': { title: 'Flood Monitoring', icon: 'waves' },
            'air_quality': { title: 'Air Quality', icon: 'wind' },
            'ocean/coastal': { title: 'Ocean & Coastal', icon: 'anchor' },
            'Disaster Early Warning (DEW)': { title: 'Early Warning', icon: 'alert-triangle' }
        };
        
        const config = categoryConfig[categoryKey] || { 
            title: categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
            icon: 'folder' 
        };
        
        // Create header
        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.innerHTML = `
            <i data-lucide="${config.icon}"></i>
            <span>${config.title}</span>
            <i data-lucide="chevron-down" class="accordion-chevron"></i>
        `;
        
        // Create content
        const content = document.createElement('div');
        content.className = 'accordion-content';
        
        // Create subcategories
        Object.keys(categoryData).forEach(subcategoryKey => {
            const subcategoryData = categoryData[subcategoryKey];
            const subcategoryElement = createNCOPSubcategorySection(subcategoryKey, subcategoryData);
            content.appendChild(subcategoryElement);
        });
        
        sectionDiv.appendChild(header);
        sectionDiv.appendChild(content);
        
        return sectionDiv;
    }
    
    // Create NCOP subcategory section with items
    function createNCOPSubcategorySection(subcategoryKey, subcategoryData) {
        const subcategoryDiv = document.createElement('div');
        subcategoryDiv.className = 'ncop-subcategory';
          // Create subcategory header
        const subcategoryHeader = document.createElement('div');
        subcategoryHeader.className = 'ncop-subcategory-header';
        subcategoryHeader.innerHTML = `
            <span>${subcategoryKey}</span>
            <i data-lucide="chevron-right" class="subcategory-chevron"></i>
        `;
        
        // Create items container
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'ncop-items-container';
        
        // Create items from subcategory data
        Object.keys(subcategoryData).forEach(itemKey => {
            const itemData = subcategoryData[itemKey];
            const itemElement = createNCOPItem(itemData, itemKey);
            itemsContainer.appendChild(itemElement);
        });
        
        // Add toggle functionality to subcategory
        subcategoryHeader.addEventListener('click', function() {
            const isExpanded = this.classList.contains('expanded');
            
            if (isExpanded) {
                this.classList.remove('expanded');
                itemsContainer.classList.remove('visible');
            } else {
                // Close other subcategories in the same parent
                const parentContent = this.closest('.accordion-content');
                const otherHeaders = parentContent.querySelectorAll('.ncop-subcategory-header');
                otherHeaders.forEach(header => {
                    if (header !== this) {
                        header.classList.remove('expanded');
                        header.nextElementSibling.classList.remove('visible');
                    }
                });
                
                this.classList.add('expanded');
                itemsContainer.classList.add('visible');
            }
        });
        
        subcategoryDiv.appendChild(subcategoryHeader);
        subcategoryDiv.appendChild(itemsContainer);
        
        return subcategoryDiv;
    }
    
    // Create individual NCOP item with image, label, and control
    function createNCOPItem(itemData, itemKey) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'ncop-item';
        
        let itemHTML = '';
        
        // Add image if provided
        if (itemData.image && itemData.image.trim() !== '') {
            itemHTML += `
                <div class="ncop-item-image">
                    <img src="${itemData.image}" alt="${itemData.label}" loading="lazy">
                </div>
            `;
        }
        
        // Add label and control container
        itemHTML += `
            <div class="ncop-item-content">
                <div class="ncop-item-label">${itemData.label}</div>
                <div class="ncop-item-control">
        `;
        
        // Add appropriate control based on type
        if (itemData.type === 'toggle') {
            itemHTML += `
                <label class="ncop-toggle">
                    <input type="checkbox" data-endpoint="${itemData.endpoint}" data-item-key="${itemKey}">
                    <span class="ncop-toggle-slider"></span>
                </label>
            `;
        } else if (itemData.type === 'dropdown') {
            itemHTML += `
                <select class="ncop-dropdown" data-endpoint="${itemData.endpoint}" data-item-key="${itemKey}">
                    <option value="">Select Option</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                </select>
            `;
        }
        
        itemHTML += `
                </div>
            </div>
        `;
        
        itemDiv.innerHTML = itemHTML;
        
        // Add event listeners for controls
        const toggleInput = itemDiv.querySelector('input[type="checkbox"]');
        const dropdownSelect = itemDiv.querySelector('select');
        
        if (toggleInput) {
            toggleInput.addEventListener('change', function() {
                handleNCOPToggle(this.dataset.endpoint, this.dataset.itemKey, this.checked);
            });
        }
        
        if (dropdownSelect) {
            dropdownSelect.addEventListener('change', function() {
                handleNCOPDropdown(this.dataset.endpoint, this.dataset.itemKey, this.value);
            });
        }
        
        return itemDiv;
    }
    
    // Initialize accordion click handlers
    function initializeAccordionHandlers() {
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
    }
    
    // Handle sidebar action clicks
    function handleSidebarAction(action, item) {
        console.log('🔧 Sidebar action triggered:', action, item);
        
        // Action router - implement specific functionality here
        switch (action) {
            case 'showIncidents':
                alert('Active Incidents panel will be implemented');
                break;
            case 'showAlerts':
                alert('Emergency Alerts panel will be implemented');
                break;
            case 'showWeather':
                alert('Weather Conditions panel will be implemented');
                break;
            case 'toggleLayer':
                alert(`Map layer '${item.layerId}' toggle will be implemented`);
                break;
            case 'showProfile':
                alert('User Profile panel will be implemented');
                break;
            case 'exportData':
                if (window.ncop_utils && window.ncop_utils.exportSettings) {
                    window.ncop_utils.exportSettings();
                }
                break;
            case 'showHelp':
                alert('Help & Support panel will be implemented');
                break;
            default:
                alert(`Action '${action}' will be implemented in future updates`);
        }
    }
    
    // Fallback basic sidebar structure
    function createBasicSidebar() {
        const accordionContainer = document.querySelector('#sidebarPanel .accordion-container');
        if (!accordionContainer) return;
        
        accordionContainer.innerHTML = `
            <div class="accordion-item">
                <div class="accordion-header">
                    <i data-lucide="settings"></i>
                    <span>System Menu</span>
                    <i data-lucide="chevron-down" class="accordion-chevron"></i>
                </div>
                <div class="accordion-content">
                    <ul class="accordion-items">
                        <li class="accordion-item-entry">
                            <i data-lucide="download"></i>
                            <span>Export Settings</span>
                        </li>
                        <li class="accordion-item-entry">
                            <i data-lucide="help-circle"></i>
                            <span>Help & Support</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;
        
        // Initialize basic handlers
        initializeAccordionHandlers();
        lucide.createIcons();
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

// Handle NCOP toggle controls
function handleNCOPToggle(endpoint, itemKey, isEnabled) {
    console.log(`🔄 NCOP Toggle - ${itemKey}:`, {
        endpoint: endpoint,
        enabled: isEnabled
    });
      // Store toggle state in localStorage
    if (window.ncop_storage) {
        window.ncop_storage.saveSetting(`ncop_toggle_${itemKey}`, isEnabled);
    }
    
    // Here you would typically:
    // 1. Make API call to the endpoint
    // 2. Toggle map layers on/off
    // 3. Update UI indicators
    
    // Example API call (implement based on your backend)
    /*
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({
            enabled: isEnabled,
            item: itemKey
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Toggle response:', data);
        // Handle successful toggle
    })
    .catch(error => {
        console.error('Toggle error:', error);
        // Revert toggle state on error
    });
    */
    
    // Temporary feedback
    const message = isEnabled ? 'enabled' : 'disabled';
    console.log(`📡 ${itemKey} has been ${message}`);
}

// Handle NCOP dropdown controls
function handleNCOPDropdown(endpoint, itemKey, selectedValue) {
    console.log(`📋 NCOP Dropdown - ${itemKey}:`, {
        endpoint: endpoint,
        value: selectedValue
    });
      // Store dropdown state in localStorage
    if (window.ncop_storage) {
        window.ncop_storage.saveSetting(`ncop_dropdown_${itemKey}`, selectedValue);
    }
    
    if (selectedValue === '') {
        console.log(`📋 ${itemKey} selection cleared`);
        return;
    }
    
    // Here you would typically:
    // 1. Make API call to the endpoint with selected value
    // 2. Update map layers or data based on selection
    // 3. Update UI to reflect the change
    
    // Example API call (implement based on your backend)
    /*
    fetch(`${endpoint}?option=${selectedValue}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Dropdown response:', data);
        // Handle successful selection
    })
    .catch(error => {
        console.error('Dropdown error:', error);
        // Handle error
    });
    */
    
    // Temporary feedback
    console.log(`📊 ${itemKey} set to: ${selectedValue}`);
}

// Restore NCOP control states from localStorage
function restoreNCOPStates() {
    if (!window.ncop_storage) return;
    
    // Restore toggle states
    const toggles = document.querySelectorAll('.ncop-toggle input[type="checkbox"]');
    toggles.forEach(toggle => {
        const itemKey = toggle.dataset.itemKey;
        const savedState = window.ncop_storage.getSetting(`ncop_toggle_${itemKey}`);
        if (savedState !== null) {
            toggle.checked = savedState;
        }
    });
    
    // Restore dropdown states
    const dropdowns = document.querySelectorAll('.ncop-dropdown');
    dropdowns.forEach(dropdown => {
        const itemKey = dropdown.dataset.itemKey;
        const savedState = window.ncop_storage.getSetting(`ncop_dropdown_${itemKey}`);
        if (savedState !== null) {
            dropdown.value = savedState;
        }
    });
    
    console.log('🔄 NCOP control states restored from localStorage');
}
