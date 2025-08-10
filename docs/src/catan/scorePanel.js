// docs/src/catan/scorePanel.js

import { 
  DIMENSIONS, 
  SPACING, 
  Z_INDEX,
  COLORS,
  ALPHA,
  getPlayerColor
} from "../config/design.js";
import { 
  drawPanel, 
  createSubtitle,
  createStyledText,
  stackVertically 
} from "../utils/ui.js";

export function createScorePanel(app, state) {
  const panel = new PIXI.Container();
  panel.zIndex = Z_INDEX.scorePanel;

  const bg = new PIXI.Graphics();
  panel.addChild(bg);

  const title = createSubtitle("Score");
  panel.addChild(title);

  const rowsC = new PIXI.Container();
  panel.addChild(rowsC);

  function layout() {
    const width = DIMENSIONS.panel.scoreWidth;
    const titleHeight = title.height || 20;
    const contentHeight = rowsC.height || 0;
    const totalHeight = SPACING.panelPadding * 2 + titleHeight + SPACING.sm + contentHeight;
    const height = Math.max(80, totalHeight);

    // Use design system for panel background
    drawPanel(bg, width, height, {
      color: COLORS.background.secondary,
      alpha: ALPHA.panelBackground,
      borderRadius: DIMENSIONS.borderRadius.medium,
      border: { width: 2, color: COLORS.ui.border, alpha: ALPHA.border }
    });

    // Position title with design system spacing
    title.x = SPACING.panelPadding; 
    title.y = SPACING.panelPadding;

    // Position rows container
    rowsC.x = SPACING.panelPadding;
    rowsC.y = title.y + titleHeight + SPACING.sm;

    // Position panel at bottom-right corner
    panel.x = app.renderer.width - width - SPACING.containerPadding;
    panel.y = app.renderer.height - height - SPACING.containerPadding;
  }

  layout();
  window.addEventListener("resize", layout);

  function setScores(scoreRows) {
    rowsC.removeChildren();
    
    scoreRows.forEach((row, idx) => {
      const line = new PIXI.Container();
      rowsC.addChild(line);

      // Player badge (matching resource panel style)
      const badge = new PIXI.Graphics();
      badge.beginFill(getPlayerColor(row.playerIdx), 1);
      badge.drawCircle(0, 0, DIMENSIONS.playerBadge.radius);
      badge.endFill();
      badge.x = DIMENSIONS.playerBadge.radius;
      badge.y = DIMENSIONS.playerBadge.radius + 2; // Center with text
      line.addChild(badge);

      // Player name and score - using design system
      const name = `P${row.playerIdx + 1}`;
      const scoreText = createStyledText(`${name}: ${row.total} VP`, 'ui', {
        fill: COLORS.text.secondary
      });
      scoreText.x = DIMENSIONS.playerBadge.radius * 2 + SPACING.sm;
      scoreText.y = 0;
      line.addChild(scoreText);

      // Score breakdown details - using design system
      const bits = [];
      if (row.settlements) bits.push(`${row.settlements}×S`);
      if (row.cities) bits.push(`${row.cities}×C`);
      if (row.devVP) bits.push(`${row.devVP}×VP`);
      if (row.hasLargestArmy) bits.push("LA+2");
      if (row.hasLongestRoad) bits.push("LR+2");

      const detail = createStyledText(bits.join("  "), 'bodySmall', {
        fill: COLORS.text.muted
      });
      detail.x = scoreText.x;
      detail.y = scoreText.y + scoreText.height + 2;
      line.addChild(detail);
    });

    // Position rows with consistent spacing
    let currentY = 0;
    rowsC.children.forEach(line => {
      line.y = currentY;
      currentY += 40; // Consistent row height
    });

    layout();
  }

  return { container: panel, setScores };
}
