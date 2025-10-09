// BasemapPanel.js
import { MapControls } from "./map-controls.js";

/**
 * Handles the top-right basemap/style and labels control.
 */
export class BasemapPanel {
    #map;
    #storage = window.ncop_storage;
    #mapControls;
    #basemapStyles = [
        // ... (Styles array remains the same as in the original structure)
        { id: "streets-v12", name: "Streets", emoji: "🏙️" },
        { id: "satellite-streets-v12", name: "Satellite", emoji: "🛰️" },
        { id: "outdoors-v12", name: "Outdoors", emoji: "🏔️" },
        { id: "light-v11", name: "Light", emoji: "☀️" },
        { id: "dark-v11", name: "Dark", emoji: "🌙" },
        { id: "satellite-v9", name: "Satellite Only", emoji: "📡" },
        { id: "navigation-day-v1", name: "Navigation Day", emoji: "🗺️" },
        { id: "navigation-night-v1", name: "Navigation Night", emoji: "🌃" },
    ];
    #currentStyle;
    #labelsEnabled;

    /**
     * @param {mapboxgl.Map} mapInstance
     * @param {MapControls} mapControlsInstance
     */
    constructor(mapInstance, mapControlsInstance) {
        this.#map = mapInstance;
        this.#mapControls = mapControlsInstance;
        this.#currentStyle = this.#storage
            ? this.#storage.getMapStyle()
            : "streets-v12";
        this.#labelsEnabled = this.#storage ? this.#storage.getLabelsState() : true;
        this.render();
        this.addEventListeners();
    }

    render() {
        const mapContainer = document.getElementById("map");
        const basemapContainer = document.createElement("div");
        basemapContainer.className = "custom-basemap-control";
        basemapContainer.innerHTML = `
            <button id="basemapToggle" class="custom-basemap-btn" title="Change Basemap">
                <i data-lucide="layers"></i>
            </button>
            <div id="basemapPanel" class="basemap-panel">
                <div class="labels-toggle">
                    <span class="labels-toggle-text">Show Labels</span>
                    <div class="toggle-switch ${this.#labelsEnabled ? "active" : ""
            }" id="labelsToggle">
                        <div class="toggle-slider"></div>
                    </div>
                </div>
                <div class="basemap-list" id="basemapList">
                    ${this.#basemapStyles
                .map(
                    (style) => `
                        <div class="basemap-item ${style.id === this.#currentStyle ? "active" : ""
                        }" data-style="${style.id}">
                            <div class="basemap-image">${style.emoji}</div>
                            <span class="basemap-name">${style.name}</span>
                        </div>
                    `
                )
                .join("")}
                </div>
            </div>
        `;
        mapContainer.appendChild(basemapContainer);
        lucide.createIcons();
    }

    addEventListeners() {
        const basemapToggle = document.getElementById("basemapToggle");
        const basemapPanel = document.getElementById("basemapPanel");
        const labelsToggle = document.getElementById("labelsToggle");
        const basemapList = document.getElementById("basemapList");

        basemapToggle?.addEventListener("click", (e) => {
            e.stopPropagation();
            basemapPanel.classList.toggle("visible");
        });

        labelsToggle?.addEventListener(
            "click",
            this.#handleLabelsToggle.bind(this)
        );
        basemapList?.addEventListener(
            "click",
            this.#handleBasemapSelection.bind(this)
        );
        document.addEventListener("click", this.#handleOutsideClick.bind(this));

        const userPanel = document.getElementById("userPanel");
        if (userPanel) {
            this.#observeUserPanel(userPanel);
        }
    }

    #handleLabelsToggle() {
        this.#labelsEnabled = !this.#labelsEnabled;
        const labelsToggle = document.getElementById("labelsToggle");
        labelsToggle.classList.toggle("active", this.#labelsEnabled);

        if (this.#storage) {
            this.#storage.saveLabelsState(this.#labelsEnabled);
        }

        this.#mapControls.toggleMapLabels(this.#labelsEnabled);
    }

    #handleBasemapSelection(event) {
        const basemapItem = event.target.closest(".basemap-item");
        if (basemapItem) {
            const newStyle = basemapItem.dataset.style;
            const basemapPanel = document.getElementById("basemapPanel");

            document.querySelectorAll(".basemap-item").forEach((item) => {
                item.classList.remove("active");
            });
            basemapItem.classList.add("active");

            this.#map.setStyle(`mapbox://styles/mapbox/${newStyle}`);
            this.#currentStyle = newStyle;

            if (this.#storage) {
                this.#storage.saveMapStyle(newStyle);
            }

            basemapPanel.classList.remove("visible");

            // Reapply labels setting after style loads
            this.#map.once("styledata", () => {
                if (!this.#labelsEnabled) {
                    this.#mapControls.toggleMapLabels(false);
                }
            });
        }
    }

    #handleOutsideClick(event) {
        const basemapToggle = document.getElementById("basemapToggle");
        const basemapPanel = document.getElementById("basemapPanel");
        if (
            !basemapPanel.contains(event.target) &&
            !basemapToggle.contains(event.target)
        ) {
            basemapPanel.classList.remove("visible");
        }
    }

    #observeUserPanel(userPanel) {
        const basemapContainer = document.querySelector(".custom-basemap-control");
        const basemapPanel = document.getElementById("basemapPanel");

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "class"
                ) {
                    if (userPanel.classList.contains("user-panel-visible")) {
                        basemapContainer.classList.add("panel-open");
                        basemapPanel.classList.remove("visible");
                    } else {
                        basemapContainer.classList.remove("panel-open");
                    }
                }
            });
        });
        observer.observe(userPanel, { attributes: true });
    }
}
