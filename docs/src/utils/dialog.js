// docs/src/utils/dialog.js
// 🎭 Dialog System
// Comprehensive dialog utilities for consistent, animated dialogs

import { 
  COLORS, 
  ALPHA, 
  TYPOGRAPHY, 
  DIMENSIONS, 
  SPACING,
  EFFECTS, 
  UI_STYLES,
  Z_INDEX
} from "../config/design.js";
import { 
  drawPanel,
  drawModalOverlay,
  createStyledText,
  createTitle,
  createSubtitle,
  createBodyText,
  fadeIn,
  scaleTo,
  centerContainer,
  stackVertically,
  arrangeHorizontally
} from "./ui.js";
import { makeButton } from "../catan/ui/button.js";

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
  drawPanel(panelBg, width, height, UI_STYLES.modalBackground());
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
      fadeOut(overlay, EFFECTS.animation.normal, () => {
        app.stage.removeChild(overlay);
        config.onClose?.();
      });
    } else if (config.animation === DIALOG_ANIMATION.SCALE) {
      scaleTo(panel, 0.8, EFFECTS.animation.normal);
      fadeOut(overlay, EFFECTS.animation.normal, () => {
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

// ==================== SPECIALIZED DIALOG CREATORS ====================

/**
 * Create a confirmation dialog with Yes/No buttons
 * @param {PIXI.Application} app - PixiJS application
 * @param {object} options - Dialog options
 * @returns {object} Dialog instance
 */
export function createConfirmDialog(app, options = {}) {
  const config = {
    title: 'Confirm Action',
    message: 'Are you sure?',
    yesText: 'Yes',
    noText: 'No',
    onYes: null,
    onNo: null,
    type: DIALOG_TYPES.SMALL,
    ...options
  };

  const dialog = createDialog(app, {
    ...config,
    subtitle: config.message,
    closeOnOverlay: false,
    showCloseButton: false
  });

  // Create buttons
  const buttonContainer = new PIXI.Container();
  const yesButton = makeButton(config.yesText, 120, 'primary');
  const noButton = makeButton(config.noText, 120, 'secondary');

  // Position buttons
  arrangeHorizontally([
    { container: noButton.container },
    { container: yesButton.container }
  ], 0, SPACING.md);

  // Center button container
  buttonContainer.x = (dialog.contentWidth - (240 + SPACING.md)) / 2;
  buttonContainer.y = dialog.contentStartY + SPACING.lg;

  buttonContainer.addChild(noButton.container);
  buttonContainer.addChild(yesButton.container);
  dialog.content.addChild(buttonContainer);

  // Wire button events
  yesButton.onClick(() => {
    config.onYes?.();
    dialog.close();
  });

  noButton.onClick(() => {
    config.onNo?.();
    dialog.close();
  });

  return dialog;
}

/**
 * Create a choice dialog with multiple options
 * @param {PIXI.Application} app - PixiJS application
 * @param {object} options - Dialog options
 * @returns {object} Dialog instance
 */
export function createChoiceDialog(app, options = {}) {
  const config = {
    title: 'Choose Option',
    choices: [],
    onChoice: null,
    showCancel: true,
    cancelText: 'Cancel',
    onCancel: null,
    ...options
  };

  const dialog = createDialog(app, {
    ...config,
    type: DIALOG_TYPES.MEDIUM,
    closeOnOverlay: config.showCancel,
    showCloseButton: config.showCancel
  });

  let currentY = dialog.contentStartY;

  // Create choice buttons
  config.choices.forEach((choice, index) => {
    const button = makeButton(
      choice.label || choice, 
      dialog.contentWidth - 40, 
      'primary'
    );
    
    button.container.x = 20;
    button.container.y = currentY;
    
    button.onClick(() => {
      config.onChoice?.(choice.value || choice, index);
      dialog.close();
    });

    dialog.content.addChild(button.container);
    currentY += button.container.height + SPACING.md;
  });

  // Cancel button if needed
  if (config.showCancel) {
    const cancelButton = makeButton(config.cancelText, 120, 'secondary');
    cancelButton.container.x = (dialog.contentWidth - 120) / 2;
    cancelButton.container.y = currentY + SPACING.lg;
    
    cancelButton.onClick(() => {
      config.onCancel?.();
      dialog.close();
    });

    dialog.content.addChild(cancelButton.container);
  }

  return dialog;
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

// ==================== ANIMATION HELPERS ====================

/**
 * Fade out animation
 * @param {PIXI.Container} container - Container to animate
 * @param {number} duration - Animation duration
 * @param {function} onComplete - Completion callback
 */
function fadeOut(container, duration = EFFECTS.animation.normal, onComplete = null) {
  const startTime = Date.now();
  const startAlpha = container.alpha;
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    container.alpha = startAlpha * (1 - progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  };
  
  requestAnimationFrame(animate);
}

/**
 * Animate to Y position
 * @param {PIXI.Container} container - Container to animate
 * @param {number} targetY - Target Y position
 * @param {number} duration - Animation duration
 */
function animateToY(container, targetY, duration = EFFECTS.animation.normal) {
  const startTime = Date.now();
  const startY = container.y;
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    container.y = startY + (targetY - startY) * eased;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
}

// ==================== RESOURCE CHIP HELPER ====================

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
  const text = createStyledText(
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
