// main.js (New Dashboard Entry Point)

// --------------------------------------------------------
// --- START: NCOP Storage Manager Integration (The Fix) ---
// --------------------------------------------------------

// 1. Import the NCOPStorageManager class from its source file.
// NOTE: This assumes you have added 'export default NCOPStorageManager;' to the end of your local-storage-manager.js file.
import NCOPStorageManager from "./local-storage-manager";

// 2. IMMEDIATELY initialize the global variable (window.ncop_storage) upon module load.
// Parcel runs this code before the DOMContentLoaded event fires, ensuring the variable is set when DashboardManager.init() runs.
window.ncop_storage = null;
if (NCOPStorageManager.isAvailable()) {
    window.ncop_storage = new NCOPStorageManager();
} else {
    console.warn(
        "⚠️ LocalStorage not available - user preferences will not be saved"
    );
}

// --------------------------------------------------------
// --- END: NCOP Storage Manager Integration (The Fix) ---
// --------------------------------------------------------

import { MapControls } from "./map-controls.js";
import { NavigationPanel } from "./navigation-panel.js";
import { ProjectionPanel } from "./projection-panel.js";
import { BasemapPanel } from "./basemap-panel.js";
import { SidebarMenu } from "./sidebar-menu.js";
import { UtilityManager } from "./utility-manager.js";
import { UserControl } from "./user-control.js";

/**
 * Main class to handle setup, initialization, and overall state management.
 */
class DashboardManager {
    #map;
    // #storage now safely accesses the global variable set above
    #storage = window.ncop_storage;
    #mapControls;

    init() {
        if (!window.MAPBOX_ACCESS_TOKEN) {
            console.error(
                "Mapbox access token not found. Please check your environment configuration."
            );
            return;
        }
        mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;

        this.#initializeMap();
        this.#map.on("load", this.#onMapLoad.bind(this));
        this.#map.on("moveend", this.#onMapMoveEnd.bind(this));
        this.#map.on("error", (e) => console.error("Map error:", e));

        this.#mapControls = new MapControls(this.#map, this.#storage);

        // ProjectionPanel must be initialized before NavigationPanel to pass its instance
        const projectionPanel = new ProjectionPanel(this.#map, this.#mapControls);

        // Initialize UI components, passing dependencies as needed
        new NavigationPanel(this.#map, this.#mapControls, projectionPanel);
        new UserControl();
        new BasemapPanel(this.#map, this.#mapControls);
        new SidebarMenu();
        new UtilityManager();

        if (this.#storage) {
            this.#storage.updateLastLogin();
        }

        console.log(
            "Dashboard initialized using a modular, class-based structure."
        );
    }

    #initializeMap() {
        const savedStyle = this.#storage
            ? this.#storage.getMapStyle()
            : "streets-v12";
        const savedCenter = this.#storage
            ? this.#storage.getSetting("mapCenter")
            : [74.3, 31.5];
        const savedZoom = this.#storage ? this.#storage.getSetting("mapZoom") : 6;
        const savedProjection = this.#storage
            ? this.#storage.getSetting("mapProjection")
            : "mercator";

        this.#map = new mapboxgl.Map({
            container: "map",
            style: `mapbox://styles/mapbox/${savedStyle}`,
            center: savedCenter,
            zoom: savedZoom,
            projection: savedProjection || "mercator",
            hash: true,
        });
    }

    #onMapLoad() {
        console.log("Map loaded successfully");

        if (this.#storage) {
            const savedBearing = this.#storage.getSetting("mapBearing");
            const savedPitch = this.#storage.getSetting("mapPitch");
            const savedProjection = this.#storage.getSetting("mapProjection");
            const savedTerrain = this.#storage.getSetting("terrainEnabled");
            const labelsEnabled = this.#storage.getLabelsState();

            if (savedBearing !== null || savedPitch !== null) {
                this.#map.setBearing(savedBearing || 0);
                this.#map.setPitch(savedPitch || 0);
            }

            if (savedProjection && savedProjection !== "mercator") {
                setTimeout(() => {
                    this.#mapControls.changeMapProjection(savedProjection);
                }, 500);
            }

            if (savedTerrain) {
                setTimeout(() => {
                    this.#mapControls.enableTerrain();
                    // Note: Update NavigationPanel state here if needed
                }, 800);
            }

            if (!labelsEnabled) {
                setTimeout(() => {
                    this.#mapControls.toggleMapLabels(false);
                }, 1000);
            }
        }
    }

    #onMapMoveEnd() {
        if (this.#storage) {
            // Assumes ncop_storage.saveMapState exists and takes the map instance
            this.#storage.saveMapState(this.#map);
        }
    }
}

// Global Initialization
document.addEventListener("DOMContentLoaded", function () {
    lucide.createIcons();

    // REMOVED: setTimeout is no longer needed as the storage manager is initialized synchronously above.
    new DashboardManager().init();
});
