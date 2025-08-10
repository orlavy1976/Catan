// docs/src/utils/materialUI.js
// 🛠️ Material Design UI Utilities
// Helper functions for creating Material Design components and effects

import { 
  MATERIAL_COLORS, 
  MATERIAL_TYPOGRAPHY, 
  MATERIAL_SPACING,
  MATERIAL_SHADOWS,
  MATERIAL_MOTION,
  createElevation,
  getStateColor,
  withOpacity
} from "../config/materialDesign.js";

// ==================== GRAPHICS HELPERS ====================

/**
 * Draw a Material Design card/surface
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {number} width - Card width
 * @param {number} height - Card height
 * @param {object} options - Style options
 */
export function drawMaterialCard(graphics, width, height, options = {}) {
  const {
    elevation = 1,
    backgroundColor = MATERIAL_COLORS.surface.secondary,
    borderRadius = 12,
    borderColor = null,
    borderWidth = 0,
  } = options;

  graphics.clear();
  
  // Draw shadow first (if elevation > 0)
  if (elevation > 0) {
    const shadow = MATERIAL_SHADOWS[`elevation${Math.min(elevation, 5)}`];
    if (shadow) {
      graphics.beginFill(shadow.color, shadow.alpha);
      graphics.drawRoundedRect(
        shadow.distance, 
        shadow.distance, 
        width, 
        height, 
        borderRadius
      );
      graphics.endFill();
    }
  }
  
  // Draw background
  graphics.beginFill(backgroundColor, 1);
  graphics.drawRoundedRect(0, 0, width, height, borderRadius);
  graphics.endFill();
  
  // Draw border if specified
  if (borderColor && borderWidth > 0) {
    graphics.lineStyle({
      width: borderWidth,
      color: borderColor,
      alpha: 1,
    });
    graphics.drawRoundedRect(0, 0, width, height, borderRadius);
  }
}

/**
 * Draw a Material Design chip
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {number} width - Chip width
 * @param {number} height - Chip height
 * @param {object} options - Style options
 */
export function drawMaterialChip(graphics, width, height, options = {}) {
  const {
    backgroundColor = MATERIAL_COLORS.surface.tertiary,
    borderColor = MATERIAL_COLORS.neutral[400],
    selected = false,
    variant = 'outlined', // filled, outlined
  } = options;

  graphics.clear();
  
  const borderRadius = height / 2; // Fully rounded
  
  if (variant === 'filled' || selected) {
    // Filled background
    const bgColor = selected ? MATERIAL_COLORS.primary[500] : backgroundColor;
    graphics.beginFill(bgColor, 1);
    graphics.drawRoundedRect(0, 0, width, height, borderRadius);
    graphics.endFill();
  } else {
    // Outlined only
    graphics.lineStyle({
      width: 1,
      color: borderColor,
      alpha: 1,
    });
    graphics.drawRoundedRect(0, 0, width, height, borderRadius);
  }
}

/**
 * Draw a Material Design progress bar
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {number} width - Progress bar width
 * @param {number} height - Progress bar height
 * @param {number} progress - Progress value (0-1)
 * @param {object} options - Style options
 */
export function drawMaterialProgressBar(graphics, width, height, progress, options = {}) {
  const {
    backgroundColor = MATERIAL_COLORS.neutral[700],
    progressColor = MATERIAL_COLORS.primary[500],
    borderRadius = height / 2,
  } = options;

  graphics.clear();
  
  // Background track
  graphics.beginFill(backgroundColor, 1);
  graphics.drawRoundedRect(0, 0, width, height, borderRadius);
  graphics.endFill();
  
  // Progress fill
  const progressWidth = width * Math.max(0, Math.min(1, progress));
  if (progressWidth > 0) {
    graphics.beginFill(progressColor, 1);
    graphics.drawRoundedRect(0, 0, progressWidth, height, borderRadius);
    graphics.endFill();
  }
}

/**
 * Draw a Material Design divider
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {number} width - Divider width
 * @param {boolean} vertical - Whether the divider is vertical
 */
