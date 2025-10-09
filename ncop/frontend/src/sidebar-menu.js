// SidebarMenu.js

/**
 * Handles the main sidebar logic, including configuration loading, UI generation (accordions),
 * search, and NCOP control state management.
 */
export class SidebarMenu {
    #sidebarPanel;
    #menuControlDiv;
    #accordionContainer;
    #storage = window.ncop_storage;

    constructor() {
        this.renderButton();
        this.#sidebarPanel = document.getElementById("sidebarPanel");
        this.#accordionContainer = this.#sidebarPanel?.querySelector(
            ".accordion-container"
        );
        this.loadSidebarConfig();
        this.addEventListeners();
        console.log("📋 Sidebar menu initialized");
    }

    renderButton() {
        const mapContainer = document.getElementById("map");
        this.#menuControlDiv = document.createElement("div");
        this.#menuControlDiv.className = "custom-menu-control";
        this.#menuControlDiv.innerHTML = `
            <button id="menuToggle" class="custom-menu-btn" title="Open Menu">
                <i data-lucide="menu"></i>
            </button>
        `;
        mapContainer.appendChild(this.#menuControlDiv);
        lucide.createIcons();
    }

    addEventListeners() {
        document
            .getElementById("menuToggle")
            ?.addEventListener("click", this.openSidebar.bind(this));
        document
            .getElementById("sidebarCloseBtn")
            ?.addEventListener("click", this.closeSidebar.bind(this));
        document.addEventListener("keydown", this.#handleKeydown.bind(this));
    }

    openSidebar() {
        this.#sidebarPanel?.classList.add("visible");
        this.#menuControlDiv?.classList.add("hidden");
    }

    closeSidebar() {
        this.#sidebarPanel?.classList.remove("visible");
        this.#menuControlDiv?.classList.remove("hidden");
    }

    #handleKeydown(event) {
        if (
            event.key === "Escape" &&
            this.#sidebarPanel?.classList.contains("visible")
        ) {
            this.closeSidebar();
        }
    }

    // --- Configuration Loading and Population ---

    async loadSidebarConfig() {
        try {
            const response = await fetch("/static/data/ncop_menu.json");
            const menuData = await response.json();

            if (menuData) {
                this.#populateNCOPSidebar(menuData);
            }
        } catch (error) {
            console.error("Error loading NCOP menu configuration:", error);
            this.#createBasicSidebar();
        }
    }

    #populateNCOPSidebar(menuData) {
        if (!this.#accordionContainer) return;

        this.#accordionContainer.innerHTML = "";

        Object.keys(menuData).forEach((categoryKey) => {
            const categoryData = menuData[categoryKey];
            const categoryElement = this.#createNCOPCategorySection(
                categoryKey,
                categoryData
            );
            this.#accordionContainer.appendChild(categoryElement);
        });

        lucide.createIcons();
        this.#initializeAccordionHandlers();
        this.#initializeSearchFunctionality();

        // Restore NCOP control states after UI is ready
        setTimeout(() => {
            this.#restoreNCOPStates();
        }, 100);
    }

    // --- Sidebar UI Generation ---

    #getCategoryConfig(categoryKey) {
        const categoryConfig = {
            gis_layers: {
                title: "GIS Layers",
                icon: "layers",
                customIcon: "/static/icons/accordion_icons/gis-layers.webp",
            },
            weather: {
                title: "Weather Systems",
                icon: "cloud",
                customIcon: "/static/icons/accordion_icons/weather-systems.webp",
            },
            flood: {
                title: "Flood Monitoring",
                icon: "waves",
                customIcon: "/static/icons/accordion_icons/flood.webp",
            },
            air_quality: {
                title: "Air Quality",
                icon: "wind",
                customIcon: "/static/icons/accordion_icons/air-quality.webp",
            },
            "ocean/coastal": {
                title: "Ocean & Coastal",
                icon: "anchor",
                customIcon: "/static/icons/accordion_icons/ocean-coastal.webp",
            },
            "Disaster Early Warning (DEW)": {
                title: "Early Warning",
                icon: "alert-triangle",
                customIcon: "/static/icons/accordion_icons/early-warning.webp",
            },
        };
        return (
            categoryConfig[categoryKey] || {
                title: categoryKey
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                icon: "folder",
            }
        );
    }

    #createNCOPCategorySection(categoryKey, categoryData) {
        const sectionDiv = document.createElement("div");
        sectionDiv.className = "accordion-item";
        const config = this.#getCategoryConfig(categoryKey);

        const iconHtml = config.customIcon
            ? `<img src="${config.customIcon}" alt="${config.title}" class="accordion-custom-icon">`
            : `<i data-lucide="${config.icon}" class="accordion-icon"></i>`;

        const header = document.createElement("div");
        header.className = "accordion-header";
        header.innerHTML = `${iconHtml}<span class="accordion-title">${config.title}</span><i data-lucide="chevron-down" class="accordion-chevron"></i>`;

        const content = document.createElement("div");
        content.className = "accordion-content";

        Object.keys(categoryData).forEach((subcategoryKey) => {
            const subcategoryData = categoryData[subcategoryKey];
            content.appendChild(
                this.#createNCOPSubcategorySection(subcategoryKey, subcategoryData)
            );
        });

        sectionDiv.appendChild(header);
        sectionDiv.appendChild(content);
        return sectionDiv;
    }

    #createNCOPSubcategorySection(subcategoryKey, subcategoryData) {
        const subcategoryDiv = document.createElement("div");
        subcategoryDiv.className = "ncop-subcategory";

        const subcategoryHeader = document.createElement("div");
        subcategoryHeader.className = "ncop-subcategory-header";
        subcategoryHeader.innerHTML = `<span>${subcategoryKey}</span><i data-lucide="chevron-right" class="subcategory-chevron"></i>`;

        const itemsContainer = document.createElement("div");
        itemsContainer.className = "ncop-items-container";

        Object.keys(subcategoryData).forEach((itemKey) => {
            itemsContainer.appendChild(
                this.#createNCOPItem(subcategoryData[itemKey], itemKey)
            );
        });

        subcategoryHeader.addEventListener("click", function () {
            const isExpanded = this.classList.contains("expanded");
            const parentContent = this.closest(".accordion-content");
            const otherHeaders = parentContent?.querySelectorAll(
                ".ncop-subcategory-header"
            );

            otherHeaders?.forEach((header) => {
                if (header !== this) {
                    header.classList.remove("expanded");
                    header.nextElementSibling?.classList.remove("visible");
                }
            });

            if (!isExpanded) {
                this.classList.add("expanded");
                itemsContainer.classList.add("visible");
            } else {
                this.classList.remove("expanded");
                itemsContainer.classList.remove("visible");
            }
        });

        subcategoryDiv.appendChild(subcategoryHeader);
        subcategoryDiv.appendChild(itemsContainer);
        return subcategoryDiv;
    }

    #createNCOPItem(itemData, itemKey) {
        const itemDiv = document.createElement("div");
        itemDiv.className = "ncop-item";

        let controlHTML = "";
        if (itemData.type === "toggle") {
            controlHTML = `<label class="ncop-toggle"><input type="checkbox" data-endpoint="${itemData.endpoint}" data-item-key="${itemKey}"><span class="ncop-toggle-slider"></span></label>`;
        } else if (itemData.type === "dropdown") {
            // Simplified dropdown options for this refactoring example
            controlHTML = `
                <select class="ncop-dropdown" data-endpoint="${itemData.endpoint}" data-item-key="${itemKey}">
                    <option value="">Select Option</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                </select>
            `;
        }

        itemDiv.innerHTML = `
            ${itemData.image && itemData.image.trim() !== ""
                ? `<div class="ncop-item-image"><img src="${itemData.image}" alt="${itemData.label}" loading="lazy"></div>`
                : ""
            }
            <div class="ncop-item-content">
                <div class="ncop-item-label">${itemData.label}</div>
                <div class="ncop-item-control">${controlHTML}</div>
            </div>
        `;

        const toggleInput = itemDiv.querySelector('input[type="checkbox"]');
        const dropdownSelect = itemDiv.querySelector("select");

        if (toggleInput) {
            toggleInput.addEventListener("change", (e) =>
                this.#handleNCOPToggle(
                    e.target.dataset.endpoint,
                    e.target.dataset.itemKey,
                    e.target.checked
                )
            );
        }

        if (dropdownSelect) {
            dropdownSelect.addEventListener("change", (e) =>
                this.#handleNCOPDropdown(
                    e.target.dataset.endpoint,
                    e.target.dataset.itemKey,
                    e.target.value
                )
            );
        }

        return itemDiv;
    }

    #initializeAccordionHandlers() {
        document.querySelectorAll(".accordion-header").forEach((header) => {
            header.addEventListener("click", function () {
                const accordionContent = this.nextElementSibling;
                const isActive = this.classList.contains("active");

                document
                    .querySelectorAll(".accordion-header")
                    .forEach((otherHeader) => {
                        if (otherHeader !== this) {
                            otherHeader.classList.remove("active");
                            otherHeader.nextElementSibling?.classList.remove("expanded");
                        }
                    });

                this.classList.toggle("active", !isActive);
                accordionContent?.classList.toggle("expanded", !isActive);
            });
        });
    }

    #createBasicSidebar() {
        if (!this.#accordionContainer) return;
        this.#accordionContainer.innerHTML = `
            <div class="accordion-item">
                <div class="accordion-header">
                    <i data-lucide="settings"></i>
                    <span>System Menu</span>
                    <i data-lucide="chevron-down" class="accordion-chevron"></i>
                </div>
                <div class="accordion-content">
                    <ul class="accordion-items">
                        <li class="accordion-item-entry" data-action="exportData">
                            <i data-lucide="download"></i><span>Export Settings</span>
                        </li>
                        <li class="accordion-item-entry" data-action="showHelp">
                            <i data-lucide="help-circle"></i><span>Help & Support</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;
        this.#initializeAccordionHandlers();
        lucide.createIcons();
    }

    // --- NCOP Control Handlers ---

    #handleNCOPToggle(endpoint, itemKey, isEnabled) {
        console.log(`🔄 NCOP Toggle - ${itemKey}:`, {
            endpoint: endpoint,
            enabled: isEnabled,
        });

        if (this.#storage) {
            this.#storage.saveSetting(`ncop_toggle_${itemKey}`, isEnabled);
        }

        const message = isEnabled ? "enabled" : "disabled";
        console.log(`📡 ${itemKey} has been ${message}`);

        // Placeholder for API/Map Layer logic
    }

    #handleNCOPDropdown(endpoint, itemKey, selectedValue) {
        console.log(`📋 NCOP Dropdown - ${itemKey}:`, {
            endpoint: endpoint,
            value: selectedValue,
        });

        if (this.#storage) {
            this.#storage.saveSetting(`ncop_dropdown_${itemKey}`, selectedValue);
        }

        if (selectedValue === "") {
            console.log(`📋 ${itemKey} selection cleared`);
            return;
        }

        console.log(`📊 ${itemKey} set to: ${selectedValue}`);

        // Placeholder for API/Map Layer logic
    }

    #restoreNCOPStates() {
        if (!this.#storage) return;

        document
            .querySelectorAll('.ncop-toggle input[type="checkbox"]')
            .forEach((toggle) => {
                const itemKey = toggle.dataset.itemKey;
                const savedState = this.#storage.getSetting(`ncop_toggle_${itemKey}`);
                if (savedState !== null) {
                    toggle.checked = savedState;
                }
            });

        document.querySelectorAll(".ncop-dropdown").forEach((dropdown) => {
            const itemKey = dropdown.dataset.itemKey;
            const savedState = this.#storage.getSetting(`ncop_dropdown_${itemKey}`);
            if (savedState !== null) {
                dropdown.value = savedState;
            }
        });

        console.log("🔄 NCOP control states restored from localStorage");
    }

    // --- Search Functionality ---

    #initializeSearchFunctionality() {
        const searchInput = document.getElementById("sidebarSearch");
        const clearSearchBtn = document.getElementById("clearSearch");

        if (!searchInput || !clearSearchBtn) return;

        searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (searchTerm) {
                clearSearchBtn.style.display = "flex";
                this.#performSearch(searchTerm);
            } else {
                clearSearchBtn.style.display = "none";
                this.#clearSearch();
            }
        });

        clearSearchBtn.addEventListener("click", () => {
            searchInput.value = "";
            clearSearchBtn.style.display = "none";
            this.#clearSearch();
        });
    }

    #performSearch(searchTerm) {
        const accordionContainer = this.#accordionContainer;
        if (!accordionContainer) return;

        let visibleCount = 0;
        const accordions = accordionContainer.querySelectorAll(".accordion-item");

        accordions.forEach((accordion) => {
            let accordionHasMatch = false;
            const accordionHeader = accordion.querySelector(".accordion-header");
            const accordionContent = accordion.querySelector(".accordion-content");
            const accordionTitleElement = accordionHeader.querySelector("span");
            const accordionTitle =
                accordionTitleElement?.textContent.toLowerCase() || "";
            const accordionMatches = accordionTitle.includes(searchTerm);

            if (accordionMatches) {
                accordionHasMatch = true;
            }

            const subcategories = accordion.querySelectorAll(".ncop-subcategory");
            let visibleSubcategories = 0;

            subcategories.forEach((subcategory) => {
                let subcategoryHasMatch = false;
                const subcategoryHeader = subcategory.querySelector(
                    ".ncop-subcategory-header"
                );
                const subcategoryHeaderSpan = subcategoryHeader?.querySelector("span");
                const subcategoryTitle = subcategoryHeaderSpan
                    ? subcategoryHeaderSpan.textContent.toLowerCase()
                    : "";
                const itemsContainer = subcategory.querySelector(
                    ".ncop-items-container"
                );

                if (subcategoryTitle.includes(searchTerm)) {
                    subcategoryHasMatch = true;
                    accordionHasMatch = true;
                }

                const items = subcategory.querySelectorAll(".ncop-item");
                let visibleItems = 0;

                items.forEach((item) => {
                    const itemLabel = item.querySelector(".ncop-item-label");
                    const itemText = itemLabel ? itemLabel.textContent.toLowerCase() : "";

                    const toggleInput = item.querySelector('input[type="checkbox"]');
                    const dropdownSelect = item.querySelector("select");

                    const allItemText = [
                        itemText,
                        toggleInput ? toggleInput.dataset.endpoint || "" : "",
                        dropdownSelect ? dropdownSelect.dataset.endpoint || "" : "",
                        subcategoryTitle,
                        accordionTitle,
                    ]
                        .join(" ")
                        .toLowerCase();

                    if (allItemText.includes(searchTerm)) {
                        item.style.display = "flex";
                        visibleItems++;
                        subcategoryHasMatch = true;
                        accordionHasMatch = true;
                        this.#highlightText(itemLabel, searchTerm);
                    } else {
                        item.style.display = "none";
                        this.#removeHighlight(itemLabel);
                    }
                });

                if (subcategoryHasMatch) {
                    subcategory.style.display = "block";
                    visibleSubcategories++;

                    if (subcategoryTitle.includes(searchTerm)) {
                        this.#highlightText(subcategoryHeaderSpan, searchTerm);
                    } else {
                        this.#removeHighlight(subcategoryHeaderSpan);
                    }

                    if (itemsContainer && subcategoryHeader && visibleItems > 0) {
                        itemsContainer.classList.add("visible");
                        subcategoryHeader.classList.add("expanded");
                    }
                } else {
                    subcategory.style.display = "none";
                    this.#removeHighlight(subcategoryHeaderSpan);
                }
            });

            if (accordionHasMatch) {
                accordion.style.display = "block";
                visibleCount++;

                if (accordionContent && visibleSubcategories > 0) {
                    accordionContent.classList.add("expanded");
                    accordionHeader.classList.add("active");
                }

                if (accordionMatches && accordionTitleElement) {
                    this.#highlightText(accordionTitleElement, searchTerm);
                } else if (accordionTitleElement) {
                    this.#removeHighlight(accordionTitleElement);
                }
            } else {
                accordion.style.display = "none";
                if (accordionTitleElement) {
                    this.#removeHighlight(accordionTitleElement);
                }
            }
        });

        if (visibleCount === 0) {
            this.#showNoResultsMessage();
        } else {
            this.#removeNoResultsMessage();
        }
    }

    #clearSearch() {
        const accordionContainer = this.#accordionContainer;
        if (!accordionContainer) return;

        accordionContainer
            .querySelectorAll(".accordion-item")
            .forEach((accordion) => {
                accordion.style.display = "block";

                const header = accordion.querySelector(".accordion-header");
                const content = accordion.querySelector(".accordion-content");
                const headerTitle = header.querySelector("span");

                this.#removeHighlight(headerTitle);

                header.classList.remove("active");
                content.classList.remove("expanded");

                accordion
                    .querySelectorAll(".ncop-subcategory")
                    .forEach((subcategory) => {
                        subcategory.style.display = "block";

                        const subHeader = subcategory.querySelector(
                            ".ncop-subcategory-header"
                        );
                        const subHeaderTitle = subHeader?.querySelector("span");
                        const itemsContainer = subcategory.querySelector(
                            ".ncop-items-container"
                        );

                        this.#removeHighlight(subHeaderTitle);

                        subHeader?.classList.remove("expanded");
                        itemsContainer?.classList.remove("visible");

                        subcategory.querySelectorAll(".ncop-item").forEach((item) => {
                            item.style.display = "flex";
                            const label = item.querySelector(".ncop-item-label");
                            this.#removeHighlight(label);
                        });
                    });
            });

        this.#removeNoResultsMessage();
    }

    #highlightText(element, searchTerm) {
        if (!element || !searchTerm) return;
        this.#removeHighlight(element); // Ensure no prior highlights
        const originalText = element.textContent;
        const regex = new RegExp(`(${searchTerm})`, "gi");
        const highlightedText = originalText.replace(
            regex,
            '<span class="search-highlight">$1</span>'
        );
        element.innerHTML = highlightedText;
    }

    #removeHighlight(element) {
        if (!element) return;
        // Use a loop to handle nested structure if necessary
        const highlightedElements = element.querySelectorAll(".search-highlight");
        highlightedElements.forEach((highlighted) => {
            const parent = highlighted.parentNode;
            parent.replaceChild(
                document.createTextNode(highlighted.textContent),
                highlighted
            );
            parent.normalize();
        });

        // Also clean up the element itself if it was highlighted
        if (element.classList.contains("search-highlight")) {
            const parent = element.parentNode;
            parent.replaceChild(
                document.createTextNode(element.textContent),
                element
            );
            parent.normalize();
        }
    }

    #showNoResultsMessage() {
        this.#removeNoResultsMessage();
        if (this.#accordionContainer) {
            const noResultsDiv = document.createElement("div");
            noResultsDiv.className = "no-results-message";
            noResultsDiv.innerHTML = `<p>No results found</p><small>Try different keywords or check spelling</small>`;
            this.#accordionContainer.appendChild(noResultsDiv);
            lucide.createIcons();
        }
    }

    #removeNoResultsMessage() {
        document.querySelector(".no-results-message")?.remove();
    }
}
