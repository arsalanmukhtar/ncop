// Layer interaction logging system - tracks state and logs interactions

// Import the menu configuration to access item data
import { ncop_menu_items } from './map-layers.js';

// In-memory state tracking for all items
const layerStates = new Map();

/**
 * Initialize state for an item if it doesn't exist
 */
function initializeItemState(categoryKey, subcategoryKey, itemKey) {
    const stateKey = `${categoryKey}.${subcategoryKey}.${itemKey}`;
    if (!layerStates.has(stateKey)) {
        layerStates.set(stateKey, { active: false });
    }
    return stateKey;
}

/**
 * Get the item data from map-layers.js configuration
 */
function getItemData(categoryKey, subcategoryKey, itemKey, itemType) {
    try {
        const categoryData = ncop_menu_items[categoryKey];
        if (!categoryData) return null;
        
        const subcategoryData = categoryData[subcategoryKey];
        if (!subcategoryData) return null;
        
        const typeData = subcategoryData[itemType];
        if (!typeData) return null;
        
        return typeData[itemKey];
    } catch (error) {
        console.error(`❌ Error getting item data for ${categoryKey}.${subcategoryKey}.${itemKey}:`, error);
        return null;
    }
}

/**
 * Handle toggle item interactions (checkboxes)
 */
export function handleToggleInteraction(categoryKey, subcategoryKey, itemKey, isChecked) {
    const stateKey = initializeItemState(categoryKey, subcategoryKey, itemKey);
    const itemData = getItemData(categoryKey, subcategoryKey, itemKey, 'toggle');
    
    // Update state
    layerStates.set(stateKey, { active: isChecked });
    
    // Log the interaction with full item data
    console.log('🔄 TOGGLE INTERACTION:', {
        category: categoryKey,
        subcategory: subcategoryKey,
        itemKey: itemKey,
        itemData: itemData,
        active: isChecked,
        stateKey: stateKey
    });
}

/**
 * Handle temporal item interactions (image clicks)
 */
export function handleTemporalInteraction(categoryKey, subcategoryKey, itemKey, isActive) {
    const stateKey = initializeItemState(categoryKey, subcategoryKey, itemKey);
    const itemData = getItemData(categoryKey, subcategoryKey, itemKey, 'temporal');
    
    // Update state
    layerStates.set(stateKey, { active: isActive });
    
    // Log the interaction with full item data
    console.log('🖼️ TEMPORAL INTERACTION:', {
        category: categoryKey,
        subcategory: subcategoryKey,
        itemKey: itemKey,
        itemData: itemData,
        active: isActive,
        stateKey: stateKey
    });
}

/**
 * Handle dropdown item interactions (select changes)
 */
export function handleDropdownInteraction(categoryKey, subcategoryKey, selectedValue, selectedLabel) {
    const stateKey = initializeItemState(categoryKey, subcategoryKey, 'dropdown');
    const itemData = getItemData(categoryKey, subcategoryKey, 'dropdown', 'dropdown');
    
    const isActive = selectedValue && selectedValue !== '';
    
    // Update state
    layerStates.set(stateKey, { 
        active: isActive,
        selectedValue: selectedValue,
        selectedLabel: selectedLabel
    });
    
    // Log the interaction with full item data
    console.log('📋 DROPDOWN INTERACTION:', {
        category: categoryKey,
        subcategory: subcategoryKey,
        itemKey: 'dropdown',
        itemData: itemData,
        active: isActive,
        selectedValue: selectedValue,
        selectedLabel: selectedLabel,
        stateKey: stateKey
    });
}

/**
 * Handle button item interactions (button clicks)
 */
export function handleButtonInteraction(categoryKey, subcategoryKey, itemKey) {
    const stateKey = initializeItemState(categoryKey, subcategoryKey, itemKey);
    const itemData = getItemData(categoryKey, subcategoryKey, itemKey, 'button');
    
    // Toggle the current state
    const currentState = layerStates.get(stateKey);
    const newActive = !currentState.active;
    
    // Update state
    layerStates.set(stateKey, { active: newActive });
    
    // Log the interaction with full item data
    console.log('🔘 BUTTON INTERACTION:', {
        category: categoryKey,
        subcategory: subcategoryKey,
        itemKey: itemKey,
        itemData: itemData,
        active: newActive,
        stateKey: stateKey
    });
    
    return newActive;
}

/**
 * Get current state of an item
 */
export function getItemState(categoryKey, subcategoryKey, itemKey) {
    const stateKey = `${categoryKey}.${subcategoryKey}.${itemKey}`;
    return layerStates.get(stateKey) || { active: false };
}

/**
 * Get all current states (for debugging)
 */
export function getAllStates() {
    return Object.fromEntries(layerStates);
}

/**
 * Clear all states
 */
export function clearAllStates() {
    layerStates.clear();
    console.log('🗑️ All layer states cleared');
}