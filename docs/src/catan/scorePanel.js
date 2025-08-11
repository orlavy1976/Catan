// docs/src/catan/scorePanel.js
// 🏆 Score Panel - Material Design

import { 
  MATERIAL_COLORS,
  MATERIAL_SPACING,
  Z_INDEX
} from "../config/materialDesign.js";
import { PLAYER_COLORS } from "../config/constants.js";
import { 
  createMaterialText,
} from "../utils/materialUI.js";

export function createScorePanel(app, state) {
  const panel = new PIXI.Container();
  panel.zIndex = Z_INDEX.scorePanel;

  const bg = new PIXI.Graphics();
  panel.addChild(bg);

  // Title - Material Design typography
  const title = createMaterialText("Score", 'headlineSmall');
  title.style.fill = MATERIAL_COLORS.neutral[100]; // Light text
  panel.addChild(title);

  const rowsC = new PIXI.Container();
  panel.addChild(rowsC);

  function layout() {
    const width = 200; // Fixed width for score panel
    const titleHeight = title.height || 20;
    const contentHeight = rowsC.height || 0;
    const totalHeight = MATERIAL_SPACING[6] * 2 + titleHeight + MATERIAL_SPACING[3] + contentHeight;
    const height = Math.max(80, totalHeight);

    // Panel background - Material Design surface
    bg.clear();
    bg.beginFill(MATERIAL_COLORS.surface.primary, 1);
    bg.drawRoundedRect(0, 0, width, height, 12); // 12px border radius
    bg.endFill();

    // Title positioning
    title.x = MATERIAL_SPACING[4]; // 16px padding
    title.y = MATERIAL_SPACING[4]; // 16px padding

    // Position rows container
    rowsC.x = MATERIAL_SPACING[4]; // 16px padding
    rowsC.y = title.y + titleHeight + MATERIAL_SPACING[3]; // 12px spacing

    // Position panel at bottom-right corner
    panel.x = app.renderer.width - width - MATERIAL_SPACING[6]; // 24px margin
    panel.y = app.renderer.height - height - MATERIAL_SPACING[6]; // 24px margin
  }

  layout();
  window.addEventListener("resize", layout);

  function setScores(scoreRows) {
    rowsC.removeChildren();
    
    scoreRows.forEach((row, idx) => {
      const line = new PIXI.Container();
      rowsC.addChild(line);

      // Player badge with Material Design colors
      const badge = new PIXI.Graphics();
      badge.beginFill(PLAYER_COLORS[row.playerIdx], 1);
      badge.drawCircle(0, 0, 8); // Material Design chip size
      badge.endFill();
      badge.x = 8;
      badge.y = 8 + 2; // Center with text
      line.addChild(badge);

      // Player name and score - Material Design typography
      const name = `P${row.playerIdx + 1}`;
      const scoreText = createMaterialText(`${name}: ${row.total} VP`, 'bodyMedium');
      scoreText.style.fill = MATERIAL_COLORS.neutral[100];
      scoreText.x = 16 + MATERIAL_SPACING[2]; // 8px spacing
      scoreText.y = 0;
      line.addChild(scoreText);

      // Score breakdown details - Material Design typography
      const bits = [];
      if (row.settlements) bits.push(`${row.settlements}×S`);
      if (row.cities) bits.push(`${row.cities}×C`);
      if (row.devVP) bits.push(`${row.devVP}×VP`);
      if (row.hasLargestArmy) bits.push("LA+2");
      if (row.hasLongestRoad) bits.push("LR+2");

      const detail = createMaterialText(bits.join("  "), 'bodySmall');
      detail.style.fill = MATERIAL_COLORS.neutral[200];
      detail.x = scoreText.x;
      detail.y = scoreText.y + scoreText.height + 2;
      line.addChild(detail);
    });

    // Position rows with Material Design spacing
    let currentY = 0;
    rowsC.children.forEach(line => {
      line.y = currentY;
      currentY += MATERIAL_SPACING[9]; // 36px row height
    });

    layout();
  }

  return { container: panel, setScores };
}
