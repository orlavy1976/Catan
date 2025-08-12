// docs/src/catan/ui/materialHUD.js
// 🎨 Material Design HUD with enhanced action buttons
// Modern replacement for the traditional HUD using Material Design system

import { createMaterialButton } from "./materialButton.js";
import { makeDiceView } from "./diceView.js";
import { createMaterialNotificationSystem } from "./materialNotifications.js";
import { 
  createMaterialText, 
  createMaterialContainer,
  drawMaterialCard,
  animateScale 
} from "../../utils/materialUI.js";
import { 
  MATERIAL_COLORS, 
  MATERIAL_SPACING,
  MATERIAL_MOTION 
} from "../../config/materialDesign.js";

/**
 * Create a bordered section for button groups
 * @param {string} title - Section title
 * @param {number} width - Section width
 * @returns {PIXI.Container} Section container
 */
function createButtonSection(title, width) {
  const section = new PIXI.Container();
  
  // Create background with border
  const background = new PIXI.Graphics();
  section.addChild(background);
  
  // Section title
  const titleText = createMaterialText(title, 'label', {
    fill: MATERIAL_COLORS.neutral[300],
    fontSize: 12
  });
  titleText.x = MATERIAL_SPACING[3];
  titleText.y = MATERIAL_SPACING[2];
  section.addChild(titleText);
  
  // Store section properties for layout
  section.sectionWidth = width;
  section.sectionTitle = titleText;
  section.sectionBackground = background;
  section.sectionButtons = []; // Use different name to avoid conflicts
  
  return section;
}

/**
 * Create a Material Design HUD
 * @param {PIXI.Application} app - PIXI application
 * @param {PIXI.Container} root - Root container
 * @param {Function} onRoll - Roll dice callback
 * @param {Function} onEndTurn - End turn callback
 * @param {Function} onBuildRoad - Build road callback
 * @param {Function} onBuildSettlement - Build settlement callback
 * @param {Function} onBuildCity - Build city callback
 * @param {Function} onTrade - Trade callback
 * @param {Function} onBuyDev - Buy dev card callback
 * @param {Function} onPlayDev - Play dev card callback
 * @param {Function} onResetGame - Reset game callback
 * @returns {object} HUD API
 */
