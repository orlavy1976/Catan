// docs/src/utils/ui.js
// 🛠️ UI Utility Functions
// Helper functions for common UI tasks using the design system

import { 
  COLORS, 
  ALPHA, 
  TYPOGRAPHY, 
  DIMENSIONS, 
  EFFECTS, 
  UI_STYLES,
  getResourceColor,
  getPlayerColor 
} from "../config/design.js";

// ==================== GRAPHICS HELPERS ====================

/**
 * Draw a styled panel background
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {number} width - Panel width
 * @param {number} height - Panel height
 * @param {object} style - Style options (color, alpha, borderRadius, border)
 */
export function drawPanel(graphics, width, height, style = UI_STYLES.panelBackground()) {
  graphics.clear();
  
  // Background
  graphics.beginFill(style.color, style.alpha);
  graphics.drawRoundedRect(0, 0, width, height, style.borderRadius);
  graphics.endFill();
  
  // Border
  if (style.border) {
    graphics.lineStyle(style.border);
    graphics.drawRoundedRect(0, 0, width, height, style.borderRadius);
  }
}

/**
 * Draw a styled button background
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {number} width - Button width
 * @param {number} height - Button height
 * @param {boolean} isPrimary - Whether to use primary or secondary style
 */
export function drawButton(graphics, width, height, isPrimary = true) {
  const style = isPrimary ? UI_STYLES.primaryButton : UI_STYLES.secondaryButton;
  
  graphics.clear();
  graphics.beginFill(style.background.color, style.background.alpha);
  graphics.drawRoundedRect(0, 0, width, height, style.borderRadius);
  graphics.endFill();
  
  if (style.border) {
    graphics.lineStyle(style.border);
    graphics.drawRoundedRect(0, 0, width, height, style.borderRadius);
  }
}

/**
 * Draw a resource chip background
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {number} width - Chip width
 * @param {number} height - Chip height
 */
export function drawResourceChip(graphics, width, height) {
  const style = UI_STYLES.resourceChip;
  
  graphics.clear();
  graphics.beginFill(style.background.color, style.background.alpha);
  graphics.drawRoundedRect(0, 0, width, height, style.borderRadius);
  graphics.endFill();
  
  graphics.lineStyle(style.border);
  graphics.drawRoundedRect(0, 0, width, height, style.borderRadius);
}

/**
 * Draw a modal overlay
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {number} screenWidth - Screen width
 * @param {number} screenHeight - Screen height
 */
export function drawModalOverlay(graphics, screenWidth, screenHeight) {
  graphics.clear();
  graphics.beginFill(COLORS.background.overlay, ALPHA.overlay);
  graphics.drawRect(0, 0, screenWidth, screenHeight);
  graphics.endFill();
}

// ==================== TEXT HELPERS ====================

/**
 * Create a styled text object
 * @param {string} text - Text content
 * @param {string} styleType - Style type from TYPOGRAPHY.styles
 * @param {object} overrides - Style overrides
 * @returns {PIXI.Text} Styled text object
 */
export function createStyledText(text, styleType = 'body', overrides = {}) {
  const baseStyle = TYPOGRAPHY.styles[styleType] || TYPOGRAPHY.styles.body;
  const style = { ...baseStyle, ...overrides };
  return new PIXI.Text(text, style);
}

/**
 * Create a title text
 * @param {string} text - Title text
 * @returns {PIXI.Text} Title text object
 */
export function createTitle(text) {
  return createStyledText(text, 'title');
}

/**
 * Create a subtitle text
 * @param {string} text - Subtitle text
 * @returns {PIXI.Text} Subtitle text object
 */
export function createSubtitle(text) {
  return createStyledText(text, 'subtitle');
}

/**
 * Create body text
 * @param {string} text - Body text
 * @returns {PIXI.Text} Body text object
 */
export function createBodyText(text) {
  return createStyledText(text, 'body');
}

/**
 * Create success message text
 * @param {string} text - Success message
 * @returns {PIXI.Text} Success text object
 */
export function createSuccessText(text) {
  return createStyledText(text, 'success');
}

