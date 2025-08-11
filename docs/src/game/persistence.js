// Game state persistence to localStorage
import { state } from "../core/state.js";
import { patch } from "./stateStore.js";

const STORAGE_KEY = "catan_game_state";
const STORAGE_VERSION = "1.0";

/**
 * Save current game state to localStorage
 */
export function saveGameState() {
  try {
    const gameData = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)) // Deep clone to avoid references
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
    console.log("Game state saved to localStorage");
    return true;
  } catch (error) {
    console.error("Failed to save game state:", error);
    return false;
  }
}

/**
 * Load game state from localStorage
 * @returns {boolean} true if state was loaded successfully
 */
export function loadGameState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log("No saved game state found");
      return false;
    }

    const gameData = JSON.parse(stored);
    
    // Version check for future compatibility
    if (gameData.version !== STORAGE_VERSION) {
      console.warn(`Saved game version ${gameData.version} doesn't match current version ${STORAGE_VERSION}`);
      return false;
    }

    // Validate essential state structure
    if (!gameData.state || !gameData.state.players || !Array.isArray(gameData.state.players)) {
      console.error("Invalid saved game state structure");
      return false;
    }

    // Apply the loaded state
    patch(currentState => {
      Object.assign(currentState, gameData.state);
    });

    console.log("Game state loaded from localStorage");
    return true;
  } catch (error) {
    console.error("Failed to load game state:", error);
    return false;
  }
}

/**
 * Clear saved game state from localStorage
 */
export function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Saved game state cleared");
    return true;
  } catch (error) {
    console.error("Failed to clear saved state:", error);
    return false;
  }
}

/**
 * Check if there's a saved game state available
 * @returns {boolean}
 */
export function hasSavedState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get information about saved game state
 * @returns {object|null} Game info or null if no saved state
 */
export function getSavedStateInfo() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const gameData = JSON.parse(stored);
    return {
      version: gameData.version,
      timestamp: gameData.timestamp,
      turn: gameData.state?.turn,
      phase: gameData.state?.phase,
      currentPlayer: gameData.state?.currentPlayer
    };
  } catch (error) {
    return null;
  }
}

/**
 * Auto-save game state with debouncing to avoid excessive saves
 */
let saveTimeout = null;
export function autoSave() {
  // Clear previous timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Set new timeout for 1 second delay
  saveTimeout = setTimeout(() => {
    saveGameState();
  }, 1000);
}
