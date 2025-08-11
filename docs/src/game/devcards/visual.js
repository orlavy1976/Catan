// docs/src/game/devcards/visual.js
// 🎨 Development Card Visual Components
// Material Design card visuals and UI components

import { 
  createMaterialText,
  drawMaterialCard,
  getMaterialResourceColor
} from "../../utils/materialUI.js";
import { 
  MATERIAL_COLORS,
  MATERIAL_SPACING
} from "../../config/materialDesign.js";

/**
 * Create a Material Design development card face
 * @param {string} cardType - Type of card
 * @param {object} options - Options
 * @returns {PIXI.Container} Card container
 */
export function createDevCardFace(cardType, options = {}) {
  const { 
    width = 96, 
    height = 130, 
    disabled = false 
  } = options;
  
  const container = new PIXI.Container();
  
  // Background card with Material Design styling
  const bg = new PIXI.Graphics();
  drawMaterialCard(bg, width, height, {
    elevation: disabled ? 1 : 2,
    backgroundColor: disabled ? MATERIAL_COLORS.surface.disabled : MATERIAL_COLORS.surface.secondary,
    borderRadius: 12
  });
  container.addChild(bg);

  // Card icon with Material Design colors
  const icon = new PIXI.Graphics();
  icon.x = width / 2;
  icon.y = height / 2 - 10;
  
  const iconColor = disabled ? MATERIAL_COLORS.neutral[600] : MATERIAL_COLORS.neutral[900];
  
  switch (cardType) {
    case "knight":
      // Sword icon
      icon.lineStyle({ width: 3, color: iconColor, alpha: 1 });
      icon.moveTo(-18, -18).lineTo(18, 18);
      icon.moveTo(-10, -6).lineTo(-2, 2);
      icon.moveTo(6, 10).lineTo(12, 16);
      break;
      
    case "road_building":
      // Road segments icon
      icon.lineStyle({ width: 3, color: iconColor, alpha: 1 });
      icon.moveTo(-24, 0).lineTo(24, 0);
      icon.moveTo(-24, -8).lineTo(0, -8);
      icon.moveTo(4, -8).lineTo(24, -8);
      break;
      
    case "year_of_plenty":
      // Abundance triangle icon
      icon.beginFill(iconColor, 1);
      icon.drawPolygon([-18, 10, 0, -16, 18, 10]);
      icon.endFill();
      break;
      
    case "monopoly":
      // Circle/coin icon
      icon.lineStyle({ width: 3, color: iconColor, alpha: 1 });
      icon.drawCircle(0, 0, 20);
      break;
      
    case "vp":
      // Victory star icon
      icon.beginFill(iconColor, 1);
      icon.drawPolygon([-18, 8, -10, -12, 0, 8, 10, -12, 18, 8]);
      icon.endFill();
      break;
      
    default:
      // Default question mark
      const defaultText = createMaterialText("?", 'headlineSmall', {
        fill: iconColor
      });
      defaultText.anchor.set(0.5);
      icon.addChild(defaultText);
  }
  
  container.addChild(icon);

  // Card label with Material Design typography
  const label = createMaterialText(getCardShortName(cardType), 'labelSmall', {
    fill: disabled ? MATERIAL_COLORS.neutral[600] : MATERIAL_COLORS.neutral[900]
  });
  label.anchor.set(0.5, 0);
  label.x = width / 2;
  label.y = height - 30;
  container.addChild(label);

  return container;
}

/**
 * Create a compact dev card count indicator
 * @param {string} cardType - Type of card
 * @param {number} count - Number of cards
 * @param {object} options - Options
 * @returns {PIXI.Container} Count indicator
 */
