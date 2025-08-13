// docs/src/utils/materialPanel.js
// 🎨 Generic Material Design Panel System

import { 
  MATERIAL_COLORS,
  MATERIAL_SPACING,
  MATERIAL_SHADOWS,
  Z_INDEX
} from "../config/materialDesign.js";
import { 
  createMaterialText,
  drawMaterialCard,
  animateFade
} from "./materialUI.js";

/**
 * Creates a Material Design panel with consistent styling and behavior
 * @param {PIXI.Application} app - The PixiJS application
 * @param {Object} options - Panel configuration
 * @param {string} options.title - Panel title text
 * @param {string} options.position - Panel position: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
 * @param {number} options.minWidth - Minimum panel width (default: 200)
 * @param {number} options.minHeight - Minimum panel height (default: 80)
 * @param {boolean} options.responsive - Whether panel should be responsive (default: true)
 * @param {number} options.zIndex - Panel z-index (default: Z_INDEX.panels)
 * @param {string} options.variant - Panel variant: 'elevated', 'outlined', 'filled' (default: 'elevated')
 * @param {boolean} options.autoLayout - Whether to auto-layout on window resize (default: true)
 */
export function createMaterialPanel(app, options = {}) {
  const {
    title = "Panel",
    position = 'bottom-left',
    minWidth = 200,
    minHeight = 80,
    maxHeight = null, // חדש: גובה מקסימלי אופציונלי
    responsive = true,
    zIndex = Z_INDEX.panels,
    variant = 'elevated',
    autoLayout = true
  } = options;

  const panel = new PIXI.Container();
  panel.zIndex = zIndex;

  // Background graphics
  const bg = new PIXI.Graphics();
  panel.addChild(bg);

  // Title text
  const titleText = createMaterialText(title, 'headlineSmall');
  titleText.style.fill = MATERIAL_COLORS.neutral[100];
  panel.addChild(titleText);

  // Content container for dynamic content (with scroll support)
  const contentMask = new PIXI.Graphics();
  panel.addChild(contentMask);
  const contentContainer = new PIXI.Container();
  contentContainer.mask = contentMask;
  panel.addChild(contentContainer);

  // Shadow container for elevation effects
  const shadowContainer = new PIXI.Container();
  shadowContainer.zIndex = zIndex - 1;

  // State management
  let currentWidth = minWidth;
  let currentHeight = minHeight;
  let contentHeight = 0;
  let isVisible = true;
  let scrollY = 0;
  
  /**
   * Updates panel layout and positioning
   */
  function layout() {
    const screenWidth = app.renderer.width;
    const screenHeight = app.renderer.height;
    
    // Responsive scaling
    const scaleFactor = responsive ? Math.min(1, screenWidth / 1200) : 1;
    const responsiveSpacing = Math.max(MATERIAL_SPACING[2], MATERIAL_SPACING[4] * scaleFactor);
    
    // Calculate dimensions
    const titleHeight = (titleText.height || 24) * scaleFactor;
    const topPadding = MATERIAL_SPACING[4] * scaleFactor;
    const bottomPadding = MATERIAL_SPACING[4] * scaleFactor;
    const gapAfterTitle = MATERIAL_SPACING[3] * scaleFactor;
    
    // Calculate total content height
    const totalContentHeight = titleHeight + gapAfterTitle + contentHeight;
  // הגבלת גובה מקסימלי לפאנל (90% מהמסך או maxHeight מהאופציות)
  const maxPanelHeight = maxHeight ? Math.min(maxHeight, screenHeight * 0.95) : Math.max(minHeight, screenHeight * 0.9);
  const totalHeight = topPadding + Math.min(totalContentHeight, maxPanelHeight - topPadding - bottomPadding) + bottomPadding;

  currentWidth = Math.max(minWidth * scaleFactor, minWidth);
  currentHeight = Math.max(totalHeight, minHeight * scaleFactor);

    // Draw background based on variant
    drawPanelBackground();

    // Position title
    titleText.x = MATERIAL_SPACING[4] * scaleFactor;
    titleText.y = MATERIAL_SPACING[4] * scaleFactor;
    titleText.scale.set(scaleFactor);

    // Mask for scrollable content
    contentMask.clear();
    contentMask.beginFill(0xffffff, 1);
    contentMask.drawRoundedRect(
      MATERIAL_SPACING[4] * scaleFactor,
      titleText.y + titleHeight + gapAfterTitle,
      currentWidth - MATERIAL_SPACING[4] * 2 * scaleFactor,
      currentHeight - (titleText.y + titleHeight + gapAfterTitle) - bottomPadding
    );
    contentMask.endFill();

    // Position content container
    contentContainer.x = MATERIAL_SPACING[4] * scaleFactor;
    contentContainer.y = titleText.y + titleHeight + gapAfterTitle - scrollY;

    // Position panel based on position setting
    positionPanel(screenWidth, screenHeight, responsiveSpacing);

    // גלילה פנימית אם צריך
    if (contentHeight > (currentHeight - (titleText.y + titleHeight + gapAfterTitle) - bottomPadding)) {
      // Listen for wheel events (פעם אחת בלבד)
      if (!panel._hasScrollListener) {
        panel._hasScrollListener = true;
        app.view.addEventListener('wheel', (e) => {
          // רק אם העכבר מעל הפאנל
          const rect = app.view.getBoundingClientRect();
          const px = e.clientX - rect.left - panel.x;
          const py = e.clientY - rect.top - panel.y;
          if (px >= 0 && px <= currentWidth && py >= 0 && py <= currentHeight) {
            const maxScroll = contentHeight - (currentHeight - (titleText.y + titleHeight + gapAfterTitle) - bottomPadding);
            scrollY = Math.max(0, Math.min(scrollY + e.deltaY, maxScroll));
            contentContainer.y = titleText.y + titleHeight + gapAfterTitle - scrollY;
          }
        });
      }
    } else {
      scrollY = 0;
      contentContainer.y = titleText.y + titleHeight + gapAfterTitle;
    }

    console.log(`📱 Material Panel "${title}" - Size: ${currentWidth.toFixed(0)}x${currentHeight.toFixed(0)}, Position: ${panel.x.toFixed(0)},${panel.y.toFixed(0)}`);
  }
  
  /**
   * Draws the panel background based on variant
   */
  function drawPanelBackground() {
    bg.clear();
    
    const borderRadius = 12;
    
    switch (variant) {
      case 'elevated':
        // Elevated surface with shadow
        drawMaterialCard(bg, currentWidth, currentHeight, {
          backgroundColor: MATERIAL_COLORS.surface.primary,
          borderRadius: borderRadius,
          elevation: 2
        });
        break;
        
      case 'outlined':
        // Outlined surface
        bg.beginFill(MATERIAL_COLORS.surface.primary, 1);
        bg.drawRoundedRect(0, 0, currentWidth, currentHeight, borderRadius);
        bg.endFill();
        bg.lineStyle({ width: 1, color: MATERIAL_COLORS.outline.primary, alpha: 0.5 });
        bg.drawRoundedRect(0, 0, currentWidth, currentHeight, borderRadius);
        break;
        
      case 'filled':
        // Filled surface
        bg.beginFill(MATERIAL_COLORS.surface.variant, 1);
        bg.drawRoundedRect(0, 0, currentWidth, currentHeight, borderRadius);
        bg.endFill();
        break;
        
      default:
        // Default to elevated
        drawMaterialCard(bg, currentWidth, currentHeight, {
          backgroundColor: MATERIAL_COLORS.surface.primary,
          borderRadius: borderRadius,
          elevation: 1
        });
    }
  }
  
  /**
   * Positions the panel based on position setting
   */
  function positionPanel(screenWidth, screenHeight, spacing) {
    switch (position) {
      case 'top-left':
        panel.x = spacing;
        panel.y = spacing;
        break;
        
      case 'top-right':
        panel.x = screenWidth - currentWidth - spacing;
        panel.y = spacing;
        break;
        
      case 'bottom-left':
        panel.x = spacing;
        panel.y = screenHeight - currentHeight - spacing;
        break;
        
      case 'bottom-right':
        panel.x = screenWidth - currentWidth - spacing;
        panel.y = screenHeight - currentHeight - spacing;
        break;
        
      default:
        // Default to bottom-left
        panel.x = spacing;
        panel.y = screenHeight - currentHeight - spacing;
    }
    
    // Ensure panel stays on screen
    panel.x = Math.max(0, Math.min(panel.x, screenWidth - currentWidth));
    panel.y = Math.max(0, Math.min(panel.y, screenHeight - currentHeight));
  }
  
  /**
   * Sets the content of the panel
   * @param {PIXI.Container[]} items - Array of PIXI display objects to add as content
   * @param {number} spacing - Spacing between items (default: MATERIAL_SPACING[2])
   */
  function setContent(items, spacing = MATERIAL_SPACING[2]) {
    contentContainer.removeChildren();
    
    let currentY = 0;
    items.forEach((item, index) => {
      if (item && item.addChild) {
        item.y = currentY;
        contentContainer.addChild(item);
        // Use consistent row height for Material Design
        const itemHeight = item.height || MATERIAL_SPACING[9]; // Default to 36px Material row height
        currentY += itemHeight + (index < items.length - 1 ? spacing : 0);
      }
    });
    
    contentHeight = currentY;
    layout();
  }
  
  /**
   * Adds content to the panel
   * @param {PIXI.DisplayObject} item - Display object to add
   * @param {number} index - Optional index to insert at
   */
  function addContent(item, index = -1) {
    if (index >= 0) {
      contentContainer.addChildAt(item, index);
    } else {
      contentContainer.addChild(item);
    }
    
    // Reposition all items with proper spacing
    repositionContent();
  }
  
  /**
   * Removes content from the panel
   * @param {PIXI.DisplayObject} item - Display object to remove
   */
  function removeContent(item) {
    contentContainer.removeChild(item);
    
    // Reposition all items with proper spacing
    repositionContent();
  }
  
  /**
   * Repositions all content items with proper spacing
   */
  function repositionContent() {
    let currentY = 0;
    const spacing = MATERIAL_SPACING[2]; // 8px spacing between rows
    
    contentContainer.children.forEach((child, index) => {
      child.y = currentY;
      // Use a consistent row height for Material Design
      const itemHeight = child.height || MATERIAL_SPACING[9]; // Default to 36px Material row height
      currentY += itemHeight + (index < contentContainer.children.length - 1 ? spacing : 0);
    });
    
    contentHeight = currentY;
    layout();
  }
  
  /**
   * Clears all content from the panel
   */
  function clearContent() {
    contentContainer.removeChildren();
    contentHeight = 0;
    layout();
  }
  
  /**
   * Shows the panel with animation
   * @param {number} duration - Animation duration in ms (default: 300)
   */
  function show(duration = 300) {
    if (isVisible) return;
    
    isVisible = true;
    panel.alpha = 0;
    panel.visible = true;
    
    animateFade(panel, 1, duration);
  }
  
  /**
   * Hides the panel with animation
   * @param {number} duration - Animation duration in ms (default: 300)
   */
  function hide(duration = 300) {
    if (!isVisible) return;
    
    isVisible = false;
    
    animateFade(panel, 0, duration).then(() => {
      panel.visible = false;
    });
  }
  
  /**
   * Sets the panel visibility without animation
   * @param {boolean} visible - Whether panel should be visible
   */
  function setVisible(visible) {
    isVisible = visible;
    panel.visible = visible;
    panel.alpha = visible ? 1 : 0;
  }
  
  /**
   * Updates the panel title
   * @param {string} newTitle - New title text
   */
  function setTitle(newTitle) {
    titleText.text = newTitle;
    layout();
  }
  
  /**
   * Forces a layout update
   */
  function forceLayout() {
    layout();
  }
  
  // Setup auto-layout on window resize
  if (autoLayout) {
    window.addEventListener("resize", layout);
  }
  
  // Initial layout
  layout();
  
  // Add to stage
  app.stage.addChild(panel);
  app.stage.sortableChildren = true;
  
  return {
    container: panel,
    contentContainer,
    setContent,
    addContent,
    removeContent,
    clearContent,
    show,
    hide,
    setVisible,
    setTitle,
    layout: forceLayout,
    
    // Getters for current state
    get width() { return currentWidth; },
    get height() { return currentHeight; },
    get visible() { return isVisible; }
  };
}

