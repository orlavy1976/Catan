// docs/src/utils/resourceDialog.js
// 🎯 Resource Selection Dialog
// Specialized dialog for resource selection in development cards

import { 
  createMaterialDialog,
  MATERIAL_DIALOG_TYPES 
} from './materialDialog.js';

import { 
  createMaterialText,
  scaleTo
} from './materialUI.js';

import { 
  MATERIAL_SPACING,
  MATERIAL_MOTION
} from '../config/materialDesign.js';

/**
 * Create a resource selection dialog
 * @param {PIXI.Application} app - PixiJS application
 * @param {object} options - Dialog options
 * @returns {object} Dialog instance
 */
export function createResourceDialog(app, options = {}) {
  const config = {
    title: 'Select Resource',
    subtitle: '',
    resources: ['brick', 'wood', 'wheat', 'sheep', 'ore'],
    onResourceSelect: null,
    showCancel: true,
    animation: 'scale',
    ...options
  };

  // Create Material Design dialog
  const dialog = createMaterialDialog(app, {
    type: MATERIAL_DIALOG_TYPES.MEDIUM,
    title: config.title,
    subtitle: config.subtitle,
    animation: config.animation
  });

  // Create main content container
  const mainContainer = new PIXI.Container();
  dialog.addContent(mainContainer);

  let currentY = 20;

  // Create resource chips
  const chipContainer = new PIXI.Container();
  const chips = [];

  config.resources.forEach((resource, index) => {
    const chip = createResourceChip(resource, () => {
      config.onResourceSelect?.(resource, index);
      dialog.close();
    });
    
    chips.push(chip);
  });

  // Arrange chips in a grid
  const chipsPerRow = 3;
  const chipWidth = 88;
  const chipHeight = 40;
  const chipGapX = MATERIAL_SPACING[4]; // 16px
  const chipGapY = MATERIAL_SPACING[4]; // 16px

  chips.forEach((chip, index) => {
    const row = Math.floor(index / chipsPerRow);
    const col = index % chipsPerRow;
    
    chip.x = col * (chipWidth + chipGapX);
    chip.y = row * (chipHeight + chipGapY);
    
    chipContainer.addChild(chip);
  });

  // Calculate total width and center the container
  const totalRows = Math.ceil(chips.length / chipsPerRow);
  const totalWidth = Math.min(chips.length, chipsPerRow) * chipWidth + (Math.min(chips.length, chipsPerRow) - 1) * chipGapX;
  const totalHeight = totalRows * chipHeight + (totalRows - 1) * chipGapY;
  
  // For MEDIUM dialog type, content area is approximately 480px wide (560 - 2*40 padding)
  const dialogContentWidth = 480;
  chipContainer.x = (dialogContentWidth - totalWidth) / 2;
  chipContainer.y = currentY;
  mainContainer.addChild(chipContainer);

  // Add cancel button if requested
  if (config.showCancel) {
    dialog.addButton('Cancel', {
      variant: 'text'
    });
  }

  return dialog;
}

/**
 * Create a resource selection chip
 * @param {string} resource - Resource type
 * @param {function} onClick - Click handler
 * @returns {PIXI.Container} Resource chip
 */
function createResourceChip(resource, onClick) {
  const container = new PIXI.Container();
  
  // Resource-specific colors from Catan board system
  const resourceColors = {
    brick: { bg: 0xb04a3a, light: 0xd66558, text: 0xffffff },
    wood: { bg: 0x256d39, light: 0x358a4b, text: 0xffffff },
    wheat: { bg: 0xd8b847, light: 0xe5c95f, text: 0x2c2c2c },
    sheep: { bg: 0x7bbf6a, light: 0x93cc82, text: 0x2c2c2c },
    ore: { bg: 0x6a6f7b, light: 0x828a98, text: 0xffffff }
  };
  
  const colors = resourceColors[resource] || { bg: 0x94a3b8, light: 0xb6c5d4, text: 0x2c2c2c };
  
  // Background with elevation shadow
  const shadow = new PIXI.Graphics();
  shadow.beginFill(0x000000, 0.15);
  shadow.drawRoundedRect(2, 4, 88, 40, 8);
  shadow.endFill();
  container.addChild(shadow);
  
  // Main background
  const bg = new PIXI.Graphics();
  bg.beginFill(colors.bg, 1);
  bg.lineStyle(0);
  bg.drawRoundedRect(0, 0, 88, 40, 8);
  bg.endFill();
  container.addChild(bg);
  
  // Highlight overlay for modern look
  const highlight = new PIXI.Graphics();
  highlight.beginFill(0xffffff, 0.1);
  highlight.drawRoundedRect(0, 0, 88, 20, 8);
  highlight.endFill();
  container.addChild(highlight);
  
  // Resource text with proper contrast
  const text = createMaterialText(
    resource.charAt(0).toUpperCase() + resource.slice(1), 
    'buttonSmall'
  );
  text.tint = colors.text;
  text.anchor.set(0.5);
  text.x = 44;
  text.y = 20;
  container.addChild(text);
  
  // Store original and hover colors for smooth transitions
  const originalColor = colors.bg;
  const hoverColor = colors.light;
  
  // Hover effects
  container.eventMode = "static";
  container.cursor = "pointer";
  
  container.on("pointerover", () => {
    scaleTo(container, MATERIAL_MOTION.hover.scale, MATERIAL_MOTION.duration.fast);
    bg.tint = hoverColor;
  });
  
  container.on("pointerout", () => {
    scaleTo(container, 1, MATERIAL_MOTION.duration.fast);
    bg.tint = originalColor;
  });
  
  container.on("pointertap", onClick);
  
  return container;
}
