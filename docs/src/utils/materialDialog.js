// docs/src/utils/materialDialog.js
// 🎨 Material Design Dialog System
// Modern dialog components following Material Design 3 principles

import { 
  MATERIAL_COLORS, 
  MATERIAL_TYPOGRAPHY, 
  MATERIAL_SPACING,
  MATERIAL_SHADOWS,
  MATERIAL_MOTION,
  MATERIAL_BUTTONS
} from "../config/materialDesign.js";

import { 
  createMaterialButton,
  createFloatingActionButton 
} from "../catan/ui/materialButton.js";

import {
  createMaterialText,
  createMaterialContainer,
  drawMaterialCard,
  animateScale,
  animateFade,
  animateSlide
} from "./materialUI.js";

// ==================== DIALOG TYPES ====================

export const MATERIAL_DIALOG_TYPES = {
  ALERT: { width: 400, height: 200, variant: 'alert' },
  CONFIRM: { width: 450, height: 250, variant: 'confirm' },
  CHOICE: { width: 500, height: 300, variant: 'choice' },
  FORM: { width: 600, height: 400, variant: 'form' },
  LARGE: { width: 700, height: 500, variant: 'large' },
  FULLSCREEN: { width: '90%', height: '80%', variant: 'fullscreen' }
};

// ==================== BASE MATERIAL DIALOG ====================

/**
 * Create a Material Design dialog
 * @param {PIXI.Application} app - PIXI application
 * @param {object} options - Dialog options
 * @returns {object} Dialog API
 */