/**
 * Creates a Material Design row component for use in panels
 * @param {Object} options - Row configuration
 * @param {string} options.text - Primary text
 * @param {string} options.secondaryText - Secondary text (optional)
 * @param {number} options.color - Color for badge/indicator (optional)
 * @param {PIXI.DisplayObject[]} options.actions - Action items to display on the right (optional)
 * @param {number} options.height - Row height (default: MATERIAL_SPACING[9] = 36px)
 * @param {boolean} options.showBadge - Whether to show color badge (default: false)
 */
export function createMaterialRow(options = {}) {
  const {
    text = "",
    secondaryText = "",
    color = null,
    actions = [],
    height = MATERIAL_SPACING[9], // 36px Material Design row height
    showBadge = false
  } = options;
  
  const row = new PIXI.Container();
  
  // Row background for interaction states
  const background = new PIXI.Graphics();
  background.beginFill(MATERIAL_COLORS.primary[500], 0.08);
  background.drawRoundedRect(0, 0, 300, height, 8); // Will be resized
  background.endFill();
  background.alpha = 0;
  row.addChild(background);
  
  let currentX = MATERIAL_SPACING[2]; // Start with small padding
  
  // Color badge
  let badge = null;
  if (showBadge && color !== null) {
    badge = new PIXI.Graphics();
    badge.beginFill(color, 1);
    badge.drawCircle(0, 0, 8);
    badge.endFill();
    badge.x = currentX + 8;
    badge.y = height / 2;
    row.addChild(badge);
    currentX += 24; // Badge width + spacing
  }
  
  // Primary text
  const primaryText = createMaterialText(text, 'bodyMedium');
  primaryText.style.fill = MATERIAL_COLORS.neutral[100];
  primaryText.x = currentX;
  primaryText.y = secondaryText ? MATERIAL_SPACING[1] : (height - primaryText.height) / 2;
  row.addChild(primaryText);
  
  // Secondary text
  let secondaryTextObj = null;
  if (secondaryText) {
    secondaryTextObj = createMaterialText(secondaryText, 'bodySmall');
    secondaryTextObj.style.fill = MATERIAL_COLORS.neutral[200];
    secondaryTextObj.x = currentX;
    secondaryTextObj.y = primaryText.y + primaryText.height + 2;
    row.addChild(secondaryTextObj);
  }
  
  // Actions container
  const actionsContainer = new PIXI.Container();
  row.addChild(actionsContainer);
  
  /**
   * Sets the row as active/inactive
   * @param {boolean} active - Whether row is active
   */
  function setActive(active) {
    background.alpha = active ? 1 : 0;
  }
  
  /**
   * Updates the primary text
   * @param {string} newText - New primary text
   */
  function setText(newText) {
    primaryText.text = newText;
  }
  
  /**
   * Updates the secondary text
   * @param {string} newText - New secondary text
   */
  function setSecondaryText(newText) {
    if (secondaryTextObj) {
      secondaryTextObj.text = newText;
    }
  }
  
  /**
   * Updates the badge color
   * @param {number} newColor - New badge color
   */
  function setBadgeColor(newColor) {
    if (badge) {
      badge.clear();
      badge.beginFill(newColor, 1);
      badge.drawCircle(0, 0, 8);
      badge.endFill();
    }
  }
  
  /**
   * Resizes the row to fit content
   * @param {number} width - New row width
   */
  function resize(width) {
    background.clear();
    background.beginFill(MATERIAL_COLORS.primary[500], 0.5);
    background.drawRoundedRect(0, 0, width, height + 10, 8);
    background.endFill();
    
    // Position actions on the right
    actionsContainer.x = width - MATERIAL_SPACING[2];
    actions.forEach((action, index) => {
      action.x = -(actions.length - index) * (action.width + MATERIAL_SPACING[1]);
    });
  }
  
  return {
    container: row,
    setActive,
    setText,
    setSecondaryText,
    setBadgeColor,
    resize,
    height,
    
    // Ensure proper height detection
    get actualHeight() {
      return Math.max(height, row.height || height);
    }
  };
}
