// docs/src/catan/scorePanel.js
// 🏆 Score Panel - Material Design

import { 
  MATERIAL_COLORS,
  MATERIAL_SPACING
} from "../config/materialDesign.js";
import { PLAYER_COLORS } from "../config/constants.js";
import { 
  createMaterialPanel,
  createMaterialRow
} from "../utils/materialPanel.js";

export function createScorePanel(app, state) {
  // Create panel using the unified Material Design system
  const panel = createMaterialPanel(app, {
    title: "Score",
    position: 'bottom-right',
    minWidth: 200,
    minHeight: 80,
    variant: 'elevated',
    responsive: true
  });

  const scoreRows = [];

  function setScores(scoreData) {
    // Clear existing rows
    panel.clearContent();
    scoreRows.length = 0;
    
    scoreData.forEach((row, idx) => {
      // Player name and score
      const name = `P${row.playerIdx + 1}`;
      const scoreText = `${name}: ${row.total} VP`;
      
      // Score breakdown details
      const bits = [];
      if (row.settlements) bits.push(`${row.settlements}×S`);
      if (row.cities) bits.push(`${row.cities}×C`);
      if (row.devVP) bits.push(`${row.devVP}×VP`);
      if (row.hasLargestArmy) bits.push("LA+2");
      if (row.hasLongestRoad) bits.push("LR+2");
      
      const secondaryText = bits.join("  ");
      
      // Create row using the unified system
      const materialRow = createMaterialRow({
        text: scoreText,
        secondaryText: secondaryText,
        color: PLAYER_COLORS[row.playerIdx],
        showBadge: true,
        height: MATERIAL_SPACING[9] // 36px Material Design row height
      });
      
      // Ensure row has proper width initially
      materialRow.resize(180); // Start with a reasonable width
      
      scoreRows.push(materialRow);
      panel.addContent(materialRow.container);
    });
    
    // Force layout update to get correct panel width, then resize rows
    panel.layout();
    
    // Now resize all rows to fit panel width
    const contentWidth = panel.width - (MATERIAL_SPACING[4] * 2); // Account for panel padding
    scoreRows.forEach(row => {
      row.resize(contentWidth);
    });
  }

  return { container: panel.container, setScores };
}