export function createMaterialDialog(app, options = {}) {
  const {
    type = MATERIAL_DIALOG_TYPES.CONFIRM,
    title = '',
    content = '',
    modal = true,
    closeOnEscape = true,
    closeOnOverlay = true,
    animation = 'scale', // 'fade', 'scale', 'slide'
    elevation = 3,
    onClose = null,
  } = options;

  // Calculate dimensions
  let width = type.width;
  let height = type.height;
  
  if (typeof width === 'string' && width.endsWith('%')) {
    width = app.screen.width * (parseInt(width) / 100);
  }
  if (typeof height === 'string' && height.endsWith('%')) {
    height = app.screen.height * (parseInt(height) / 100);
  }

  // Main container
  const container = new PIXI.Container();
  container.zIndex = 10000;
  
  // Modal overlay - improved with warmer, less harsh overlay
  const overlay = new PIXI.Graphics();
  overlay.beginFill(MATERIAL_COLORS.surface.overlay, 0.75); // Increased opacity for better contrast
  overlay.drawRect(0, 0, app.screen.width, app.screen.height);
  overlay.endFill();
  overlay.eventMode = 'static';
  container.addChild(overlay);

  // Dialog surface
  const dialog = new PIXI.Container();
  dialog.x = (app.screen.width - width) / 2;
  dialog.y = (app.screen.height - height) / 2;
  container.addChild(dialog);

  // Background card - enhanced with better colors and subtle gradient
  const background = new PIXI.Graphics();
  drawMaterialCard(background, width, height, {
    elevation,
    backgroundColor: MATERIAL_COLORS.surface.dialog, // New dedicated dialog color
    borderRadius: 12, // Slightly less rounded for modern look
    border: {
      width: 1,
      color: MATERIAL_COLORS.neutral[600], // Subtle border for definition
      alpha: 0.3
    }
  });
  dialog.addChild(background);

  // Title area - positioned at the top with explicit positioning
  let titleText = null;
  let titleHeight = 0;
  if (title) {
    titleText = createMaterialText(title, 'sectionHeader');
    titleText.x = MATERIAL_SPACING[6];
    titleText.y = MATERIAL_SPACING[6];
    dialog.addChild(titleText);
    titleHeight = titleText.height + MATERIAL_SPACING[4]; // Title height + spacing
  }

  // Content area - positioned below title with proper spacing
  const contentArea = new PIXI.Container();
  contentArea.x = MATERIAL_SPACING[6];
  contentArea.y = MATERIAL_SPACING[6] + titleHeight; // Start below title
  dialog.addChild(contentArea);

  // Button area - use simple container instead of material container
  const buttonContainer = new PIXI.Container();
  dialog.addChild(buttonContainer);

  // State
  let isVisible = false;
  let closeCallback = onClose; // Set initial close callback from options
  const buttons = [];
  let currentHeight = height; // Track current dialog height

  // Layout function to adjust dialog size based on content
  function updateLayout() {
    // Recalculate title height in case it changed
    const titleHeight = titleText ? titleText.height + MATERIAL_SPACING[4] : 0;
    
    // Calculate total content height including all children
    let contentHeight = 0;
    if (contentArea.children.length > 0) {
      const lastChild = contentArea.children[contentArea.children.length - 1];
      contentHeight = lastChild.y + lastChild.height;
    }
    
    const buttonHeight = 48; // Standard button height
    const padding = MATERIAL_SPACING[6] * 2; // Top and bottom padding
    const buttonSpacing = MATERIAL_SPACING[4]; // Spacing before buttons
    
    // Calculate required height (add spacing between content and buttons)
    const contentToButtonSpacing = contentHeight > 0 ? MATERIAL_SPACING[4] : 0;
    const requiredHeight = padding + titleHeight + contentHeight + contentToButtonSpacing + buttonSpacing + buttonHeight;
    
    // Use the larger of the minimum height or required height
    currentHeight = Math.max(height, requiredHeight);
    
    // Update content area position (ensure it's always below title)
    contentArea.y = MATERIAL_SPACING[6] + titleHeight;
    
    // Update dialog background with enhanced styling
    background.clear();
    drawMaterialCard(background, width, currentHeight, {
      elevation,
      backgroundColor: MATERIAL_COLORS.surface.dialog,
      borderRadius: 12,
      border: {
        width: 1,
        color: MATERIAL_COLORS.neutral[600],
        alpha: 0.3
      }
    });
    
    // Reposition dialog to stay centered
    dialog.y = (app.screen.height - currentHeight) / 2;
    
    // Position button container dynamically based on content
    buttonContainer.x = MATERIAL_SPACING[6];
    buttonContainer.y = currentHeight - MATERIAL_SPACING[6] - buttonHeight;
  }

  // Event handlers
  if (closeOnOverlay) {
    overlay.on('pointertap', () => {
      close();
    });
  }

  if (closeOnEscape) {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isVisible) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  }

  // Animation functions
  function show() {
    if (isVisible) return;
    
    // Update layout before showing
    updateLayout();
    
    app.stage.addChild(container);
    isVisible = true;

    // Initial state for animation
    container.alpha = 0;
    dialog.scale.set(0.8);

    // Animate in
    if (animation === 'fade') {
      animateFade(container, 1, MATERIAL_MOTION.duration.normal);
    } else if (animation === 'scale') {
      animateFade(container, 1, MATERIAL_MOTION.duration.normal);
      animateScale(dialog, 1, MATERIAL_MOTION.duration.normal, 'emphasized');
    } else if (animation === 'slide') {
      dialog.y += 50;
      animateFade(container, 1, MATERIAL_MOTION.duration.normal);
      animateSlide(dialog, { x: dialog.x, y: dialog.y - 50 }, MATERIAL_MOTION.duration.normal);
    } else {
      container.alpha = 1;
      dialog.scale.set(1);
    }
  }

  function close() {
    if (!isVisible) return;

    // Animate out
    if (animation === 'fade') {
      animateFade(container, 0, MATERIAL_MOTION.duration.fast).then(cleanup);
    } else if (animation === 'scale') {
      Promise.all([
        animateFade(container, 0, MATERIAL_MOTION.duration.fast),
        animateScale(dialog, 0.8, MATERIAL_MOTION.duration.fast, 'accelerate')
      ]).then(cleanup);
    } else if (animation === 'slide') {
      Promise.all([
        animateFade(container, 0, MATERIAL_MOTION.duration.fast),
        animateSlide(dialog, { x: dialog.x, y: dialog.y + 50 }, MATERIAL_MOTION.duration.fast)
      ]).then(cleanup);
    } else {
      cleanup();
    }
  }

  function cleanup() {
    try {
      if (container.parent) {
        container.parent.removeChild(container);
      }
    } catch (error) {
      console.warn('Error removing dialog container:', error);
    }
    isVisible = false;
    closeCallback?.();
  }

  // Public API
  return {
    container,
    dialog,
    contentArea,
    buttonContainer,
    
    // Methods
    show,
    close,
    
    onClose(callback) {
      closeCallback = callback;
    },

    setTitle(newTitle) {
      if (titleText) {
        titleText.text = newTitle;
        // Update layout after title change to reposition content
        updateLayout();
      }
    },

    addButton(label, options = {}) {
      const button = createMaterialButton(label, {
        variant: options.variant || 'text',
        size: options.size || 'medium',
        ...options
      });
      
      button.onClick(() => {
        options.onClick?.();
        if (options.closeOnClick !== false) {
          close();
        }
      });

      buttons.push(button);
      
      // Position buttons from right to left (typical dialog button layout)
      const buttonSpacing = 16;
      const buttonWidth = 120; // Approximate button width
      const totalButtons = buttons.length;
      
      // Reposition all buttons
      buttons.forEach((btn, index) => {
        const rightOffset = (totalButtons - index - 1) * (buttonWidth + buttonSpacing);
        btn.container.x = width - MATERIAL_SPACING[6] - buttonWidth - rightOffset;
        btn.container.y = 0;
      });
      
      buttonContainer.addChild(button.container);
      
      // Update layout after adding button
      updateLayout();
      
      return button;
    },

    addContent(element) {
      contentArea.addChild(element);
      
      // Properly stack content vertically with spacing
      let currentY = 0;
      contentArea.children.forEach((child, index) => {
        child.y = currentY;
        currentY += child.height + (index < contentArea.children.length - 1 ? MATERIAL_SPACING[4] : 0);
      });
      
      // Update layout after adding content
      updateLayout();
    },

    // Get maximum content width for text wrapping
    getMaxContentWidth() {
      return width - (MATERIAL_SPACING[6] * 2); // Account for padding
    },

    // State
    get visible() { return isVisible; },
  };
}

