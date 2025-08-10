// docs/src/catan/resourcePanel/devCardIcon.js
// 🃏 Development Card Icon Component
// Visual indicator for development cards in the resource panel

import { 
  DIMENSIONS, 
  SPACING, 
  COLORS,
  ALPHA 
} from "../../config/design.js";
import { 
  createStyledText 
} from "../../utils/ui.js";

/**
 * Create a development card icon with count
 * @returns {object} Component with container and setCount function
 */
export function makeDevCardIcon() {
  const container = new PIXI.Container();
  
  // Card background - miniature version of dev card design
  const cardBg = new PIXI.Graphics();
  cardBg.beginFill(COLORS.devCard.background, 1);
  cardBg.drawRoundedRect(0, 0, 24, 32, 3); // Small card shape
  cardBg.endFill();
  cardBg.lineStyle(1, COLORS.devCard.border, 0.6);
  cardBg.drawRoundedRect(0, 0, 24, 32, 3);
  container.addChild(cardBg);

  // Card icon - simple playing card symbol
  const cardIcon = new PIXI.Graphics();
  cardIcon.lineStyle(1.5, COLORS.devCard.text, 1);
  // Draw a simple card stack indication
  cardIcon.drawRoundedRect(2, 2, 16, 20, 2);
  cardIcon.drawRoundedRect(4, 4, 16, 20, 2);
  container.addChild(cardIcon);

  // Count text
  const countText = createStyledText("0", 'resourceCount', {
    fill: COLORS.text.primary,
    fontSize: 11
  });
  countText.anchor.set(0.5, 0);
  countText.x = 12; // Center of card
  countText.y = 34; // Below card
  container.addChild(countText);

  // Hover effect setup
  container.eventMode = 'static';
  container.cursor = 'pointer';
  
  let currentCount = 0;
  
  // Hover interactions
  container.on('pointerover', () => {
    cardBg.alpha = 0.9;
    container.scale.set(1.05);
  });
  
  container.on('pointerout', () => {
    cardBg.alpha = 1;
    container.scale.set(1);
  });

  function setCount(count) {
    currentCount = count;
    countText.text = count.toString();
    
    // Visual feedback for count
    if (count === 0) {
      container.alpha = 0.5;
      countText.style.fill = COLORS.text.muted;
    } else {
      container.alpha = 1;
      countText.style.fill = COLORS.text.primary;
    }
  }

  // Tooltip functionality (show on click)
  container.on('pointertap', () => {
    // This could be expanded to show a tooltip with card breakdown
    console.log(`Player has ${currentCount} development cards`);
  });

  return { container, setCount };
}
