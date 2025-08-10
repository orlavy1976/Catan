import { makePlayerRow } from "./row.js";
import { 
  DIMENSIONS, 
  SPACING, 
  Z_INDEX,
  COLORS,
  ALPHA
} from "../../config/design.js";
import { 
  drawPanel, 
  createSubtitle,
  stackVertically 
} from "../../utils/ui.js";

const RES_ORDER = ["brick","wood","wheat","sheep","ore"];

export function createResourcePanel(app, state) {
  const panel = new PIXI.Container();
  panel.zIndex = Z_INDEX.panels;
  app.stage.addChild(panel);
  app.stage.sortableChildren = true;

  // רקע - using design system
  const bg = new PIXI.Graphics();
  panel.addChild(bg);

  // כותרת - using design system
  const title = createSubtitle("Players");
  panel.addChild(title);

  // שורות שחקנים
  const rows = []; // { container, setResource(kind,count), setActive(isActive) }

  function buildRows() {
    // נקה קיים
    rows.forEach(r => panel.removeChild(r.container));
    rows.length = 0;

    // Create rows for each player
    state.players.forEach((p, idx) => {
      const row = makePlayerRow(p);
      panel.addChild(row.container);
      rows.push(row);
    });

    // Position rows manually with precise control
    const startY = SPACING.panelPadding + (title.height || 20) + SPACING.sm;
    rows.forEach((row, idx) => {
      row.container.y = startY + (idx * (44 + SPACING.md));
    });
  }

  function layout() {
    const screenWidth = app.renderer.width;
    const screenHeight = app.renderer.height;
    
    // Responsive scaling
    const scaleFactor = Math.min(1, screenWidth / 1200);
    const responsiveSpacing = Math.max(8, SPACING.containerPadding * scaleFactor);
    
    // Calculate required width to fit all content including dev cards
    const minWidth = DIMENSIONS.panel.resourceWidth * scaleFactor;
    const contentWidth = (70 + (5 * 48) + 40 + 20) * scaleFactor; // Player name area + 5 resource icons + dev card icon + padding
    const width = Math.max(minWidth, contentWidth);
    
    const rowHeight = Math.max(35, 44 * scaleFactor); // From row component
    const titleHeight = (title.height || 20) * scaleFactor; // Fallback for title height
    const topPadding = SPACING.panelPadding * scaleFactor;
    const bottomPadding = SPACING.panelPadding * scaleFactor;
    const gapAfterTitle = SPACING.sm * scaleFactor;
    const rowGap = SPACING.md * scaleFactor;
    
    // Calculate total content height more precisely
    const contentHeight = titleHeight + gapAfterTitle + (state.players.length * rowHeight) + ((state.players.length - 1) * rowGap);
    const totalHeight = topPadding + contentHeight + bottomPadding;
    
    const height = Math.max(totalHeight, 120 * scaleFactor);

    // Use design system for panel background
    drawPanel(bg, width, height, {
      color: COLORS.background.primary,
      alpha: ALPHA.panelBackground,
      borderRadius: DIMENSIONS.borderRadius.medium * scaleFactor,
      border: { width: 1, color: COLORS.ui.border, alpha: ALPHA.border }
    });

    // Position title with design system spacing
    title.x = SPACING.panelPadding * scaleFactor; 
    title.y = SPACING.panelPadding * scaleFactor;
    
    // Scale title text
    title.scale.set(scaleFactor);

    // Position panel responsively at bottom-left corner
    let panelX = responsiveSpacing;
    let panelY = screenHeight - height - responsiveSpacing;
    
    // Adjust for smaller screens to prevent overlap with action buttons
    if (screenWidth < 1000) {
      panelX = Math.min(responsiveSpacing, 10);
      panelY = Math.max(panelY, screenHeight * 0.6); // Keep in bottom 40%
    }
    
    panel.x = panelX;
    panel.y = panelY;
    
    console.log("📊 Resource panel layout - Size:", `${width.toFixed(0)}x${height.toFixed(0)}`, "Position:", `${panelX.toFixed(0)},${panelY.toFixed(0)}`);
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

  // בנייה ראשונית
  buildRows();
  layout();
  window.addEventListener("resize", layout);

  // init
  updateResources(state.players);
  setCurrent((state.currentPlayer ?? 1) - 1);

  return { container: panel, updateResources, setCurrent };
}