// ==================== SPECIALIZED DIALOGS ====================

/**
 * Create a Material Design alert dialog
 */
export function createMaterialAlert(app, options = {}) {
  const {
    title = 'Alert',
    message = '',
    buttonText = 'OK',
    onOK = null,
  } = options;

  const dialog = createMaterialDialog(app, {
    type: MATERIAL_DIALOG_TYPES.ALERT,
    title,
    ...options
  });

  // Add message content with word wrapping for long messages
  if (message) {
    const messageText = createMaterialText(message, 'bodyLarge', {
      wordWrap: true,
      wordWrapWidth: dialog.getMaxContentWidth(), // Use dynamic width
      align: 'left'
    });
    dialog.addContent(messageText);
  }

  // Add OK button
  dialog.addButton(buttonText, {
    variant: 'filled',
    onClick: onOK,
  });

  return dialog;
}

/**
 * Create a Material Design confirmation dialog
 */
export function createMaterialConfirm(app, options = {}) {
  const {
    title = 'Confirm',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm = null,
    onCancel = null,
  } = options;

  const dialog = createMaterialDialog(app, {
    type: MATERIAL_DIALOG_TYPES.CONFIRM,
    title,
    ...options
  });

  // Add message content with word wrapping for long messages
  if (message) {
    const messageText = createMaterialText(message, 'bodyLarge', {
      wordWrap: true,
      wordWrapWidth: dialog.getMaxContentWidth(), // Use dynamic width
      align: 'left'
    });
    dialog.addContent(messageText);
  }

  // Add buttons with improved styling
  dialog.addButton(cancelText, {
    variant: 'outlined', // Better visual hierarchy
    onClick: onCancel,
  });

  dialog.addButton(confirmText, {
    variant: 'confirm', // Use new confirm style
    onClick: onConfirm,
  });

  return dialog;
}

/**
 * Create a Material Design choice dialog
 */
export function createMaterialChoice(app, options = {}) {
  const {
    title = 'Choose',
    message = '',
    choices = [],
    onChoice = null,
    onCancel = null,
  } = options;

  const dialog = createMaterialDialog(app, {
    type: MATERIAL_DIALOG_TYPES.CHOICE,
    title,
    closeOnOverlay: false, // Prevent accidental closing
    ...options
  });

  // Add message content with word wrapping for long messages
  if (message) {
    const messageText = createMaterialText(message, 'bodyLarge', {
      wordWrap: true,
      wordWrapWidth: dialog.getMaxContentWidth(), // Use dynamic width
      align: 'left'
    });
    dialog.addContent(messageText);
  }

  // Add choice buttons as separate content with proper spacing
  choices.forEach((choice, index) => {
    const choiceButton = createMaterialButton(choice.label || choice, {
      variant: index === 0 ? 'filled' : 'outlined',
      size: 'medium',
      width: dialog.getMaxContentWidth() - MATERIAL_SPACING[2], // Fit within dialog bounds with small margin
    });

    choiceButton.onClick(() => {
      console.log('Choice button clicked:', choice.value || choice); // Debug log
      onChoice?.(choice.value || choice);
      dialog.close();
    });

    // Add each button as separate content - this will handle spacing automatically
    dialog.addContent(choiceButton.container);
  });

  // Add cancel button if provided with better styling
  if (onCancel) {
    dialog.addButton('Cancel', {
      variant: 'outlined',
      onClick: onCancel,
    });
  }

  return dialog;
}
