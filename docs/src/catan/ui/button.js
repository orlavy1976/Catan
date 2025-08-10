import { 
  DIMENSIONS, 
  TYPOGRAPHY, 
  ALPHA, 
  EFFECTS,
  UI_STYLES
} from "../../config/design.js";

import {
  drawButton,
  createStyledText,
  scaleTo,
  getHoverColor
} from "../../utils/ui.js";

export function makeButton(label, width = DIMENSIONS.button.defaultWidth, variant = 'primary') {
  const height = DIMENSIONS.button.height;
  const container = new PIXI.Container();

  const bg = new PIXI.Graphics();
  container.addChild(bg);

  // Create text using design system
  const txt = createStyledText(label, 'button');
  txt.anchor.set(0.5);
  txt.x = width / 2; 
  txt.y = height / 2;
  container.addChild(txt);

  // Interactive setup
  container.eventMode = "static";
  container.cursor = "pointer";

  let enabled = true;
  let clickHandler = null;
  let isHovered = false;

  // Mouse events for better feedback
  container.on("pointertap", () => { 
    if (enabled) {
      // Small feedback animation on click
      scaleTo(container, 0.95, EFFECTS.animation.fast);
      setTimeout(() => scaleTo(container, 1, EFFECTS.animation.fast), 100);
      clickHandler?.(); 
    }
  });

  container.on("pointerenter", () => {
    if (enabled) {
      isHovered = true;
      updateStyle();
      scaleTo(container, EFFECTS.hover.scale, EFFECTS.animation.fast);
    }
  });

  container.on("pointerleave", () => {
    isHovered = false;
    updateStyle();
    scaleTo(container, 1, EFFECTS.animation.fast);
  });

  function setEnabled(e) {
    enabled = e;
    container.alpha = e ? 1 : ALPHA.disabled;
    container.eventMode = e ? "static" : "none";
    container.cursor = e ? "pointer" : "default";
    updateStyle();
  }

  function onClick(fn) { 
    clickHandler = fn; 
  }

  function updateStyle() {
    drawBg();
  }

  function drawBg() {
    const isPrimary = variant === 'primary';
    
    bg.clear();
    
    if (enabled && isHovered) {
      // Hover state - slightly brighter
      const style = isPrimary ? UI_STYLES.primaryButton : UI_STYLES.secondaryButton;
      const hoverAlpha = Math.min(1, style.background.alpha + EFFECTS.hover.alphaChange);
      
      bg.beginFill(style.background.color, hoverAlpha);
      bg.drawRoundedRect(0, 0, width, height, style.borderRadius);
      bg.endFill();
      
      // Stronger border on hover
      bg.lineStyle({ 
        width: style.border.width, 
        color: style.border.color, 
        alpha: style.border.alpha + 0.2 
      });
      bg.drawRoundedRect(0, 0, width, height, style.borderRadius);
    } else {
      // Normal state - use design system
      drawButton(bg, width, height, isPrimary);
    }
  }

  // Initial draw
  updateStyle();

  return {
    container,
    width, 
    height,
    setEnabled,
    onClick,
    updateStyle, // Expose for external style updates
  };
}
