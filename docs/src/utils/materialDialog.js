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
  
  // Modal overlay
  const overlay = new PIXI.Graphics();
  overlay.beginFill(MATERIAL_COLORS.neutral[950], 0.5);
  overlay.drawRect(0, 0, app.screen.width, app.screen.height);
  overlay.endFill();
  overlay.eventMode = 'static';
  container.addChild(overlay);

  // Dialog surface
  const dialog = new PIXI.Container();
  dialog.x = (app.screen.width - width) / 2;
  dialog.y = (app.screen.height - height) / 2;
  container.addChild(dialog);

  // Background card
  const background = new PIXI.Graphics();
  drawMaterialCard(background, width, height, {
    elevation,
    backgroundColor: MATERIAL_COLORS.surface.secondary,
    borderRadius: 16,
  });
  dialog.addChild(background);

  // Content container with proper padding
  const contentContainer = createMaterialContainer({
    padding: MATERIAL_SPACING[6],
    gap: MATERIAL_SPACING[4],
    direction: 'vertical'
  });
  dialog.addChild(contentContainer);

  // Title
  let titleText = null;
  if (title) {
    titleText = createMaterialText(title, 'sectionHeader');
    contentContainer.materialLayout.addChild(titleText);
  }

  // Content area
  const contentArea = new PIXI.Container();
  contentContainer.materialLayout.addChild(contentArea);

  // Button area - use simple container instead of material container
  const buttonContainer = new PIXI.Container();
  dialog.addChild(buttonContainer);

  // Position button container at bottom
  buttonContainer.x = MATERIAL_SPACING[6];
  buttonContainer.y = height - MATERIAL_SPACING[6] - 48; // 48 = button height

  // State
  let isVisible = false;
  let closeCallback = onClose; // Set initial close callback from options
  const buttons = [];

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
      return button;
    },

    addContent(element) {
      contentArea.addChild(element);
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

  // Add message content
  if (message) {
    const messageText = createMaterialText(message, 'bodyLarge');
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

  // Add message content
  if (message) {
    const messageText = createMaterialText(message, 'bodyLarge');
    dialog.addContent(messageText);
  }

  // Add buttons
  dialog.addButton(cancelText, {
    variant: 'text',
    onClick: onCancel,
  });

  dialog.addButton(confirmText, {
    variant: 'filled',
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

  // Add message content
  if (message) {
    const messageText = createMaterialText(message, 'bodyLarge');
    dialog.addContent(messageText);
  }

  // Add choice buttons in content area with manual positioning
  const choiceContainer = new PIXI.Container();
  dialog.addContent(choiceContainer);

  let currentY = 0;
  choices.forEach((choice, index) => {
    const choiceButton = createMaterialButton(choice.label || choice, {
      variant: index === 0 ? 'filled' : 'outlined',
      size: 'medium',
      width: 400,
    });

    choiceButton.onClick(() => {
      console.log('Choice button clicked:', choice.value || choice); // Debug log
      onChoice?.(choice.value || choice);
      dialog.close();
    });

    // Manual positioning
    choiceButton.container.x = 50; // Center in dialog
    choiceButton.container.y = currentY;
    choiceContainer.addChild(choiceButton.container);
    
    currentY += 60; // Button height + spacing
  });

  // Add cancel button if provided
  if (onCancel) {
    dialog.addButton('Cancel', {
      variant: 'text',
      onClick: onCancel,
    });
  }

  return dialog;
}

/**
 * Create a Material Design form dialog
 */
export function createMaterialForm(app, options = {}) {
  const {
    title = 'Form',
    fields = [],
    onSubmit = null,
    onCancel = null,
    submitText = 'Submit',
    cancelText = 'Cancel',
  } = options;

  const dialog = createMaterialDialog(app, {
    type: MATERIAL_DIALOG_TYPES.FORM,
    title,
    ...options
  });

  // Form container
  const formContainer = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[4],
    direction: 'vertical'
  });
  dialog.addContent(formContainer);

  // Field data storage
  const formData = {};

  // Add fields (simplified for now - can be expanded)
  fields.forEach(field => {
    const fieldContainer = createMaterialContainer({
      padding: 0,
      gap: MATERIAL_SPACING[2],
      direction: 'vertical'
    });

    // Label
    const label = createMaterialText(field.label, 'label');
    fieldContainer.materialLayout.addChild(label);

    // Store initial value
    formData[field.name] = field.value || '';

    formContainer.materialLayout.addChild(fieldContainer);
  });

  // Add form buttons
  if (onCancel) {
    dialog.addButton(cancelText, {
      variant: 'text',
      onClick: onCancel,
    });
  }

  dialog.addButton(submitText, {
    variant: 'filled',
    onClick: () => onSubmit?.(formData),
  });

  return dialog;
}
