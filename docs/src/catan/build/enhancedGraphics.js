// docs/src/catan/build/enhancedGraphics.js
// 🏘️ Enhanced Building Graphics with Material Design and Architectural Details

import { PLAYER_COLORS } from "../../config/constants.js";
import { MATERIAL_COLORS } from "../../config/materialDesign.js";
import { animateScale, animateFade } from "../../utils/materialUI.js";

/**
 * Create an enhanced road with improved visual style
 * @param {object} start - Start vertex {x, y}
 * @param {object} end - End vertex {x, y}
 * @param {number} color - Player color
 * @param {object} options - Rendering options
 * @returns {PIXI.Graphics} Road graphics object
 */
export function createEnhancedRoad(start, end, color, options = {}) {
  const {
    scale = 1,
    showDetails = true,
    animate = true
  } = options;

  const g = new PIXI.Graphics();

  // Calculate road properties
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // קיצור הדרך - לא מגיעה עד הצומת
  const shortenDistance = 18 * scale; // מרחק הקיצור מכל צד
  const shortenRatio = shortenDistance / length;
  
  // נקודות התחלה וסיום מקוצרות
  const shortenedStart = {
    x: start.x + dx * shortenRatio,
    y: start.y + dy * shortenRatio
  };
  
  const shortenedEnd = {
    x: end.x - dx * shortenRatio,
    y: end.y - dy * shortenRatio
  };
  
  // חישוב מחדש של האורך והכיוון
  const newDx = shortenedEnd.x - shortenedStart.x;
  const newDy = shortenedEnd.y - shortenedStart.y;
  const newLength = Math.sqrt(newDx * newDx + newDy * newDy);
  
  const roadWidth = 10 * scale;
  const shadowOffset = 1.5 * scale;

  // === ROAD SHADOW (עדין יותר) ===
  g.lineStyle({ 
    width: roadWidth + 1, 
    color: 0x000000, 
    alpha: 0.12,
    cap: 'round' 
  });
  g.moveTo(shortenedStart.x + shadowOffset, shortenedStart.y + shadowOffset);
  g.lineTo(shortenedEnd.x + shadowOffset, shortenedEnd.y + shadowOffset);

  // === ROAD BASE (צבע יותר עדין) ===
  const darkColor = adjustBrightness(color, -0.3);
  g.lineStyle({ 
    width: roadWidth, 
    color: darkColor, 
    alpha: 0.7,
    cap: 'round' 
  });
  g.moveTo(shortenedStart.x, shortenedStart.y);
  g.lineTo(shortenedEnd.x, shortenedEnd.y);

  // === MAIN ROAD SURFACE (פחות בולט) ===
  g.lineStyle({ 
    width: roadWidth - 1, 
    color: color, 
    alpha: 0.8,
    cap: 'round' 
  });
  g.moveTo(shortenedStart.x, shortenedStart.y);
  g.lineTo(shortenedEnd.x, shortenedEnd.y);

  if (showDetails && newLength > 20) { // רק אם הדרך מספיק ארוכה אחרי הקיצור
    // === ROAD CENTER LINE (יותר עדין) ===
    const centerLineColor = adjustBrightness(color, 0.2);
    g.lineStyle({ 
      width: 0.8 * scale, 
      color: centerLineColor, 
      alpha: 0.4
    });
    g.moveTo(shortenedStart.x, shortenedStart.y);
    g.lineTo(shortenedEnd.x, shortenedEnd.y);

    // === ROAD TEXTURE SPOTS (פחות בולטים) ===
    const numSpots = Math.max(1, Math.floor(newLength / 35));
    for (let i = 0; i < numSpots; i++) {
      const t = (i + 0.5) / numSpots + (Math.random() - 0.5) * 0.15;
      const spotX = shortenedStart.x + newDx * t;
      const spotY = shortenedStart.y + newDy * t;
      
      const spotColor = adjustBrightness(color, (Math.random() - 0.5) * 0.3);
      g.beginFill(spotColor, 0.25);
      g.drawCircle(spotX, spotY, 0.8 + Math.random() * 0.8);
      g.endFill();
    }
  }

  // Animation effect
  if (animate) {
    g.alpha = 0;
    animateFade(g, 0.8, 400);
  }

  return g;
}

/**
 * Create an enhanced settlement with isometric perspective and architectural details
 * @param {number} color - Player color
 * @param {object} options - Rendering options
 * @returns {PIXI.Container} Settlement container with all graphical elements
 */