export function drawMaterialDivider(graphics, width, vertical = false, options = {}) {
  const {
    color = MATERIAL_COLORS.neutral[700],
    thickness = 1,
  } = options;

  graphics.clear();
  graphics.lineStyle({
    width: thickness,
    color: color,
    alpha: 1,
  });
  
  if (vertical) {
    graphics.moveTo(0, 0);
    graphics.lineTo(0, width);
  } else {
    graphics.moveTo(0, 0);
    graphics.lineTo(width, 0);
  }
}

// ==================== TEXT HELPERS ====================

/**
 * Create Material Design styled text
 * @param {string} text - Text content
 * @param {string} variant - Typography variant
 * @param {object} overrides - Style overrides
 * @returns {PIXI.Text} Styled text object
 */
export function createMaterialText(text, variant = 'bodyMedium', overrides = {}) {
  const baseStyle = MATERIAL_TYPOGRAPHY.styles[variant] || MATERIAL_TYPOGRAPHY.styles.bodyMedium;
  const style = { ...baseStyle, ...overrides };
  return new PIXI.Text(text, style);
}

/**
 * Create a Material Design headline
 */
export function createMaterialHeadline(text, size = 'medium') {
  const variants = {
    small: 'sectionHeader',
    medium: 'gameTitle',
    large: 'gameTitle',
  };
  return createMaterialText(text, variants[size]);
}

/**
 * Create a Material Design label
 */
export function createMaterialLabel(text, options = {}) {
  return createMaterialText(text, 'label', options);
}

/**
 * Create a Material Design body text
 */
export function createMaterialBody(text, size = 'medium') {
  const variant = size === 'large' ? 'bodyLarge' : 'bodyMedium';
  return createMaterialText(text, variant);
}

// ==================== LAYOUT HELPERS ====================

/**
 * Create a Material Design container with proper spacing
 * @param {object} options - Container options
 * @returns {PIXI.Container} Container with Material spacing
 */
export function createMaterialContainer(options = {}) {
  const {
    padding = MATERIAL_SPACING[4],
    gap = MATERIAL_SPACING[3],
    direction = 'vertical', // vertical, horizontal
  } = options;
  
  const container = new PIXI.Container();
  
  // Add helper methods for Material layout
  container.materialLayout = {
    padding,
    gap,
    direction,
    
    // Add child with automatic spacing
    addChild(child, index = -1) {
      if (!child || !container) return;
      
      try {
        if (index >= 0) {
          container.addChildAt(child, index);
        } else {
          container.addChild(child);
        }
        this.updateLayout();
      } catch (error) {
        console.warn('Error adding child to material container:', error);
      }
    },
    
    // Update layout based on direction and spacing
    updateLayout() {
      if (!container || !container.children) return;
      
      const children = container.children;
      if (children.length === 0) return;
      
      let currentPos = padding;
      
      children.forEach((child, index) => {
        if (!child) return;
        
        try {
          if (direction === 'vertical') {
            child.x = padding;
            child.y = currentPos;
            currentPos += (child.height || 0) + (index < children.length - 1 ? gap : 0);
          } else {
            child.x = currentPos;
            child.y = padding;
            currentPos += (child.width || 0) + (index < children.length - 1 ? gap : 0);
          }
        } catch (error) {
          console.warn('Error updating child layout:', error);
        }
      });
    },
    
    // Get total size needed
    getTotalSize() {
      const children = container.children;
      if (children.length === 0) return { width: padding * 2, height: padding * 2 };
      
      if (direction === 'vertical') {
        const totalHeight = children.reduce((sum, child, index) => 
          sum + (child.height || 0) + (index < children.length - 1 ? gap : 0), 0);
        const maxWidth = Math.max(...children.map(child => child.width || 0));
        return { 
          width: maxWidth + padding * 2, 
          height: totalHeight + padding * 2 
        };
      } else {
        const totalWidth = children.reduce((sum, child, index) => 
          sum + (child.width || 0) + (index < children.length - 1 ? gap : 0), 0);
        const maxHeight = Math.max(...children.map(child => child.height || 0));
        return { 
          width: totalWidth + padding * 2, 
          height: maxHeight + padding * 2 
        };
      }
    },
  };
  
  return container;
}

// ==================== ANIMATION HELPERS ====================

