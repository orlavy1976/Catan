// docs/src/utils/dialog.js
// 🎭 Dialog System
// Comprehensive dialog utilities for consistent, animated dialogs

import { 
  SPACING,
  EFFECTS, 
  UI_STYLES,
  Z_INDEX
} from "../config/materialDesign.js";
const ALPHA = { panelBackground: 0.95, modalBackground: 0.98 };
import { makeButton } from "../catan/ui/materialButton.js";
import { fadeOut as materialFadeOut, drawMaterialCard, createMaterialText } from './materialUI.js';

// ==================== DIALOG TYPES ====================

export const DIALOG_TYPES = {
  SMALL: { width: 420, height: 200 },
  MEDIUM: { width: 560, height: 320 },
  LARGE: { width: 720, height: 450 },
  CUSTOM: { width: null, height: null }
};

export const DIALOG_ANIMATION = {
  NONE: 'none',
  FADE: 'fade',
  SCALE: 'scale',
  SLIDE_UP: 'slide_up'
};

// ==================== BASE DIALOG CREATOR ====================

/**
 * Create a base dialog with overlay, panel, and common functionality
 * @param {PIXI.Application} app - PixiJS application
 * @param {object} options - Dialog configuration
 * @returns {object} Dialog components and methods
 */
export function createDialog(app, options = {}) {
  const config = {
    type: DIALOG_TYPES.MEDIUM,
    title: '',
    subtitle: '',
    animation: DIALOG_ANIMATION.FADE,
    closeOnOverlay: true,
    showCloseButton: true,
    width: null,
    height: null,
    onClose: null,
    ...options
  };

  // Calculate dimensions
  const width = config.width || config.type.width;
  const height = config.height || config.type.height;

  // Create overlay container
  const overlay = new PIXI.Container();
  overlay.zIndex = Z_INDEX.modals;

  // Create modal overlay background
  const overlayBg = new PIXI.Graphics();
  drawModalOverlay(overlayBg, app.renderer.width, app.renderer.height);
  overlay.addChild(overlayBg);

  // Handle overlay click to close
  if (config.closeOnOverlay) {
    overlayBg.eventMode = "static";
    overlayBg.cursor = "pointer";
    overlayBg.on("pointertap", () => {
      close();
    });
  }

  // Create main panel
  const panel = new PIXI.Container();
  overlay.addChild(panel);

  // Panel background
  const panelBg = new PIXI.Graphics();
  drawMaterialCard(panelBg, width, height, UI_STYLES.modalBackground());
  panel.addChild(panelBg);

  // Content container (inside panel with padding)
  const content = new PIXI.Container();
  content.x = SPACING.lg;
  content.y = SPACING.lg;
  panel.addChild(content);

  // Available content area
  const contentWidth = width - (SPACING.lg * 2);
  const contentHeight = height - (SPACING.lg * 2);

  // Header elements
  let currentY = 0;
  let titleText = null;
  let subtitleText = null;
  let closeButton = null;

  // Title
  if (config.title) {
    titleText = createTitle(config.title);
    titleText.x = 0;
    titleText.y = currentY;
    content.addChild(titleText);
    currentY += titleText.height + SPACING.md;
  }

  // Subtitle
  if (config.subtitle) {
    subtitleText = createSubtitle(config.subtitle);
    subtitleText.x = 0;
    subtitleText.y = currentY;
    content.addChild(subtitleText);
    currentY += subtitleText.height + SPACING.lg;
  }

  // Close button (top-right)
  if (config.showCloseButton) {
    closeButton = makeButton("×", 32, 'secondary');
    closeButton.container.x = width - 40;
    closeButton.container.y = 8;
    closeButton.onClick(() => close());
    panel.addChild(closeButton.container);
  }

  // Content area start position
  const contentStartY = currentY;

  // Position panel in center
  panel.x = (app.renderer.width - width) / 2;
  panel.y = (app.renderer.height - height) / 2;

  // Track if dialog is open
  let isOpen = false;

  // Close function
  function close() {
    if (!isOpen) return;
    isOpen = false;

    // Exit animation
    if (config.animation === DIALOG_ANIMATION.FADE) {
      materialFadeOut(overlay, EFFECTS.animation.normal, () => {
        app.stage.removeChild(overlay);
        config.onClose?.();
      });
    } else if (config.animation === DIALOG_ANIMATION.SCALE) {
      scaleTo(panel, 0.8, EFFECTS.animation.normal);
      materialFadeOut(overlay, EFFECTS.animation.normal, () => {
        app.stage.removeChild(overlay);
        config.onClose?.();
      });
    } else {
      app.stage.removeChild(overlay);
      config.onClose?.();
    }
  }

  // Show function
  function show() {
    if (isOpen) return;
    isOpen = true;

    app.stage.addChild(overlay);

    // Entrance animation
    if (config.animation === DIALOG_ANIMATION.FADE) {
      fadeIn(overlay, EFFECTS.animation.normal);
    } else if (config.animation === DIALOG_ANIMATION.SCALE) {
      panel.scale.set(0.8);
      overlay.alpha = 0;
      fadeIn(overlay, EFFECTS.animation.normal);
      scaleTo(panel, 1, EFFECTS.animation.normal);
    } else if (config.animation === DIALOG_ANIMATION.SLIDE_UP) {
      const originalY = panel.y;
      panel.y = app.renderer.height;
      overlay.alpha = 0;
      fadeIn(overlay, EFFECTS.animation.fast);
      animateToY(panel, originalY, EFFECTS.animation.normal);
    }
  }

  return {
    overlay,
    panel,
    content,
    titleText,
    subtitleText,
    closeButton,
    contentWidth,
    contentHeight,
    contentStartY,
    width,
    height,
    show,
    close,
    isOpen: () => isOpen
  };
}