export function createEnhancedSettlement(color, options = {}) {
  const {
    scale = 1,
    showDetails = true,
    animate = true
  } = options;

  const container = new PIXI.Container();
  container.sortableChildren = true;

  // === SHADOW (Material Design elevation) ===
  const shadow = new PIXI.Graphics();
  shadow.beginFill(0x000000, 0.15);
  // Elliptical shadow for 3D effect
  shadow.drawEllipse(0, 6, 18 * scale, 8 * scale);
  shadow.endFill();
  shadow.zIndex = 0;
  container.addChild(shadow);

  // === BASE FOUNDATION ===
  const foundation = new PIXI.Graphics();
  foundation.beginFill(MATERIAL_COLORS.neutral[600]);
  foundation.drawRoundedRect(-14 * scale, 4 * scale, 28 * scale, 6 * scale, 2 * scale);
  foundation.endFill();
  foundation.zIndex = 1;
  container.addChild(foundation);

  // === MAIN BUILDING STRUCTURE ===
  const mainBuilding = new PIXI.Graphics();
  
  // Building walls with gradient effect
  const wallColor = color;
  const wallDarkColor = adjustBrightness(wallColor, -0.2);
  
  // Front wall
  mainBuilding.beginFill(wallColor);
  mainBuilding.drawPolygon([
    -12 * scale, -12 * scale,  // Bottom left
    -12 * scale, 6 * scale,    // Top left
    12 * scale, 6 * scale,     // Top right
    12 * scale, -12 * scale    // Bottom right
  ]);
  mainBuilding.endFill();

  // Side wall (isometric effect)
  mainBuilding.beginFill(wallDarkColor);
  mainBuilding.drawPolygon([
    12 * scale, -12 * scale,   // Front bottom right
    16 * scale, -16 * scale,   // Back bottom right
    16 * scale, 2 * scale,     // Back top right
    12 * scale, 6 * scale      // Front top right
  ]);
  mainBuilding.endFill();

  mainBuilding.zIndex = 2;
  container.addChild(mainBuilding);

  // === ROOF ===
  const roof = new PIXI.Graphics();
  const roofColor = MATERIAL_COLORS.neutral[700];
  const roofLightColor = adjustBrightness(roofColor, 0.1);
  
  // Main roof surface
  roof.beginFill(roofColor);
  roof.drawPolygon([
    0 * scale, -24 * scale,    // Peak
    -14 * scale, -12 * scale,  // Left edge
    14 * scale, -12 * scale    // Right edge
  ]);
  roof.endFill();

  // Roof side (isometric)
  roof.beginFill(roofLightColor);
  roof.drawPolygon([
    0 * scale, -24 * scale,    // Peak
    14 * scale, -12 * scale,   // Front right
    18 * scale, -16 * scale,   // Back right
    4 * scale, -28 * scale     // Back peak
  ]);
  roof.endFill();

  roof.zIndex = 3;
  container.addChild(roof);

  if (showDetails) {
    // === ARCHITECTURAL DETAILS ===
    
    // Door
    const door = new PIXI.Graphics();
    door.beginFill(MATERIAL_COLORS.neutral[800]);
    door.drawRoundedRect(-3 * scale, -2 * scale, 6 * scale, 8 * scale, 1 * scale);
    door.endFill();
    
    // Door handle
    door.beginFill(MATERIAL_COLORS.secondary[400]);
    door.drawCircle(2 * scale, 2 * scale, 0.8 * scale);
    door.endFill();
    
    door.zIndex = 4;
    container.addChild(door);

    // Windows
    const windowColor = MATERIAL_COLORS.tertiary[200];
    
    // Left window
    const leftWindow = new PIXI.Graphics();
    leftWindow.beginFill(windowColor);
    leftWindow.drawRoundedRect(-9 * scale, -6 * scale, 4 * scale, 4 * scale, 0.5 * scale);
    leftWindow.endFill();
    // Window cross
    leftWindow.lineStyle(0.8 * scale, MATERIAL_COLORS.neutral[700]);
    leftWindow.moveTo(-7 * scale, -6 * scale);
    leftWindow.lineTo(-7 * scale, -2 * scale);
    leftWindow.moveTo(-9 * scale, -4 * scale);
    leftWindow.lineTo(-5 * scale, -4 * scale);
    leftWindow.zIndex = 4;
    container.addChild(leftWindow);

    // Right window
    const rightWindow = new PIXI.Graphics();
    rightWindow.beginFill(windowColor);
    rightWindow.drawRoundedRect(5 * scale, -6 * scale, 4 * scale, 4 * scale, 0.5 * scale);
    rightWindow.endFill();
    // Window cross
    rightWindow.lineStyle(0.8 * scale, MATERIAL_COLORS.neutral[700]);
    rightWindow.moveTo(7 * scale, -6 * scale);
    rightWindow.lineTo(7 * scale, -2 * scale);
    rightWindow.moveTo(5 * scale, -4 * scale);
    rightWindow.lineTo(9 * scale, -4 * scale);
    rightWindow.zIndex = 4;
    container.addChild(rightWindow);

    // Chimney
    const chimney = new PIXI.Graphics();
    chimney.beginFill(MATERIAL_COLORS.neutral[800]);
    chimney.drawRect(8 * scale, -20 * scale, 3 * scale, 8 * scale);
    chimney.endFill();
    
    // Chimney top
    chimney.beginFill(MATERIAL_COLORS.neutral[700]);
    chimney.drawRect(7.5 * scale, -21 * scale, 4 * scale, 2 * scale);
    chimney.endFill();
    
    chimney.zIndex = 5;
    container.addChild(chimney);

    // Smoke particles (animated)
    if (animate) {
      createSmokeParticles(container, 9.5 * scale, -21 * scale, scale);
    }
  }

  // === BUILDING OUTLINE ===
  const outline = new PIXI.Graphics();
  outline.lineStyle(2 * scale, 0x000000, 0.3);
  outline.drawPolygon([
    -12 * scale, -12 * scale,  // Start at front bottom left
    -14 * scale, -12 * scale,  // Roof left
    0 * scale, -24 * scale,    // Peak
    14 * scale, -12 * scale,   // Roof right
    12 * scale, -12 * scale,   // Front bottom right
    12 * scale, 6 * scale,     // Front bottom right
    -12 * scale, 6 * scale     // Front bottom left
  ]);
  outline.zIndex = 6;
  container.addChild(outline);

  // Add entrance animation
  if (animate) {
    container.alpha = 0;
    container.scale.set(0.1);
    animateScale(container, scale, 400);
    animateFade(container, 1, 400);
  }

  return container;
}

