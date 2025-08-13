import { makePlayerRow } from "./row.js";
import { 
  createMaterialPanel
} from "../../utils/materialPanel.js";
import { 
  MATERIAL_SPACING
} from "../../config/materialDesign.js";

const RES_ORDER = ["brick","wood","wheat","sheep","ore"];

export function createResourcePanel(app, state) {
  // Create panel using the unified Material Design system
  const panel = createMaterialPanel(app, {
    title: "Players",
    position: 'bottom-left',
    minWidth: 420,
    minHeight: 140,
    maxHeight: window.innerHeight ? Math.floor(window.innerHeight * 0.92) : 600,
    variant: 'elevated',
    responsive: true
  });

  const rows = []; // { container, setResource(kind,count), setActive(isActive) }

  function buildRows() {
    // Clear existing rows
    panel.clearContent();
    rows.length = 0;

    // Create rows for each player
    state.players.forEach((p, idx) => {
      const row = makePlayerRow(p);
      panel.addContent(row.container);
      rows.push(row);
    });
    
    // Force layout update to get correct panel dimensions
    panel.layout();
    
    // Now resize all rows to fit panel width
    const contentWidth = panel.width - (MATERIAL_SPACING[4] * 2); // Account for panel padding
    
    rows.forEach(row => {
      if (row.resize) {
        // Use the custom resize function that handles icon positioning
        row.resize(contentWidth);
      }
    });
  }
  function updateResources(players, gameState = state) {
    players.forEach((p, idx) => {
      const row = rows[idx];
      if (!row) return;
      
      // Update resource counts
      RES_ORDER.forEach(k => row.setResource(k, p.resources?.[k] ?? 0));
      
      // Calculate and update development card count
      const devCardCount = calculateDevCardCount(p);
      row.setDevCards(devCardCount);
      
      // Update longest road indicator
      const hasLongestRoad = gameState.longestRoad?.owner === idx;
      if (row.setLongestRoad) {
        row.setLongestRoad(hasLongestRoad);
      }
    });
  }

  /**
   * Calculate total development cards for a player
   * @param {object} player - Player object
   * @returns {number} Total development card count
   */
  function calculateDevCardCount(player) {
    if (!player.dev) return 0;
    
    return Object.values(player.dev).reduce((total, count) => {
      return total + (count || 0);
    }, 0);
  }

  function setCurrent(playerIndexZeroBased) {
    rows.forEach((r, i) => r.setActive(i === playerIndexZeroBased));
  }

  // Initial build and layout
  buildRows();

  // Initialize
  updateResources(state.players, state);
  setCurrent((state.currentPlayer ?? 1) - 1);

  return { container: panel.container, updateResources, setCurrent };
}