export function createMaterialHUD(app, root, onRoll, onEndTurn, onBuildRoad, onBuildSettlement, onBuildCity, onTrade, onBuyDev, onPlayDev, onResetGame) {
  const hud = new PIXI.Container();
  root.addChild(hud);
  
  // Enable z-index sorting for proper layering
  root.sortableChildren = true;

  // Layout constants
  const pad = MATERIAL_SPACING[5]; // 20px
  const gap = MATERIAL_SPACING[3]; // 12px
  const gapLarge = MATERIAL_SPACING[4]; // 16px
  const colWidth = 220; // Slightly wider for Material buttons

  // Create Material Design buttons with appropriate variants and icons
  const rollBtn = createMaterialButton("🎲 Roll Dice", {
    variant: 'filled',
    size: 'large',
    width: 180,
  });

  const buildSettlementBtn = createMaterialButton("🏠 Settlement", {
    variant: 'filled',
    size: 'medium',
    width: 200,
  });

  const buildRoadBtn = createMaterialButton("🛤️ Road", {
    variant: 'filled',
    size: 'medium',
    width: 180,
  });

  const buildCityBtn = createMaterialButton("🏙️ City", {
    variant: 'filled',
    size: 'medium',
    width: 180,
  });

  const tradeBtn = createMaterialButton("🔄 Trade", {
    variant: 'filled',
    size: 'medium',
    width: 160,
  });

  const buyDevBtn = createMaterialButton("🎯 Buy Dev", {
    variant: 'filled',
    size: 'medium',
    width: 180,
  });

  const playDevBtn = createMaterialButton("🎴 Play Dev", {
    variant: 'filled',
    size: 'medium',
    width: 160,
  });

  const endBtn = createMaterialButton("✅ End Turn", {
    variant: 'confirm',
    size: 'large',
    width: 180,
  });

  const resetBtn = createMaterialButton("⚠️ Reset", {
    variant: 'destructive',
    size: 'small',
    width: 110,
  });

  // Store button references organized by groups
  const rollDiceGroup = [rollBtn];
  
  const buildGroup = [
    buildSettlementBtn,
    buildRoadBtn,
    buildCityBtn
  ];
  
  const gameActionsGroup = [
    tradeBtn,
    buyDevBtn,
    playDevBtn,
    endBtn
  ];

  // Create bordered sections for button groups
  const rollSection = createButtonSection("🎲 Roll Dice", 220);
  const buildSection = createButtonSection("🏗️ Build Actions", 220);
  const actionsSection = createButtonSection("⚡ Game Actions", 220);

  // Add sections to HUD
  hud.addChild(rollSection);
  hud.addChild(buildSection);
  hud.addChild(actionsSection);

  // Add buttons to their respective sections and track them
  rollDiceGroup.forEach(btn => {
    rollSection.addChild(btn.container);
    rollSection.sectionButtons.push(btn.container);
  });
  
  buildGroup.forEach(btn => {
    buildSection.addChild(btn.container);
    buildSection.sectionButtons.push(btn.container);
  });
  
  gameActionsGroup.forEach(btn => {
    actionsSection.addChild(btn.container);
    actionsSection.sectionButtons.push(btn.container);
  });
  
  // Add reset button separately (positioned in top-right)
  hud.addChild(resetBtn.container);

  // Dice view (keep existing)
  const dice = makeDiceView();
  hud.addChild(dice.container);

  // Material Design Notification System - add to root, not hud
  const notifications = createMaterialNotificationSystem(app);
  root.addChild(notifications.container);

  // Material Design text elements
  const bannerText = createMaterialText("", 'gameTitle');
  hud.addChild(bannerText);

  // Remove old bottomText and resultText - notifications handle this now

  // Layout function
  function layout() {
    const screenWidth = app.renderer.width;
    const screenHeight = app.renderer.height;
    
    // Responsive column positioning
    const scaleFactor = Math.min(1, screenWidth / 1200);
    const responsiveColWidth = Math.max(180, colWidth * scaleFactor);
    const responsivePad = Math.max(12, pad * scaleFactor);
    const responsiveGap = Math.max(8, gap * scaleFactor);
    const responsiveGapLarge = Math.max(12, gapLarge * scaleFactor);
    
    // Position reset button in top-right corner (separate from main column)
    resetBtn.container.x = screenWidth - responsivePad - 130; // 130px from right edge
    resetBtn.container.y = responsivePad; // Top padding
    resetBtn.container.zIndex = 1000; // Ensure it's on top
    
    // Position action sections column on the right (leave space for reset button)
    const colX = screenWidth - responsivePad - responsiveColWidth;
    let cy = responsivePad; // Start well below reset button

    // Position dice with responsive sizing (in roll section area)
    const diceW = Math.max(120, 100 * scaleFactor);
    dice.container.x = colX + Math.round((responsiveColWidth - diceW) / 2);
    dice.container.y = cy;
    cy += Math.max(40, 40 * scaleFactor) + responsiveGapLarge;

    // Layout sections with proper spacing
    const sections = [rollSection, buildSection, actionsSection];
    
    sections.forEach((section, sectionIndex) => {
      // Position section
      section.x = colX;
      section.y = cy;
      
      // Layout buttons within section
      layoutSection(section, scaleFactor, responsiveGap);
      
      // Move to next section position
      cy += section.sectionHeight + responsiveGapLarge;
    });

    // Position banner text responsively
    bannerText.x = responsivePad;
    bannerText.y = responsivePad;
    
    // Responsive text sizing
    const textScale = Math.max(0.8, scaleFactor);
    bannerText.scale.set(textScale);
    
    // Layout notification system
    notifications.layout();
    
    console.log("🎨 HUD layout - Screen:", `${screenWidth}x${screenHeight}`, "Scale:", scaleFactor.toFixed(2), "ColX:", colX);
  }

  // Helper function to layout a section
  function layoutSection(section, scaleFactor, gap) {
    const sectionPadding = MATERIAL_SPACING[3];
    const titleHeight = 20;
    let contentHeight = titleHeight + sectionPadding;
    
    // Position buttons within section
    section.sectionButtons.forEach((btnContainer, index) => {
      const buttonY = titleHeight + sectionPadding + (index * (48 + gap));
      btnContainer.x = sectionPadding;
      btnContainer.y = buttonY;
      
      // Scale button if needed
      const buttonScale = Math.max(0.8, scaleFactor);
      btnContainer.scale.set(buttonScale);
      
      contentHeight = buttonY + (48 * buttonScale) + sectionPadding;
    });
    
    // Update section background
    const bg = section.sectionBackground;
    bg.clear();
    drawMaterialCard(bg, section.sectionWidth, contentHeight, {
      elevation: 1,
      backgroundColor: MATERIAL_COLORS.surface.tertiary,
      borderRadius: 8,
      border: {
        width: 1,
        color: MATERIAL_COLORS.neutral[500],
        alpha: 0.3
      }
    });
    
    // Store section height for next section positioning
    section.sectionHeight = contentHeight;
  }

  // Initial layout
  layout();
  
  // Re-layout on window resize
  window.addEventListener("resize", layout);

  // Enhanced button interactions with Material animations
  function addMaterialFeedback(button, callback) {
    button.onClick(async () => {
      // Add extra visual feedback
      await animateScale(button.container, 0.95, 80);
      await animateScale(button.container, 1, 80);
      callback?.();
    });
  }

  // Wire up button callbacks with Material feedback
  rollBtn.onClick(async () => {
    // Special animation for roll dice
    await animateScale(rollBtn.container, 1.05, 100);
    
    // Start dice shake animation (will be finished after onRoll sets the values)
    const shakePromise = dice.shake(600);
    
    // Call the roll callback to get dice values
    onRoll?.();
    
    // Wait for shake to complete
    await shakePromise;
    
    await animateScale(rollBtn.container, 1, 100);
  });

  addMaterialFeedback(endBtn, onEndTurn);
  addMaterialFeedback(buildRoadBtn, onBuildRoad);
  addMaterialFeedback(buildSettlementBtn, onBuildSettlement);
  addMaterialFeedback(buildCityBtn, onBuildCity);
  addMaterialFeedback(tradeBtn, onTrade);
  addMaterialFeedback(buyDevBtn, onBuyDev);
  addMaterialFeedback(playDevBtn, onPlayDev);
  addMaterialFeedback(resetBtn, onResetGame);

  // Public API functions
  function setBanner(text) {
    bannerText.text = text;
  }

  function setBottom(text) {
    // Only use the new action instruction panel
    notifications.setActionText(text);
  }

  function showResult(text, type = 'info', duration = 4000) {
    // Only use the new notification system now
    notifications.addNotification(text, type, duration);
  }

  // Enhanced notification functions
  function showSuccess(text, duration = 3000) {
    showResult(text, 'success', duration);
  }

  function showWarning(text, duration = 5000) {
    showResult(text, 'warning', duration);
  }

  function showError(text, duration = 6000) {
    showResult(text, 'error', duration);
  }

  function showInfo(text, duration = 4000) {
    showResult(text, 'info', duration);
  }

  // Button state management functions
  function setRollEnabled(enabled) {
    rollBtn.setEnabled(enabled);
    if (!enabled) dice.clear();
  }

  function setEndEnabled(enabled) {
    endBtn.setEnabled(enabled);
  }

  function setBuildRoadEnabled(enabled) {
    buildRoadBtn.setEnabled(enabled);
  }

  function setBuildSettlementEnabled(enabled) {
    buildSettlementBtn.setEnabled(enabled);
  }

  function setBuildCityEnabled(enabled) {
    buildCityBtn.setEnabled(enabled);
  }

  function setTradeEnabled(enabled) {
    tradeBtn.setEnabled(enabled);
  }

  function setBuyDevEnabled(enabled) {
    buyDevBtn.setEnabled(enabled);
  }

  function setPlayDevEnabled(enabled) {
    playDevBtn.setEnabled(enabled);
  }

  function setResetEnabled(enabled) {
    resetBtn.setEnabled(enabled);
  }

  // Add visual state indicators for better UX
  function updateButtonStates() {
    // This could be expanded to show more visual feedback
    // like changing button colors based on resource availability
  }

  return {
    container: hud,
    layout,
    dice,
    setBanner,
    setBottom,
    showResult,
    
    // Enhanced notification methods
    showSuccess,
    showWarning,
    showError,
    showInfo,
    
    // Direct access to notification system
    notifications,
    
    setRollEnabled,
    setEndEnabled,
    setBuildRoadEnabled,
    setBuildSettlementEnabled,
    setBuildCityEnabled,
    setTradeEnabled,
    setBuyDevEnabled,
    setPlayDevEnabled,
    setResetEnabled,
    updateButtonStates, // New function for enhanced state management
  };
}
