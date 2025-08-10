// docs/src/catan/ui/materialButton.js
// 🎨 Material Design Button Component
// Modern, Material Design 3 inspired button with HD graphics and smooth animations

import { 
  MATERIAL_COLORS, 
  MATERIAL_TYPOGRAPHY, 
  MATERIAL_BUTTONS,
  MATERIAL_MOTION,
  MATERIAL_SPACING,
  createElevation,
  getStateColor,
  withOpacity
} from "../../config/materialDesign.js";

/**
 * Create a Material Design button
 * @param {string} label - Button text
 * @param {object} options - Button configuration
 * @returns {object} Button API
 */
export function createMaterialButton(label, options = {}) {
  const {
    variant = 'filled',        // filled, outlined, text, floating
    size = 'medium',           // small, medium, large
    width = 'auto',            // auto, number, or 'full'
    icon = null,              // Icon sprite/texture
    iconPosition = 'left',     // left, right, top, bottom
    disabled = false,
    fullWidth = false,
  } = options;

  // Get button configuration
  const buttonConfig = MATERIAL_BUTTONS[variant];
  const sizeConfig = MATERIAL_BUTTONS.sizes[size];
  
  // Calculate dimensions
  const height = sizeConfig.height;
  const paddingX = sizeConfig.paddingX;
  const paddingY = sizeConfig.paddingY || (height - sizeConfig.fontSize) / 2;
  
  // Create container
  const container = new PIXI.Container();
  container.eventMode = 'static';
  container.cursor = disabled ? 'default' : 'pointer';
  
  // Create background graphics
  const background = new PIXI.Graphics();
  container.addChild(background);
  
  // Create shadow graphics (for elevation)
  const shadow = new PIXI.Graphics();
  container.addChildAt(shadow, 0); // Add behind background
  
  // Create text
  const textStyle = {
    ...MATERIAL_TYPOGRAPHY.styles.buttonMedium,
    fontSize: sizeConfig.fontSize,
    fill: disabled ? buttonConfig.textDisabled : buttonConfig.text,
  };
  const text = new PIXI.Text(label, textStyle);
  text.anchor.set(0.5);
  container.addChild(text);
  
  // Create icon if provided
  let iconSprite = null;
  if (icon) {
    iconSprite = new PIXI.Sprite(icon);
    iconSprite.anchor.set(0.5);
    iconSprite.tint = disabled ? buttonConfig.textDisabled : buttonConfig.text;
    container.addChild(iconSprite);
  }
  
  // State management
  let currentState = disabled ? 'disabled' : 'default';
  let isPressed = false;
  let animationTween = null;
  let clickHandler = null;
  let isEnabled = !disabled;
  
  // Calculate final width
  let finalWidth;
  if (width === 'auto') {
    const textWidth = text.width;
    const iconWidth = iconSprite ? iconSprite.width + MATERIAL_SPACING[2] : 0;
    finalWidth = Math.max(textWidth + iconWidth + (paddingX * 2), sizeConfig.height);
  } else if (width === 'full' || fullWidth) {
    finalWidth = 200; // Will be set by parent
  } else {
    finalWidth = width;
  }
  
  // Layout content
  function layoutContent() {
    const contentWidth = text.width + (iconSprite ? iconSprite.width + MATERIAL_SPACING[2] : 0);
    const startX = (finalWidth - contentWidth) / 2;
    
    if (iconSprite) {
      if (iconPosition === 'left') {
        iconSprite.x = startX + iconSprite.width / 2;
        text.x = iconSprite.x + iconSprite.width / 2 + MATERIAL_SPACING[2] + text.width / 2;
      } else if (iconPosition === 'right') {
        text.x = startX + text.width / 2;
        iconSprite.x = text.x + text.width / 2 + MATERIAL_SPACING[2] + iconSprite.width / 2;
      }
      iconSprite.y = height / 2;
    } else {
      text.x = finalWidth / 2;
    }
    text.y = height / 2;
  }
  
  // Draw shadow (elevation effect)
  function drawShadow() {
    shadow.clear();
    
    if (variant === 'filled' || variant === 'floating') {
      const elevation = currentState === 'hover' ? 
        buttonConfig.elevationHover : 
        buttonConfig.elevation;
      
      if (elevation) {
        // Create multiple shadow layers for depth
        const layers = [
          { blur: elevation.blur * 0.5, distance: elevation.distance * 0.5, alpha: elevation.alpha * 0.3 },
          { blur: elevation.blur, distance: elevation.distance, alpha: elevation.alpha * 0.7 },
          { blur: elevation.blur * 2, distance: elevation.distance * 1.5, alpha: elevation.alpha * 0.2 },
        ];
        
        layers.forEach(layer => {
          shadow.beginFill(0x000000, layer.alpha);
          shadow.drawRoundedRect(
            layer.distance, 
            layer.distance, 
            finalWidth, 
            height, 
            buttonConfig.borderRadius
          );
          shadow.endFill();
        });
      }
    }
  }
  
  // Draw background
  function drawBackground() {
    background.clear();
    
    // Get current background color
    let bgColor = buttonConfig.background;
    if (currentState === 'hover') {
      bgColor = buttonConfig.backgroundHover;
    } else if (currentState === 'pressed') {
      bgColor = buttonConfig.backgroundPressed;
    } else if (currentState === 'disabled') {
      bgColor = buttonConfig.backgroundDisabled;
    }
    
    // Draw background for filled buttons
    if (variant === 'filled' || variant === 'floating') {
      if (bgColor !== 'transparent') {
        background.beginFill(bgColor, 1);
        background.drawRoundedRect(0, 0, finalWidth, height, buttonConfig.borderRadius);
        background.endFill();
      }
    }
    
    // Draw border for outlined buttons
    if (variant === 'outlined') {
      const borderColor = currentState === 'hover' ? 
        buttonConfig.borderHover : 
        buttonConfig.border;
      
      background.lineStyle({
        width: buttonConfig.borderWidth,
        color: borderColor,
        alpha: 1,
      });
      background.drawRoundedRect(0, 0, finalWidth, height, buttonConfig.borderRadius);
      
      // Add hover background
      if (currentState === 'hover' && buttonConfig.backgroundHover !== 'transparent') {
        background.beginFill(buttonConfig.backgroundHover, 0.08);
        background.drawRoundedRect(0, 0, finalWidth, height, buttonConfig.borderRadius);
        background.endFill();
      }
    }
    
    // Add state overlay for text buttons
    if (variant === 'text' && currentState === 'hover') {
      background.beginFill(buttonConfig.backgroundHover, 0.08);
      background.drawRoundedRect(0, 0, finalWidth, height, buttonConfig.borderRadius);
      background.endFill();
    }
  }
  
  // Update text color based on state
  function updateTextColor() {
    let textColor = buttonConfig.text;
    
    if (currentState === 'disabled') {
      textColor = buttonConfig.textDisabled;
    } else if (variant === 'outlined' && currentState === 'hover') {
      textColor = buttonConfig.textHover;
    } else if (variant === 'text') {
      textColor = currentState === 'hover' ? buttonConfig.textHover : buttonConfig.text;
    }
    
    text.style.fill = textColor;
    if (iconSprite) {
      iconSprite.tint = textColor;
    }
  }
  
  // Animate scale with easing
  function animateScale(targetScale, duration = MATERIAL_MOTION.duration.fast) {
    if (!container) return; // Safety check
    
    if (animationTween) {
      cancelAnimationFrame(animationTween);
      animationTween = null;
    }
    
    const startScale = container.scale.x;
    const startTime = Date.now();
    
    function animate() {
      if (!container || !container.scale) return; // Additional safety check
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScale = startScale + (targetScale - startScale) * eased;
      
      container.scale.set(currentScale);
      
      if (progress < 1) {
        animationTween = requestAnimationFrame(animate);
      } else {
        animationTween = null;
      }
    }
    
    animate();
  }
  
  // Create ripple effect
  function createRipple(localPoint) {
    const ripple = new PIXI.Graphics();
    container.addChild(ripple);
    
    const maxRadius = Math.max(finalWidth, height) * 0.6;
    const startTime = Date.now();
    const duration = MATERIAL_MOTION.ripple.duration;
    let rippleAnimation = null;
    
    function animateRipple() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation
      const eased = 1 - Math.pow(1 - progress, 2);
      const currentRadius = maxRadius * eased;
      const alpha = MATERIAL_MOTION.ripple.alpha * (1 - progress);
      
      ripple.clear();
      ripple.beginFill(MATERIAL_MOTION.ripple.color, alpha);
      ripple.drawCircle(localPoint.x, localPoint.y, currentRadius);
      ripple.endFill();
      
      if (progress < 1) {
        rippleAnimation = requestAnimationFrame(animateRipple);
      } else {
        try {
          if (container && container.children && container.children.includes(ripple)) {
            container.removeChild(ripple);
          }
        } catch (error) {
          console.warn('Error removing ripple:', error);
        }
        rippleAnimation = null;
      }
    }
    
    animateRipple();
  }
  
  // Update visual state
  function updateState(newState) {
    if (currentState === newState) return;
    
    currentState = newState;
    drawShadow();
    drawBackground();
    updateTextColor();
    
    // Scale animation
    if (newState === 'hover') {
      animateScale(MATERIAL_MOTION.hover.scale, MATERIAL_MOTION.hover.duration);
    } else if (newState === 'pressed') {
      animateScale(MATERIAL_MOTION.press.scale, MATERIAL_MOTION.press.duration);
    } else {
      animateScale(1, MATERIAL_MOTION.duration.normal);
    }
  }
  
  // Event handlers
  container.on('pointerover', () => {
    if (isEnabled && !isPressed) {
      updateState('hover');
    }
  });
  
  container.on('pointerout', () => {
    if (isEnabled) {
      isPressed = false;
      updateState('default');
    }
  });
  
  container.on('pointerdown', (event) => {
    if (isEnabled) {
      isPressed = true;
      updateState('pressed');
      
      // Create ripple effect
      const localPoint = event.data.getLocalPosition(container);
      createRipple(localPoint);
    }
  });
  
  container.on('pointerup', () => {
    if (isEnabled) {
      isPressed = false;
      updateState('hover');
    }
  });
  
  container.on('pointertap', () => {
    if (isEnabled && clickHandler) {
      clickHandler();
    }
  });
  
  // Initial layout and draw
  layoutContent();
  drawShadow();
  drawBackground();
  updateTextColor();
  
  // Public API
  return {
    container,
    width: finalWidth,
    height,
    
    // Methods
    onClick(handler) {
      clickHandler = handler;
    },
    
    setEnabled(enabled) {
      isEnabled = enabled;
      container.cursor = enabled ? 'pointer' : 'default';
      updateState(enabled ? 'default' : 'disabled');
    },
    
    setText(newText) {
      text.text = newText;
      layoutContent();
      drawBackground();
    },
    
    setWidth(newWidth) {
      finalWidth = newWidth;
      layoutContent();
      drawShadow();
      drawBackground();
    },
    
    // State queries
    get enabled() { return isEnabled; },
    get text() { return text.text; },
  };
}

/**
 * Create a floating action button
 */
export function createFloatingActionButton(icon, options = {}) {
  return createMaterialButton('', {
    variant: 'floating',
    icon,
    ...options,
  });
}

/**
 * Create an icon button
 */
export function createIconButton(icon, options = {}) {
  return createMaterialButton('', {
    variant: 'text',
    icon,
    size: 'small',
    width: MATERIAL_BUTTONS.sizes.small.height, // Square
    ...options,
  });
}