/**
 * Create a resource selection dialog
 * @param {PIXI.Application} app - PixiJS application
 * @param {object} options - Dialog options
 * @returns {object} Dialog instance
 */
export function createResourceDialog(app, options = {}) {
  const config = {
    title: 'Select Resource',
    resources: ['brick', 'wood', 'wheat', 'sheep', 'ore'],
    onResourceSelect: null,
    showCancel: true,
    ...options
  };

  const dialog = createDialog(app, {
    ...config,
    type: DIALOG_TYPES.MEDIUM,
    closeOnOverlay: config.showCancel
  });

  // Create resource chips
  const chipContainer = new PIXI.Container();
  const chips = [];

  config.resources.forEach((resource, index) => {
    const chip = createResourceChip(resource, () => {
      config.onResourceSelect?.(resource, index);
      dialog.close();
    });
    
    chips.push({ container: chip });
  });

  // Arrange chips in rows
  const chipsPerRow = 3;
  let currentRow = 0;
  let currentCol = 0;
  const chipGap = SPACING.md;
  const rowGap = SPACING.lg;

  chips.forEach((chip, index) => {
    chip.container.x = currentCol * (100 + chipGap);
    chip.container.y = currentRow * (50 + rowGap);
    
    chipContainer.addChild(chip.container);
    
    currentCol++;
    if (currentCol >= chipsPerRow) {
      currentCol = 0;
      currentRow++;
    }
  });

  // Center chip container
  chipContainer.x = (dialog.contentWidth - chipContainer.width) / 2;
  chipContainer.y = dialog.contentStartY;
  dialog.content.addChild(chipContainer);

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
  
  // Background
  const bg = new PIXI.Graphics();
  const style = UI_STYLES.resourceChip;
  bg.beginFill(style.background.color, style.background.alpha);
  bg.drawRoundedRect(0, 0, 88, 40, style.borderRadius);
  bg.endFill();
  
  if (style.border) {
    bg.lineStyle(style.border);
    bg.drawRoundedRect(0, 0, 88, 40, style.borderRadius);
  }
  
  container.addChild(bg);
  
  // Resource text
  const text = createMaterialText(
    resource.charAt(0).toUpperCase() + resource.slice(1), 
    'buttonSmall'
  );
  text.anchor.set(0.5);
  text.x = 44;
  text.y = 20;
  container.addChild(text);
  
  // Hover effects
  container.eventMode = "static";
  container.cursor = "pointer";
  
  container.on("pointerover", () => {
    scaleTo(container, EFFECTS.hover.scale, EFFECTS.animation.fast);
  });
  
  container.on("pointerout", () => {
    scaleTo(container, 1, EFFECTS.animation.fast);
  });
  
  container.on("pointertap", onClick);
  
  return container;
}
