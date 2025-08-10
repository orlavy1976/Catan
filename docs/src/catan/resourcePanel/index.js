import { makePlayerRow } from "./row.js";
import { 
  MATERIAL_COLORS,
  MATERIAL_SPACING
} from "../../config/materialDesign.js";
import { Z_INDEX } from "../../config/design.js";
import { 
  createMaterialText,
  drawMaterialCard 
} from "../../utils/materialUI.js";

const RES_ORDER = ["brick","wood","wheat","sheep","ore"];

export function createResourcePanel(app, state) {
  const panel = new PIXI.Container();
  panel.zIndex = Z_INDEX.panels;
  app.stage.addChild(panel);
  app.stage.sortableChildren = true;

  // Background - using Material Design
  const bg = new PIXI.Graphics();
  panel.addChild(bg);

  // Title - using Material Design
  const title = createMaterialText("Players", 'headlineSmall');
  title.style.fill = MATERIAL_COLORS.neutral[100]; // Light text
  panel.addChild(title);

  // Player rows
  const rows = []; // { container, setResource(kind,count), setActive(isActive) }

  function buildRows() {
    // Clear existing rows
    rows.forEach(r => panel.removeChild(r.container));
    rows.length = 0;

    // Create rows for each player
    state.players.forEach((p, idx) => {
      const row = makePlayerRow(p);
      panel.addChild(row.container);
      rows.push(row);
    });

    // Position rows with Material Design spacing
    const startY = MATERIAL_SPACING[4] + (title.height || 24) + MATERIAL_SPACING[3];
    rows.forEach((row, idx) => {
      row.container.y = startY + (idx * (48 + MATERIAL_SPACING[2])); // Larger row height + spacing
    });
  }

  function layout() {
    const screenWidth = app.renderer.width;
    const screenHeight = app.renderer.height;
    
    // Responsive scaling with Material Design breakpoints
    const scaleFactor = Math.min(1, screenWidth / 1200);
    const responsiveSpacing = Math.max(MATERIAL_SPACING[2], MATERIAL_SPACING[4] * scaleFactor);
    
    // Calculate required width using Material Design sizing
    const minWidth = 280 * scaleFactor; // Increased minimum width
    const contentWidth = (80 + (5 * 52) + 50 + 24) * scaleFactor; // More generous spacing
    const width = Math.max(minWidth, contentWidth);
    
    const rowHeight = Math.max(40, 48 * scaleFactor); // Material Design row height
    const titleHeight = (title.height || 24) * scaleFactor;
    const topPadding = MATERIAL_SPACING[4] * scaleFactor;
    const bottomPadding = MATERIAL_SPACING[4] * scaleFactor;
    const gapAfterTitle = MATERIAL_SPACING[3] * scaleFactor;
    const rowGap = MATERIAL_SPACING[2] * scaleFactor;
    
    // Calculate total content height
    const contentHeight = titleHeight + gapAfterTitle + (state.players.length * rowHeight) + ((state.players.length - 1) * rowGap);
    const totalHeight = topPadding + contentHeight + bottomPadding;
    
    const height = Math.max(totalHeight, 140 * scaleFactor);

    // Use Material Design elevated surface
    drawMaterialCard(bg, width, height, {
      backgroundColor: MATERIAL_COLORS.surface.primary,
      borderRadius: 12 * scaleFactor
    });

    // Position title with Material Design spacing
    title.x = MATERIAL_SPACING[4] * scaleFactor; 
    title.y = MATERIAL_SPACING[4] * scaleFactor;
    
    // Scale title text
    title.scale.set(scaleFactor);

    // Position panel responsively at bottom-left corner
    let panelX = responsiveSpacing;
    let panelY = screenHeight - height - responsiveSpacing;
    
    // Adjust for smaller screens
    if (screenWidth < 1000) {
      panelX = Math.min(responsiveSpacing, MATERIAL_SPACING[2]);
      panelY = Math.max(panelY, screenHeight * 0.6); // Keep in bottom 40%
    }
    
    panel.x = panelX;
    panel.y = panelY;
    
    console.log("📊 Material Design resource panel - Size:", `${width.toFixed(0)}x${height.toFixed(0)}`, "Position:", `${panelX.toFixed(0)},${panelY.toFixed(0)}`);
  }

  function updateResources(players) {
    players.forEach((p, idx) => {
      const row = rows[idx];
      if (!row) return;
      
      // Update resource counts
      RES_ORDER.forEach(k => row.setResource(k, p.resources?.[k] ?? 0));
      
      // Calculate and update development card count
      const devCardCount = calculateDevCardCount(p);
      row.setDevCards(devCardCount);
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
  layout();
  window.addEventListener("resize", layout);

  // Initialize
  updateResources(state.players);
  setCurrent((state.currentPlayer ?? 1) - 1);

  return { container: panel, updateResources, setCurrent };
}
