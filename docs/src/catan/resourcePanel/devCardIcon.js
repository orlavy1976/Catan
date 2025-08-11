// docs/src/catan/resourcePanel/devCardIcon.js
// 🃏 Development Card Icon Component - Material Design
// Visual indicator for development cards in the resource panel

import { 
  MATERIAL_COLORS,
  MATERIAL_SPACING
} from "../../config/materialDesign.js";
import { 
  createMaterialText 
} from "../../utils/materialUI.js";

/**
 * Create a development card icon with count - Material Design style
 * @returns {object} Component with container and setCount function
 */
export function makeDevCardIcon() {
  const container = new PIXI.Container();
  
  // Card background - Material Design chip style
  const cardSize = 36;
  const cardBg = new PIXI.Graphics();
  cardBg.beginFill(MATERIAL_COLORS.secondary[100], 1); // Light secondary color
  cardBg.drawRoundedRect(0, 0, cardSize, cardSize, 6); // Material corner radius
  cardBg.endFill();
  cardBg.lineStyle(1, MATERIAL_COLORS.neutral[600], 0.6);
  cardBg.drawRoundedRect(0, 0, cardSize, cardSize, 6);
  container.addChild(cardBg);

  // Card icon - simplified star symbol for development
  const cardIcon = new PIXI.Graphics();
  cardIcon.lineStyle(2, MATERIAL_COLORS.secondary[700], 1);
  // Draw a simple star/development symbol
  const centerX = cardSize / 2;
  const centerY = cardSize / 2;
  const size = 4;
  cardIcon.moveTo(centerX, centerY - size);
  cardIcon.lineTo(centerX + size, centerY + size);
  cardIcon.lineTo(centerX - size, centerY);
  cardIcon.lineTo(centerX + size, centerY);
  cardIcon.lineTo(centerX - size, centerY + size);
  cardIcon.lineTo(centerX, centerY - size);
  container.addChild(cardIcon);

  // Count text - Material Design typography
  const countText = createMaterialText("0", 'labelMedium');
  countText.style.fill = MATERIAL_COLORS.neutral[100]; // Light text
  countText.anchor.set(0.5, 0);
  countText.x = cardSize / 2;
  countText.y = cardSize + MATERIAL_SPACING[1]; // Small gap below icon
  container.addChild(countText);
  // Interactive features - Material Design
  container.eventMode = 'static';
  container.cursor = 'pointer';
  
  let currentCount = 0;
  
  // Material Design hover state
  container.on('pointerover', () => {
    cardBg.alpha = 0.8;
    container.scale.set(1.05);
  });
  
  container.on('pointerout', () => {
    cardBg.alpha = 1;
    container.scale.set(1);
  });

  function setCount(count) {
    currentCount = count;
    countText.text = count.toString();
    
    // Material Design state indication
    if (count === 0) {
      container.alpha = 0.6;
      countText.style.fill = MATERIAL_COLORS.neutral[100];
    } else {
      container.alpha = 1;
      countText.style.fill = MATERIAL_COLORS.neutral[100];
    }
  }

  // Tooltip functionality
  container.on('pointertap', () => {
    console.log(`Player has ${currentCount} development cards`);
  });

  return { container, setCount };
}