/**
 * Create a smooth scale animation
 * @param {PIXI.DisplayObject} target - Object to animate
 * @param {number} targetScale - Target scale value
 * @param {number} duration - Animation duration in ms
 * @param {string} easing - Easing function name
 * @returns {Promise} Promise that resolves when animation completes
 */
export function animateScale(target, targetScale, duration = MATERIAL_MOTION.duration.normal, easing = 'standard') {
  return new Promise((resolve) => {
    if (!target || !target.scale) {
      console.warn('animateScale: target or target.scale is undefined');
      resolve();
      return;
    }
    
    const startScale = target.scale.x;
    const startTime = Date.now();
    let animationId = null;
    
    function animate() {
      // Safety check during animation
      if (!target || !target.scale) {
        if (animationId) cancelAnimationFrame(animationId);
        resolve();
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing
      let eased = progress;
      if (easing === 'decelerate') {
        eased = 1 - Math.pow(1 - progress, 2);
      } else if (easing === 'accelerate') {
        eased = Math.pow(progress, 2);
      } else if (easing === 'emphasized') {
        eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      }
      
      const currentScale = startScale + (targetScale - startScale) * eased;
      target.scale.set(currentScale);
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        animationId = null;
        resolve();
      }
    }
    
    animate();
  });
}

/**
 * Create a fade animation
 * @param {PIXI.DisplayObject} target - Object to animate
 * @param {number} targetAlpha - Target alpha value
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Promise that resolves when animation completes
 */
export function animateFade(target, targetAlpha, duration = MATERIAL_MOTION.duration.normal) {
  return new Promise((resolve) => {
    if (!target || target.alpha === undefined) {
      console.warn('animateFade: target or target.alpha is undefined');
      resolve();
      return;
    }
    
    const startAlpha = target.alpha;
    const startTime = Date.now();
    let animationId = null;
    
    function animate() {
      // Safety check during animation
      if (!target || target.alpha === undefined) {
        if (animationId) cancelAnimationFrame(animationId);
        resolve();
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 2);
      target.alpha = startAlpha + (targetAlpha - startAlpha) * eased;
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        animationId = null;
        resolve();
      }
    }
    
    animate();
  });
}

/**
 * Create a slide animation
 * @param {PIXI.DisplayObject} target - Object to animate
 * @param {object} targetPosition - Target position {x, y}
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Promise that resolves when animation completes
 */
export function animateSlide(target, targetPosition, duration = MATERIAL_MOTION.duration.normal) {
  return new Promise((resolve) => {
    const startX = target.x;
    const startY = target.y;
    const startTime = Date.now();
    let animationId = null;
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Emphasized easing for slide
      const eased = progress < 0.5 ? 
        2 * progress * progress : 
        1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      target.x = startX + (targetPosition.x - startX) * eased;
      target.y = startY + (targetPosition.y - startY) * eased;
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        animationId = null;
        resolve();
      }
    }
    
    animate();
  });
}

// ==================== COLOR HELPERS ====================

/**
 * Get Material color with semantic meaning
 */
export function getMaterialColor(colorType, shade = 500) {
  const colorMap = {
    primary: MATERIAL_COLORS.primary[shade],
    secondary: MATERIAL_COLORS.secondary[shade],
    tertiary: MATERIAL_COLORS.tertiary[shade],
    surface: MATERIAL_COLORS.surface.secondary,
    error: MATERIAL_COLORS.semantic.error,
    warning: MATERIAL_COLORS.semantic.warning,
    success: MATERIAL_COLORS.semantic.success,
    info: MATERIAL_COLORS.semantic.info,
  };
  
  return colorMap[colorType] || MATERIAL_COLORS.neutral[shade];
}

/**
 * Get player color with Material palette
 */
export function getMaterialPlayerColor(playerIndex) {
  const colors = [
    MATERIAL_COLORS.player.red,
    MATERIAL_COLORS.player.blue,
    MATERIAL_COLORS.player.orange,
    MATERIAL_COLORS.player.green,
  ];
  return colors[playerIndex] || MATERIAL_COLORS.neutral[500];
}

/**
 * Get resource color with Material palette
 */
export function getMaterialResourceColor(resourceType) {
  return MATERIAL_COLORS.resource[resourceType] || MATERIAL_COLORS.neutral[500];
}