export function createDevCardCounter(cardType, count, options = {}) {
  const { 
    size = 'medium',
    variant = 'filled' 
  } = options;
  
  const container = new PIXI.Container();
  
  // Determine sizes based on size option
  const sizes = {
    small: { width: 60, height: 40, fontSize: 12 },
    medium: { width: 80, height: 50, fontSize: 14 },
    large: { width: 100, height: 60, fontSize: 16 }
  };
  
  const { width, height, fontSize } = sizes[size];
  
  // Background with Material Design styling
  const bg = new PIXI.Graphics();
  if (variant === 'filled') {
    bg.beginFill(getCardColor(cardType), 0.9);
    bg.drawRoundedRect(0, 0, width, height, 8);
    bg.endFill();
  } else {
    bg.lineStyle({ width: 2, color: getCardColor(cardType), alpha: 0.8 });
    bg.drawRoundedRect(0, 0, width, height, 8);
  }
  container.addChild(bg);

  // Card type initial
  const initial = createMaterialText(getCardInitial(cardType), 'labelMedium', {
    fill: variant === 'filled' ? MATERIAL_COLORS.neutral[0] : getCardColor(cardType),
    fontSize
  });
  initial.x = MATERIAL_SPACING[2];
  initial.y = MATERIAL_SPACING[1];
  container.addChild(initial);

  // Count
  const countText = createMaterialText(count.toString(), 'counter', {
    fill: variant === 'filled' ? MATERIAL_COLORS.neutral[0] : getCardColor(cardType),
    fontSize: fontSize + 2
  });
  countText.x = MATERIAL_SPACING[2];
  countText.y = height - countText.height - MATERIAL_SPACING[1];
  container.addChild(countText);

  return container;
}

/**
 * Create dev card collection display
 * @param {object} devCards - Dev card collection
 * @param {object} options - Options
 * @returns {PIXI.Container} Collection display
 */
export function createDevCardCollection(devCards, options = {}) {
  const { 
    layout = 'horizontal',
    spacing = MATERIAL_SPACING[3],
    showEmpty = false 
  } = options;
  
  const container = new PIXI.Container();
  
  const cardTypes = ['knight', 'road_building', 'year_of_plenty', 'monopoly', 'vp'];
  let currentX = 0;
  let currentY = 0;
  
  cardTypes.forEach(cardType => {
    const count = devCards[cardType] || 0;
    
    if (count > 0 || showEmpty) {
      const counter = createDevCardCounter(cardType, count, {
        variant: count > 0 ? 'filled' : 'outlined'
      });
      
      if (layout === 'horizontal') {
        counter.x = currentX;
        currentX += counter.width + spacing;
      } else {
        counter.y = currentY;
        currentY += counter.height + spacing;
      }
      
      container.addChild(counter);
    }
  });
  
  return container;
}

/**
 * Get Material Design color for card type
 * @param {string} cardType - Card type
 * @returns {number} Color value
 */
function getCardColor(cardType) {
  const colors = {
    knight: MATERIAL_COLORS.error[500],      // Red for combat
    road_building: MATERIAL_COLORS.info[500],     // Blue for infrastructure
    year_of_plenty: MATERIAL_COLORS.warning[500], // Amber for abundance
    monopoly: MATERIAL_COLORS.success[500],       // Green for money
    vp: MATERIAL_COLORS.primary[500]              // Purple for victory
  };
  return colors[cardType] || MATERIAL_COLORS.neutral[500];
}

/**
 * Get short display name for card type
 * @param {string} cardType - Card type
 * @returns {string} Short name
 */
function getCardShortName(cardType) {
  const names = {
    knight: 'Knight',
    road_building: 'Road Build',
    year_of_plenty: 'Year Plenty',
    monopoly: 'Monopoly',
    vp: 'Victory'
  };
  return names[cardType] || cardType;
}

/**
 * Get single character initial for card type
 * @param {string} cardType - Card type
 * @returns {string} Initial
 */
function getCardInitial(cardType) {
  const initials = {
    knight: 'K',
    road_building: 'R',
    year_of_plenty: 'Y',
    monopoly: 'M',
    vp: 'V'
  };
  return initials[cardType] || '?';
}