/**
 * Create animated smoke particles from chimney
 * @param {PIXI.Container} parent - Parent container
 * @param {number} x - X position
 * @param {number} y - Y position  
 * @param {number} scale - Scale factor
 */
function createSmokeParticles(parent, x, y, scale) {
  const particleCount = 3;
  
  for (let i = 0; i < particleCount; i++) {
    setTimeout(() => {
      const particle = new PIXI.Graphics();
      particle.beginFill(0xffffff, 0.4);
      particle.drawCircle(0, 0, (1.5 + Math.random()) * scale);
      particle.endFill();
      
      particle.x = x + (Math.random() - 0.5) * 2 * scale;
      particle.y = y;
      particle.zIndex = 10;
      parent.addChild(particle);
      
      // Animate particle rising and fading
      const duration = 2000 + Math.random() * 1000;
      const targetY = y - 20 * scale - Math.random() * 10 * scale;
      
      animateParticle(particle, targetY, duration);
      
    }, i * 800 + Math.random() * 400);
  }
}

/**
 * Animate a smoke particle
 * @param {PIXI.Graphics} particle - Particle to animate
 * @param {number} targetY - Target Y position
 * @param {number} duration - Animation duration
 */
function animateParticle(particle, targetY, duration) {
  const startY = particle.y;
  const startTime = Date.now();
  
  function updateParticle() {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;
    
    if (progress >= 1) {
      particle.parent?.removeChild(particle);
      particle.destroy();
      return;
    }
    
    // Ease out motion
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    particle.y = startY + (targetY - startY) * easeProgress;
    particle.x += (Math.random() - 0.5) * 0.5; // Slight horizontal drift
    particle.alpha = 1 - progress; // Fade out
    particle.scale.set(1 + progress * 0.5); // Grow slightly
    
    requestAnimationFrame(updateParticle);
  }
  
  updateParticle();
}

/**
 * Adjust color brightness
 * @param {number} color - Original color
 * @param {number} factor - Brightness factor (-1 to 1)
 * @returns {number} Adjusted color
 */
function adjustBrightness(color, factor) {
  const r = (color >> 16) & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = color & 0xFF;
  
  const newR = Math.max(0, Math.min(255, r + (255 - r) * factor));
  const newG = Math.max(0, Math.min(255, g + (255 - g) * factor));
  const newB = Math.max(0, Math.min(255, b + (255 - b) * factor));
  
  return (newR << 16) | (newG << 8) | newB;
}