// ==================== COLOR HELPERS ====================

/**
 * Get color with alpha
 * @param {number} color - Hex color
 * @param {number} alpha - Alpha value (0-1)
 * @returns {object} Color object with alpha
 */
export function colorWithAlpha(color, alpha) {
  return { color, alpha };
}

/**
 * Get hover color (slightly lighter)
 * @param {number} baseColor - Base hex color
 * @returns {number} Hover color
 */
export function getHoverColor(baseColor) {
  const r = Math.min(255, ((baseColor >> 16) & 255) + 20);
  const g = Math.min(255, ((baseColor >> 8) & 255) + 20);
  const b = Math.min(255, (baseColor & 255) + 20);
  return (r << 16) | (g << 8) | b;
}

// ==================== LAYOUT HELPERS ====================

/**
 * Center a container within another container
 * @param {PIXI.Container} child - Child container to center
 * @param {PIXI.Container} parent - Parent container
 */
export function centerContainer(child, parent) {
  child.x = (parent.width - child.width) / 2;
  child.y = (parent.height - child.height) / 2;
}

/**
 * Position elements in a vertical stack
 * @param {Array} elements - Array of objects with container property
 * @param {number} startY - Starting Y position
 * @param {number} gap - Gap between elements
 * @returns {number} Final Y position
 */
export function stackVertically(elements, startY = 0, gap = DIMENSIONS.spacing.base) {
  let currentY = startY;
  
  elements.forEach(element => {
    if (element.container) {
      element.container.y = currentY;
      currentY += element.container.height + gap;
    }
  });
  
  return currentY - gap; // Return final position without last gap
}

/**
 * Position elements in a horizontal row
 * @param {Array} elements - Array of objects with container property
 * @param {number} startX - Starting X position
 * @param {number} gap - Gap between elements
 * @returns {number} Final X position
 */
export function arrangeHorizontally(elements, startX = 0, gap = DIMENSIONS.spacing.base) {
  let currentX = startX;
  
  elements.forEach(element => {
    if (element.container) {
      element.container.x = currentX;
      currentX += element.container.width + gap;
    }
  });
  
  return currentX - gap; // Return final position without last gap
}

// ==================== ANIMATION HELPERS ====================

/**
 * Create a simple fade in animation
 * @param {PIXI.Container} container - Container to animate
 * @param {number} duration - Animation duration in ms
 * @param {function} onComplete - Callback when animation completes
 */
export function fadeIn(container, duration = EFFECTS.animation.normal, onComplete = null) {
  container.alpha = 0;
  
  const startTime = Date.now();
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    container.alpha = progress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };
  
  requestAnimationFrame(animate);
}

/**
 * Create a simple scale animation
 * @param {PIXI.Container} container - Container to animate
 * @param {number} targetScale - Target scale value
 * @param {number} duration - Animation duration in ms
 */
export function scaleTo(container, targetScale = 1.1, duration = EFFECTS.animation.fast) {
  const startScale = container.scale.x;
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const currentScale = startScale + (targetScale - startScale) * progress;
    container.scale.set(currentScale);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
}

// ==================== RESPONSIVE HELPERS ====================

/**
 * Check if screen is mobile size
 * @param {number} width - Screen width
 * @returns {boolean} True if mobile
 */
export function isMobile(width) {
  return width <= 768;
}

/**
 * Check if screen is tablet size
 * @param {number} width - Screen width
 * @returns {boolean} True if tablet
 */
export function isTablet(width) {
  return width > 768 && width <= 1024;
}

/**
 * Get responsive value based on screen size
 * @param {number} screenWidth - Screen width
 * @param {number} mobileValue - Value for mobile
 * @param {number} tabletValue - Value for tablet
 * @param {number} desktopValue - Value for desktop
 * @returns {number} Responsive value
 */
export function getResponsiveValue(screenWidth, mobileValue, tabletValue, desktopValue) {
  if (isMobile(screenWidth)) return mobileValue;
  if (isTablet(screenWidth)) return tabletValue;
  return desktopValue;
}
